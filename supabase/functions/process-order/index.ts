import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type OrderItem = { sku: string; quantity: number };
type AgentResult = { agent_name: string; status: string; confidence: number; message: string; payload: Record<string, unknown> };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Only POST is supported" }, 405);

  try {
    const input = await req.json() as { customer_id?: string; items?: OrderItem[]; notes?: string };
    if (!input.customer_id || !Array.isArray(input.items) || input.items.length === 0) return json({ error: "customer_id and items are required" }, 400);
    if (input.items.some((item) => !item.sku || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000)) return json({ error: "Each item needs a valid SKU and quantity" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const started = Date.now();
    const logs: AgentResult[] = [];
    const log = (result: AgentResult) => logs.push(result);

    const customerResponse = await supabase.from("customers").select("*").eq("id", input.customer_id).maybeSingle();
    if (customerResponse.error) throw customerResponse.error;
    const customer = customerResponse.data;
    log({ agent_name: "ValidationAgent", status: customer?.status === "active" ? "completed" : "rejected", confidence: 99, message: customer?.status === "active" ? "Customer account validated" : "Customer account is not active", payload: { customer_valid: customer?.status === "active" } });
    if (!customer || customer.status !== "active") return json({ decision: "rejected", reason: "Customer account is not active", agents: logs });

    const skus = input.items.map((item) => item.sku);
    const productsResponse = await supabase.from("products").select("id, sku, name, unit_price, min_order_qty").in("sku", skus);
    if (productsResponse.error) throw productsResponse.error;
    const products = productsResponse.data ?? [];
    const missing = input.items.filter((item) => !products.some((product) => product.sku === item.sku));
    if (missing.length) {
      log({ agent_name: "ValidationAgent", status: "rejected", confidence: 99, message: "One or more product SKUs are invalid", payload: { missing_skus: missing.map((item) => item.sku) } });
      return json({ decision: "rejected", reason: "Invalid product SKU", agents: logs });
    }
    log({ agent_name: "ValidationAgent", status: "completed", confidence: 98, message: "Products and quantities validated", payload: { products_valid: true } });

    const productIds = products.map((product) => product.id);
    const inventoryResponse = await supabase.from("inventory").select("product_id, quantity_on_hand, quantity_reserved").in("product_id", productIds);
    if (inventoryResponse.error) throw inventoryResponse.error;
    const shortages: Record<string, unknown>[] = [];
    for (const item of input.items) {
      const product = products.find((candidate) => candidate.sku === item.sku)!;
      const stock = (inventoryResponse.data ?? []).find((row) => row.product_id === product.id);
      const available = (stock?.quantity_on_hand ?? 0) - (stock?.quantity_reserved ?? 0);
      if (available < item.quantity) shortages.push({ sku: item.sku, requested: item.quantity, available, shortage: item.quantity - available });
    }
    log({ agent_name: "InventoryAgent", status: shortages.length ? "exception" : "completed", confidence: 99, message: shortages.length ? "Inventory shortage detected; partial shipment recommended" : "Inventory verified", payload: { shortages } });
    if (shortages.length) return json({ decision: "partial_shipment_recommended", shortages, agents: logs });

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * Number(products.find((product) => product.sku === item.sku)!.unit_price), 0);
    const taxRateResponse = await supabase.from("settings").select("value").eq("key", "tax_rate").maybeSingle();
    const taxRate = Number(taxRateResponse.data?.value ?? 0.0875);
    const tax = subtotal * taxRate;
    log({ agent_name: "InvoiceAgent", status: "completed", confidence: 99, message: "Invoice totals calculated", payload: { subtotal, tax, total: subtotal + tax, tax_rate: taxRate } });

    const score = Math.min(100, Math.max(0, Math.round((750 - customer.credit_score) / 2 + customer.late_payment_count * 8 + Number(customer.outstanding_balance) / 10000)));
    const riskLevel = score >= 60 ? "high" : score >= 35 ? "medium" : "low";
    log({ agent_name: "RiskAgent", status: "completed", confidence: 96, message: `${riskLevel} payment risk assessed`, payload: { score, risk_level: riskLevel, late_payments: customer.late_payment_count } });
    log({ agent_name: "Orchestrator", status: riskLevel === "high" ? "escalated" : "completed", confidence: 99, message: riskLevel === "high" ? "Order escalated for human review" : "Workflow completed successfully", payload: { decision: riskLevel === "high" ? "human_review_required" : "approved", processing_time_ms: Date.now() - started } });
    return json({ decision: riskLevel === "high" ? "human_review_required" : "approved", subtotal, tax, total: subtotal + tax, risk_score: score, risk_level: riskLevel, agents: logs });
  } catch (error) {
    console.error("process-order failed", error);
    return json({ error: "Order processing failed" }, 500);
  }
});
