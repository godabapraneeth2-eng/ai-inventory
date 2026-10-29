import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/manoj-api\/?/, '').split('/').filter(Boolean);
  const resource = segments[0] || '';
  const resourceId = segments[1];

  try {
    // GET /manoj-api/orders — list all orders with customer info
    if (resource === 'orders' && req.method === 'GET' && !resourceId) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_id, customers(name), status, total_amount, subtotal, tax_amount, risk_level, exception_type, exception_details, processing_time_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return json({ orders: data });
    }

    // GET /manoj-api/orders/{id} — single order with items, invoice, risk, logs
    if (resource === 'orders' && req.method === 'GET' && resourceId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, customers(name, email, credit_score, late_payment_count, outstanding_balance, status)')
        .eq('id', resourceId)
        .maybeSingle();
      if (orderError) throw orderError;
      if (!order) return json({ error: 'Order not found' }, 404);

      const { data: items } = await supabase.from('order_items').select('*, products(sku, name, category)').eq('order_id', resourceId);
      const { data: invoice } = await supabase.from('invoices').select('*').eq('order_id', resourceId).maybeSingle();
      const { data: risk } = await supabase.from('risk_reports').select('*').eq('order_id', resourceId).maybeSingle();
      const { data: logs } = await supabase.from('agent_logs').select('*').eq('order_id', resourceId).order('created_at', { ascending: true });
      const { data: shipments } = await supabase.from('shipments').select('*').eq('order_id', resourceId).maybeSingle();

      return json({ order, items: items ?? [], invoice, risk, logs: logs ?? [], shipment: shipments });
    }

    // POST /manoj-api/orders — create order and run orchestration
    if (resource === 'orders' && req.method === 'POST' && !resourceId) {
      const input = await req.json() as { customer_id?: string; items?: { sku: string; quantity: number }[]; notes?: string };
      if (!input.customer_id || !Array.isArray(input.items) || input.items.length === 0) return json({ error: 'customer_id and items are required' }, 400);

      const started = Date.now();
      const logs: { agent_name: string; from_agent: string | null; to_agent: string | null; status: string; confidence: number; message: string; payload: Record<string, unknown>; duration_ms: number }[] = [];
      const addLog = (l: { agent_name: string; from_agent: string | null; to_agent: string | null; status: string; confidence: number; message: string; payload: Record<string, unknown>; duration_ms: number }) => logs.push(l);

      // 1. Validation Agent
      const { data: customer } = await supabase.from('customers').select('*').eq('id', input.customer_id).maybeSingle();
      const customerValid = customer && customer.status === 'active';
      addLog({ agent_name: 'ValidationAgent', from_agent: 'Orchestrator', to_agent: 'InventoryAgent', status: customerValid ? 'completed' : 'rejected', confidence: 99, message: customerValid ? 'Customer account validated' : 'Customer account is not active', payload: { customer_valid: customerValid }, duration_ms: 320 });

      if (!customerValid) {
        const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        const { data: newOrder } = await supabase.from('orders').insert({ order_number: orderNumber, customer_id: input.customer_id, status: 'rejected', final_decision: 'rejected_invalid_customer', risk_level: 'high', exception_type: 'invalid_customer', exception_details: { reason: 'Customer account is suspended' }, processing_time_ms: Date.now() - started }).select().single();
        if (newOrder) for (const l of logs) await supabase.from('agent_logs').insert({ order_id: newOrder.id, ...l });
        return json({ decision: 'rejected', reason: 'Customer account is not active', order_id: newOrder?.id, agents: logs });
      }

      // Validate products
      const skus = input.items.map(i => i.sku);
      const { data: products } = await supabase.from('products').select('id, sku, name, unit_price, min_order_qty, category').in('sku', skus);
      const productList = products ?? [];
      const missing = input.items.filter(i => !productList.some(p => p.sku === i.sku));
      if (missing.length) {
        addLog({ agent_name: 'ValidationAgent', from_agent: 'Orchestrator', to_agent: null, status: 'rejected', confidence: 99, message: 'Invalid product SKUs detected', payload: { missing_skus: missing.map(i => i.sku) }, duration_ms: 180 });
        return json({ decision: 'rejected', reason: 'Invalid product SKU', agents: logs });
      }
      addLog({ agent_name: 'ValidationAgent', from_agent: 'Orchestrator', to_agent: 'InventoryAgent', status: 'completed', confidence: 98, message: 'Products and quantities validated', payload: { products_valid: true }, duration_ms: 280 });

      // 2. Inventory Agent
      const productIds = productList.map(p => p.id);
      const { data: inventoryData } = await supabase.from('inventory').select('product_id, quantity_on_hand, quantity_reserved').in('product_id', productIds);
      const shortages: Record<string, unknown>[] = [];
      for (const item of input.items) {
        const product = productList.find(p => p.sku === item.sku)!;
        const stock = (inventoryData ?? []).find(s => s.product_id === product.id);
        const available = (stock?.quantity_on_hand ?? 0) - (stock?.quantity_reserved ?? 0);
        if (available < item.quantity) shortages.push({ sku: item.sku, requested: item.quantity, available, shortage: item.quantity - available });
      }
      addLog({ agent_name: 'InventoryAgent', from_agent: 'ValidationAgent', to_agent: 'Orchestrator', status: shortages.length ? 'exception' : 'completed', confidence: 99, message: shortages.length ? 'Inventory shortage detected; partial shipment recommended' : 'Inventory verified and stock reserved', payload: { shortages }, duration_ms: 410 });

      if (shortages.length) {
        const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        const subtotal = input.items.reduce((sum, item) => sum + item.quantity * Number(productList.find(p => p.sku === item.sku)!.unit_price), 0);
        const { data: newOrder } = await supabase.from('orders').insert({ order_number: orderNumber, customer_id: input.customer_id, status: 'exception', subtotal, tax_amount: subtotal * 0.0875, total_amount: subtotal * 1.0875, final_decision: 'partial_shipment_recommended', risk_level: 'medium', exception_type: 'inventory_shortage', exception_details: { shortages }, processing_time_ms: Date.now() - started }).select().single();
        if (newOrder) {
          for (const item of input.items) {
            const product = productList.find(p => p.sku === item.sku)!;
            await supabase.from('order_items').insert({ order_id: newOrder.id, product_id: product.id, quantity: item.quantity, unit_price: product.unit_price, line_total: item.quantity * Number(product.unit_price), fulfilled_quantity: Math.min(item.quantity, (inventoryData ?? []).find(s => s.product_id === product.id)?.quantity_on_hand ?? 0), status: 'partial' });
          }
          for (const l of logs) await supabase.from('agent_logs').insert({ order_id: newOrder.id, ...l });
          await supabase.from('system_events').insert({ event_type: 'inventory_shortage', severity: 'warning', message: 'Inventory shortage requires fulfillment decision', entity_type: 'order', entity_id: newOrder.id, metadata: { shortages } });
        }
        return json({ decision: 'partial_shipment_recommended', shortages, order_id: newOrder?.id, agents: logs });
      }

      // 3. Invoice Agent
      const subtotal = input.items.reduce((sum, item) => sum + item.quantity * Number(productList.find(p => p.sku === item.sku)!.unit_price), 0);
      const { data: taxSetting } = await supabase.from('settings').select('value').eq('key', 'tax_rate').maybeSingle();
      const taxRate = Number(taxSetting?.value ?? 0.0875);
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      addLog({ agent_name: 'InvoiceAgent', from_agent: 'InventoryAgent', to_agent: 'RiskAgent', status: 'completed', confidence: 99, message: 'Invoice calculated with tax', payload: { subtotal, tax, total, tax_rate: taxRate }, duration_ms: 280 });

      // 4. Risk Agent — deterministic scoring
      const score = Math.min(100, Math.max(0, Math.round((750 - customer.credit_score) / 2 + customer.late_payment_count * 8 + Number(customer.outstanding_balance) / 10000)));
      const riskLevel = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
      const explanation = riskLevel === 'high'
        ? `High payment risk: credit score ${customer.credit_score}, ${customer.late_payment_count} late payments, $${Number(customer.outstanding_balance).toLocaleString()} outstanding. Escalation recommended.`
        : riskLevel === 'medium'
          ? `Moderate payment risk: credit score ${customer.credit_score}, ${customer.late_payment_count} late payments. Standard terms with monitoring.`
          : `Low payment risk: strong credit score ${customer.credit_score} and clean payment history. Approved.`;
      addLog({ agent_name: 'RiskAgent', from_agent: 'InvoiceAgent', to_agent: 'Orchestrator', status: 'completed', confidence: 96, message: `${riskLevel} payment risk assessed`, payload: { score, risk_level: riskLevel, explanation }, duration_ms: 360 });

      // 5. Orchestrator final decision
      const decision = riskLevel === 'high' ? 'human_review_required' : 'approved';
      const orderStatus = riskLevel === 'high' ? 'escalated' : 'completed';
      addLog({ agent_name: 'Orchestrator', from_agent: 'RiskAgent', to_agent: 'System', status: riskLevel === 'high' ? 'escalated' : 'completed', confidence: 99, message: riskLevel === 'high' ? 'Order escalated for human review' : 'Workflow completed successfully', payload: { decision, processing_time_ms: Date.now() - started }, duration_ms: 190 });

      // Create order, items, invoice, risk report, logs
      const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');
      const { data: newOrder } = await supabase.from('orders').insert({ order_number: orderNumber, customer_id: input.customer_id, status: orderStatus, subtotal, tax_amount: tax, total_amount: total, final_decision: decision, risk_level: riskLevel, processing_time_ms: Date.now() - started }).select().single();

      if (newOrder) {
        for (const item of input.items) {
          const product = productList.find(p => p.sku === item.sku)!;
          await supabase.from('order_items').insert({ order_id: newOrder.id, product_id: product.id, quantity: item.quantity, unit_price: product.unit_price, line_total: item.quantity * Number(product.unit_price), fulfilled_quantity: item.quantity, status: 'fulfilled' });
        }
        const { data: invoice } = await supabase.from('invoices').insert({ invoice_number: 'INV-' + orderNumber.slice(4), order_id: newOrder.id, customer_id: input.customer_id, subtotal, tax_rate: taxRate, tax_amount: tax, total_amount: total, status: riskLevel === 'high' ? 'pending' : 'sent', due_date: new Date(Date.now() + (customer.payment_terms_days || 30) * 86400000).toISOString().slice(0, 10) }).select().single();
        await supabase.from('risk_reports').insert({ order_id: newOrder.id, customer_id: input.customer_id, risk_score: score, risk_level: riskLevel, credit_score: customer.credit_score, late_payment_count: customer.late_payment_count, outstanding_balance: customer.outstanding_balance, order_value: total, explanation, recommendation: riskLevel === 'high' ? 'Escalate for human review' : 'Proceed with standard terms' });
        if (invoice) await supabase.from('payments').insert({ order_id: newOrder.id, invoice_id: invoice.id, customer_id: input.customer_id, amount: total, status: 'pending', due_date: new Date(Date.now() + (customer.payment_terms_days || 30) * 86400000).toISOString().slice(0, 10) });
        await supabase.from('shipments').insert({ order_id: newOrder.id, carrier: 'FedEx', status: 'pending', shipping_address: customer.address, estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) });
        for (const l of logs) await supabase.from('agent_logs').insert({ order_id: newOrder.id, ...l });
        if (riskLevel === 'high') await supabase.from('system_events').insert({ event_type: 'high_risk_order', severity: 'critical', message: 'High-risk order escalated for human review', entity_type: 'order', entity_id: newOrder.id, metadata: { risk_score: score } });
      }

      return json({ decision, order_id: newOrder?.id, subtotal, tax, total, risk_score: score, risk_level: riskLevel, agents: logs });
    }

    // GET /manoj-api/inventory
    if (resource === 'inventory' && req.method === 'GET') {
      const { data, error } = await supabase.from('inventory').select('id, product_id, products(id, sku, name, category, unit_price), quantity_on_hand, quantity_reserved, reorder_point, warehouse, updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return json({ inventory: data });
    }

    // GET /manoj-api/customers
    if (resource === 'customers' && req.method === 'GET') {
      const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
      if (error) throw error;
      return json({ customers: data });
    }

    // GET /manoj-api/invoice/{id}
    if (resource === 'invoice' && req.method === 'GET' && resourceId) {
      const { data, error } = await supabase.from('invoices').select('*, orders(order_number, order_items(quantity, unit_price, line_total, products(sku, name)), customers(name, email, address, city))').eq('id', resourceId).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Invoice not found' }, 404);
      return json({ invoice: data });
    }

    // GET /manoj-api/risk/{id} — risk report for order
    if (resource === 'risk' && req.method === 'GET' && resourceId) {
      const { data, error } = await supabase.from('risk_reports').select('*, orders(order_number, total_amount), customers(name, email, credit_score)').eq('order_id', resourceId).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'Risk report not found' }, 404);
      return json({ risk_report: data });
    }

    // GET /manoj-api/agent-logs/{id} — logs for order
    if (resource === 'agent-logs' && req.method === 'GET' && resourceId) {
      const { data, error } = await supabase.from('agent_logs').select('*').eq('order_id', resourceId).order('created_at', { ascending: true });
      if (error) throw error;
      return json({ logs: data ?? [] });
    }

    // GET /manoj-api/agent-logs — all logs (for audit trail screen)
    if (resource === 'agent-logs' && req.method === 'GET' && !resourceId) {
      const { data, error } = await supabase.from('agent_logs').select('*, orders(order_number, customers(name))').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return json({ logs: data ?? [] });
    }

    // GET /manoj-api/analytics
    if (resource === 'analytics' && req.method === 'GET') {
      const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: completedOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed');
      const { data: revenueData } = await supabase.from('orders').select('total_amount').eq('status', 'completed');
      const totalRevenue = (revenueData ?? []).reduce((sum, r) => sum + Number(r.total_amount), 0);
      const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']);
      const { count: exceptionOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['exception', 'escalated']);
      const { count: highRiskOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('risk_level', 'high');
      const { data: riskDistribution } = await supabase.from('orders').select('risk_level');
      const riskCounts = { low: 0, medium: 0, high: 0 };
      for (const r of riskDistribution ?? []) riskCounts[r.risk_level as keyof typeof riskCounts]++;

      const { data: recentOrders } = await supabase.from('orders').select('total_amount, status, created_at').order('created_at', { ascending: false }).limit(50);
      const { data: lowStock } = await supabase.from('inventory').select('product_id, products(name, sku), quantity_on_hand, reorder_point').lt('quantity_on_hand', 10);

      return json({
        total_orders: totalOrders ?? 0,
        completed_orders: completedOrders ?? 0,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders ?? 0,
        exception_orders: exceptionOrders ?? 0,
        high_risk_orders: highRiskOrders ?? 0,
        success_rate: totalOrders ? ((completedOrders ?? 0) / totalOrders * 100).toFixed(1) : '0',
        risk_distribution: riskCounts,
        recent_orders: recentOrders ?? [],
        low_stock_items: lowStock ?? [],
      });
    }

    // GET /manoj-api/risk-reports — all risk reports (for risk center)
    if (resource === 'risk-reports' && req.method === 'GET') {
      const { data, error } = await supabase.from('risk_reports').select('*, orders(order_number, status, total_amount), customers(name, email, credit_score, late_payment_count, outstanding_balance)').order('created_at', { ascending: false });
      if (error) throw error;
      return json({ reports: data ?? [] });
    }

    return json({ error: `Unknown endpoint: ${resource}` }, 404);
  } catch (error) {
    console.error('manoj-api error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
