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
  if (req.method !== 'POST') return json({ error: 'Only POST is supported' }, 405);

  try {
    const { question } = await req.json() as { question?: string };
    if (!question || question.trim().length < 3) return json({ error: 'A question is required' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const q = question.toLowerCase();
    const context: string[] = [];

    // Fetch relevant data based on question keywords
    if (q.includes('shortage') || q.includes('inventory') || q.includes('stock')) {
      const { data: lowStock } = await supabase.from('inventory').select('product_id, products(sku, name), quantity_on_hand, quantity_reserved, reorder_point').lt('quantity_on_hand', 10);
      const items = lowStock ?? [];
      context.push(`Inventory shortage items (${items.length} found):`);
      for (const item of items) {
        const p = item.products as { sku: string; name: string };
        context.push(`- ${p.sku} ${p.name}: ${item.quantity_on_hand} on hand, ${item.quantity_reserved} reserved, reorder at ${item.reorder_point}`);
      }
      if (items.length === 0) context.push('No inventory shortages detected.');
    }

    if (q.includes('risk') || q.includes('high-risk') || q.includes('payment')) {
      const { data: highRisk } = await supabase.from('risk_reports').select('risk_score, risk_level, explanation, orders(order_number), customers(name, credit_score)').eq('risk_level', 'high').order('created_at', { ascending: false }).limit(5);
      const reports = highRisk ?? [];
      context.push(`High-risk orders (${reports.length} found):`);
      for (const r of reports) {
        const o = r.orders as { order_number: string };
        const c = r.customers as { name: string; credit_score: number };
        context.push(`- ${o.order_number} for ${c.name}: risk score ${r.risk_score}, credit ${c.credit_score}. ${r.explanation}`);
      }
      if (reports.length === 0) context.push('No high-risk orders found.');
    }

    if (q.includes('delay') || q.includes('pending') || q.includes('exception')) {
      const { data: exceptions } = await supabase.from('orders').select('order_number, status, exception_type, exception_details, customers(name)').in('status', ['exception', 'escalated', 'pending', 'processing']).order('created_at', { ascending: false }).limit(10);
      const orders = exceptions ?? [];
      context.push(`Delayed or exception orders (${orders.length} found):`);
      for (const o of orders) {
        const c = o.customers as { name: string };
        context.push(`- ${o.order_number} for ${c.name}: status ${o.status}, exception: ${o.exception_type || 'none'}`);
      }
      if (orders.length === 0) context.push('No delayed orders found.');
    }

    if (q.includes('invoice') || q.includes('revenue') || q.includes('order')) {
      const { data: recentOrders } = await supabase.from('orders').select('order_number, status, total_amount, risk_level, customers(name)').order('created_at', { ascending: false }).limit(10);
      const orders = recentOrders ?? [];
      context.push(`Recent orders (${orders.length} found):`);
      for (const o of orders) {
        const c = o.customers as { name: string };
        context.push(`- ${o.order_number} for ${c.name}: $${o.total_amount}, status ${o.status}, risk ${o.risk_level}`);
      }
    }

    if (q.includes('analytics') || q.includes('dashboard') || q.includes('summary')) {
      const { count: total } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { data: revenue } = await supabase.from('orders').select('total_amount').eq('status', 'completed');
      const totalRevenue = (revenue ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
      context.push(`Analytics summary: ${total ?? 0} total orders, $${totalRevenue.toLocaleString()} total revenue from completed orders.`);
    }

    const contextText = context.join('\n');

    // Try Gemini if API key is configured
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    let answer: string;

    if (geminiKey) {
      const prompt = `You are MANOJ AI, an enterprise order-to-cash assistant. Answer the user's question using ONLY the database context below. Never hallucinate. Cite specific records when relevant. Be concise and professional.\n\nDatabase context:\n${contextText}\n\nQuestion: ${question}\n\nAnswer:`;
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } }),
      });
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
      } else {
        answer = generateFallbackAnswer(question, contextText);
      }
    } else {
      answer = generateFallbackAnswer(question, contextText);
    }

    return json({ answer, context: contextText, grounded: true });
  } catch (error) {
    console.error('manoj-chat error:', error);
    return json({ error: 'Failed to process question' }, 500);
  }
});

function generateFallbackAnswer(question: string, context: string): string {
  const q = question.toLowerCase();
  let answer = '';

  if (q.includes('shortage') || q.includes('inventory') || q.includes('stock')) {
    const shortages = context.split('\n').filter(l => l.includes('on hand'));
    answer = `Based on the current database records, there are ${shortages.length} items with inventory below their reorder point. `;
    answer += shortages.slice(0, 3).join(' ') || 'No critical shortages found at this time. ';
    answer += '\n\nThe Inventory Agent monitors stock levels deterministically and flags any SKU where quantity on hand falls below the reorder threshold. When a shortage is detected during order processing, the Orchestrator pauses the workflow and recommends a partial shipment.';
  } else if (q.includes('risk') || q.includes('high-risk') || q.includes('payment')) {
    const highRisk = context.split('\n').filter(l => l.includes('risk score'));
    answer = `The Risk Agent uses a deterministic scoring model based on credit score, late payment count, and outstanding balance. `;
    answer += highRisk.length ? `Currently, ${highRisk.length} high-risk orders have been identified:\n${highRisk.slice(0, 3).join('\n')}` : 'No high-risk orders are currently flagged. ';
    answer += '\n\nOrders with a risk score of 60 or above are automatically escalated for human review.';
  } else if (q.includes('delay') || q.includes('pending') || q.includes('exception')) {
    const delays = context.split('\n').filter(l => l.includes('status'));
    answer = `I found ${delays.length} orders with exceptions or delays in the system. `;
    answer += delays.slice(0, 3).join('\n') || 'All orders are processing normally. ';
    answer += '\n\nCommon causes include inventory shortages (which trigger partial shipment recommendations) and high-risk customer profiles (which require human review before approval).';
  } else if (q.includes('invoice') || q.includes('revenue')) {
    answer = `The Invoice Agent calculates subtotals from validated order items, applies the configured tax rate (8.75%), and generates professional invoice records stored in the database. `;
    answer += `Recent order data is available in the context above. Each completed order automatically receives an invoice with payment terms based on the customer's configured terms.`;
  } else if (q.includes('analytics') || q.includes('summary') || q.includes('dashboard')) {
    answer = `Here's the current system summary based on live database records:\n${context}\n\nThe analytics dashboard tracks orders processed, revenue, success rate, inventory alerts, and risk distribution in real time.`;
  } else {
    answer = `I can help you understand order status, inventory shortages, payment risks, invoices, and analytics. Here's what I found in the database:\n\n${context}\n\nAsk me about specific orders, shortages, risk profiles, or revenue for more detailed insights.`;
  }

  return answer;
}
