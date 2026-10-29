import { supabase } from './supabase';
import type { Customer, InventoryItem, Order, OrderItem, Invoice, RiskReport, AgentLog, Analytics } from './types';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manoj-api`;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manoj-chat`;
const FAST_API_URL = 'http://localhost:8000/api/v1';

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/${path}`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data as T;
}

// FAST API wrappers
async function fastApiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FAST_API_URL}/${path}`, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`FastAPI error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fastApiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${FAST_API_URL}/${path}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined 
  });
  if (!res.ok) throw new Error(`FastAPI error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchOrders(): Promise<Order[]> {
  const data = await apiGet<{ orders: Order[] }>('orders');
  return data.orders ?? [];
}

export async function fetchOrderDetail(id: string): Promise<{ order: Order & { customers: { name: string; email: string; credit_score: number; late_payment_count: number; outstanding_balance: number; status: string } | null }; items: OrderItem[]; invoice: Invoice | null; risk: RiskReport | null; logs: AgentLog[]; shipment: unknown }> {
  return apiGet(`orders/${id}`);
}

export async function createOrder(customerId: string, items: { sku: string; quantity: number }[], notes?: string): Promise<{ decision: string; order_id?: string; risk_level?: string; agents: unknown[] }> {
  return apiPost('orders', { customer_id: customerId, items, notes });
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const data = await apiGet<{ inventory: InventoryItem[] }>('inventory');
  return data.inventory ?? [];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const data = await apiGet<{ customers: Customer[] }>('customers');
  return data.customers ?? [];
}

export async function fetchRiskReports(): Promise<RiskReport[]> {
  const data = await apiGet<{ reports: RiskReport[] }>('risk-reports');
  return data.reports ?? [];
}

export async function fetchAgentLogs(): Promise<AgentLog[]> {
  const data = await apiGet<{ logs: AgentLog[] }>('agent-logs');
  return data.logs ?? [];
}

export async function fetchAnalytics(): Promise<Analytics> {
  return apiGet<Analytics>('analytics');
}

export async function sendChatMessage(question: string): Promise<{ answer: string; context: string }> {
  const res = await fetch(CHAT_URL, { method: 'POST', headers, body: JSON.stringify({ question }) });
  if (!res.ok) throw new Error(`Chat error: ${res.status}`);
  const data = await res.json();
  return { answer: data.answer, context: data.context };
}

// FAST API endpoints
export async function sendRAGChat(question: string, sessionId?: string): Promise<any> {
  return fastApiPost('chat', { question, session_id: sessionId });
}

export async function analyzeSentiment(text: string): Promise<any> {
  return fastApiPost('sentiment/analyze', { text });
}

export async function fetchReturns(): Promise<any> {
  return fastApiGet('returns');
}

export async function createReturn(data: any): Promise<any> {
  return fastApiPost('returns', data);
}

export async function fetchFraudAlerts(): Promise<any> {
  return fastApiGet('fraud/alerts');
}

export async function fetchProcurementOrders(): Promise<any> {
  return fastApiGet('procurement/orders');
}

export async function fetchShippingPredictions(): Promise<any> {
  return fastApiGet('shipping/predictions');
}

export async function fetchExecutiveAnalytics(): Promise<any> {
  return fastApiGet('analytics/executive');
}

export async function fetchQualityInspections(): Promise<any> {
  return fastApiGet('quality/inspections');
}

export async function fetchApprovals(): Promise<any> {
  return fastApiGet('approvals');
}

export async function approveItem(id: string): Promise<any> {
  return fastApiPost(`approvals/${id}/approve`);
}

export async function rejectItem(id: string): Promise<any> {
  return fastApiPost(`approvals/${id}/reject`);
}

export async function fetchObservabilityLogs(): Promise<any> {
  return fastApiGet('observability/logs');
}

export async function fetchEvents(): Promise<any> {
  return fastApiGet('events');
}

export { supabase };
