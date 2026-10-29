export type OrderStatus = 'completed' | 'processing' | 'pending' | 'exception' | 'escalated' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  tax_id: string | null;
  credit_score: number;
  payment_terms_days: number;
  status: string;
  total_orders: number;
  total_revenue: number;
  outstanding_balance: number;
  late_payment_count: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unit_price: number;
  cost_price: number;
  min_order_qty: number;
  status: string;
};

export type InventoryItem = {
  id: string;
  product_id: string;
  products: { id: string; sku: string; name: string; category: string; unit_price: number } | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number;
  warehouse: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  customers: { name: string } | null;
  status: OrderStatus;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  final_decision: string | null;
  risk_level: RiskLevel | null;
  exception_type: string | null;
  exception_details: Record<string, unknown> | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  products: { sku: string; name: string; category: string } | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  fulfilled_quantity: number;
  status: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
};

export type RiskReport = {
  id: string;
  order_id: string;
  customer_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  credit_score: number;
  late_payment_count: number;
  outstanding_balance: number;
  order_value: number;
  explanation: string | null;
  recommendation: string | null;
  created_at: string;
  orders: { order_number: string; status: string; total_amount: number } | null;
  customers: { name: string; email: string; credit_score: number; late_payment_count: number; outstanding_balance: number } | null;
};

export type AgentLog = {
  id: string;
  order_id: string | null;
  agent_name: string;
  from_agent: string | null;
  to_agent: string | null;
  status: string;
  confidence: number;
  message: string | null;
  payload: Record<string, unknown> | null;
  duration_ms: number | null;
  created_at: string;
  orders: { order_number: string; customers: { name: string } | null } | null;
};

export type Analytics = {
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
  pending_orders: number;
  exception_orders: number;
  high_risk_orders: number;
  success_rate: string;
  risk_distribution: { low: number; medium: number; high: number };
  recent_orders: { total_amount: number; status: string; created_at: string }[];
  low_stock_items: { product_id: string; products: { name: string; sku: string } | null; quantity_on_hand: number; reorder_point: number }[];
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  context?: string;
};

export type UserRole = 'admin' | 'manager' | 'support' | 'warehouse' | 'finance' | 'customer';
export type SentimentLabel = 'happy' | 'neutral' | 'frustrated' | 'angry' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'more_evidence_needed';
export type Screen = 'dashboard' | 'orders' | 'inventory' | 'risk' | 'audit' | 'assistant' | 'returns' | 'fraud' | 'procurement' | 'shipping' | 'executive' | 'quality' | 'approvals' | 'observability' | 'login';

export type ReturnRequest = { id: string; order_id: string; customer_name: string; reason: string; status: ReturnStatus; damage_assessment?: string; confidence: number; created_at: string; };
export type FraudAlert = { id: string; customer_id: string; customer_name: string; fraud_score: number; fraud_type: string; explanation: string; status: string; created_at: string; };
export type PurchaseOrder = { id: string; product_name: string; sku: string; quantity: number; supplier: string; status: string; estimated_delivery: string; created_at: string; };
export type ShippingPrediction = { id: string; order_id: string; order_number: string; carrier: string; eta: string; confidence: number; delay_risk: string; status: string; };
export type QualityInspection = { id: string; order_id: string; order_number: string; result: string; issues: string[]; confidence: number; created_at: string; };
export type ApprovalItem = { id: string; type: string; entity_id: string; description: string; agent_name: string; confidence: number; status: ApprovalStatus; reviewed_by?: string; created_at: string; };
export type AgentExecution = { id: string; agent_name: string; action: string; status: string; confidence: number; duration_ms: number; tokens_used: number; error_message?: string; retry_count?: number; created_at: string; };
export type Notification = { id: string; type: 'info' | 'warning' | 'error' | 'success'; title: string; message: string; timestamp: string; read: boolean; };
