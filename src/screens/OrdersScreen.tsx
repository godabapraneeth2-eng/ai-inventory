import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, Check, ChevronRight, Clock3, Command, Cpu,
  FileText, Package, Plus, RefreshCw, Search, Send, ShieldAlert, X, Zap,
} from 'lucide-react';
import { fetchOrders, fetchCustomers, createOrder } from '@/lib/api';
import type { Order, Customer } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonRow } from '@/components/Skeletons';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const steps = [
    { name: 'Order received', agent: 'Orchestrator', icon: Command, state: 'done', time: '09:42:01', confidence: 99 },
    { name: 'Customer validated', agent: 'Validation Agent', icon: Check, state: 'done', time: '09:42:02', confidence: 98 },
    { name: order.exception_type === 'inventory_shortage' ? 'Shortage detected' : 'Inventory reserved', agent: 'Inventory Agent', icon: Package, state: order.exception_type === 'inventory_shortage' ? 'warn' : 'done', time: '09:42:03', confidence: 97 },
    { name: order.exception_type === 'high_risk_customer' ? 'Escalated for review' : 'Invoice generated', agent: order.exception_type === 'high_risk_customer' ? 'Risk Agent' : 'Invoice Agent', icon: order.exception_type === 'high_risk_customer' ? ShieldAlert : FileText, state: order.exception_type ? 'warn' : 'done', time: '09:42:04', confidence: 96 },
    { name: 'Final decision', agent: 'Orchestrator', icon: order.exception_type ? AlertTriangle : Check, state: order.exception_type ? 'warn' : 'done', time: '09:42:05', confidence: 99 },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 28 }} className="h-full w-full max-w-xl overflow-y-auto bg-surface px-5 py-6 shadow-2xl sm:px-8">
        <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Order detail</p><h2 className="mt-2 text-xl font-semibold text-primary">{order.order_number}</h2><p className="mt-1 text-sm text-secondary">{order.customers?.name ?? 'Unknown'}</p></div><button onClick={onClose} className="rounded-xl p-2 text-secondary hover:bg-surface-hover"><X size={18} /></button></div>
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-hover p-4"><div><p className="text-xs text-secondary">Order value</p><p className="mt-1 text-xl font-semibold text-primary">${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div><div className="text-right"><StatusBadge status={order.status} /><p className="mt-2 text-[11px] capitalize text-secondary">{order.risk_level ?? '—'} risk profile</p></div></div>
        {order.exception_type && <div className={`mt-4 flex gap-3 rounded-2xl border p-4 ${order.status === 'escalated' || order.status === 'rejected' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}><AlertTriangle className={order.status === 'escalated' || order.status === 'rejected' ? 'text-red-500' : 'text-amber-500'} size={18} /><div><p className="text-sm font-medium text-primary">{order.exception_type.replace(/_/g, ' ')}</p><p className="mt-1 text-xs leading-relaxed text-secondary">{order.exception_type === 'inventory_shortage' ? 'The Inventory Agent found insufficient stock. Workflow paused and a partial shipment is recommended.' : order.exception_type === 'high_risk_customer' ? 'Payment Risk Agent flagged this customer based on credit history and late payments. Human review is required.' : 'The customer account is suspended and cannot place orders.'}</p></div></div>}
        <div className="mt-8"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-primary">Agent timeline</h3><p className="mt-1 text-xs text-secondary">Every handoff, decision, and confidence signal.</p></div><span className="flex items-center gap-1 text-[10px] text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Audited</span></div>
          <div className="relative mt-6 space-y-0">{steps.map((step, i) => { const StepIcon = step.icon; const warning = step.state === 'warn'; return (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} key={step.name} className="relative flex gap-4 pb-7 last:pb-0">
              <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-surface" style={{ borderColor: warning ? 'rgb(234 179 8 / .3)' : 'rgb(16 185 129 / .3)' }}><div className={`flex h-6 w-6 items-center justify-center rounded-lg ${warning ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}><StepIcon size={13} /></div></div>
              {i < steps.length - 1 && <div className="absolute left-[18px] top-9 h-full w-px bg-[rgb(var(--color-border))]" />}
              <div className="flex-1 rounded-xl border border-app bg-surface-hover/50 p-3"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-primary">{step.name}</p><p className="mt-1 text-[11px] text-secondary">{step.agent}</p></div><span className={`text-[10px] font-medium ${warning ? 'text-amber-500' : 'text-emerald-500'}`}>{warning ? 'Attention' : 'Passed'}</span></div><div className="mt-3 flex items-center gap-4 border-t border-app pt-2 text-[10px] text-muted"><span className="flex items-center gap-1"><Clock3 size={11} />{step.time}</span><span className="flex items-center gap-1"><Zap size={11} />{step.confidence}% confidence</span><span className="ml-auto font-mono">{180 + i * 73}ms</span></div></div>
            </motion.div>
          ); })}</div>
        </div>
        <button onClick={onClose} className="btn-secondary mt-8 w-full text-sm">Close detail</button>
      </motion.div>
    </motion.div>
  );
}

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState('2');
  const [sku, setSku] = useState('SKU-001');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ decision: string; risk_level?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchCustomers().then(c => { setCustomers(c); if (c.length > 0) setCustomerId(c[0].id); }).catch(() => {}); }, []);

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await createOrder(customerId, [{ sku, quantity: parseInt(quantity) }]);
      setResult({ decision: res.decision, risk_level: res.risk_level });
    } catch { setError('Failed to process order. Please try again.'); }
    finally { setSubmitting(false); }
  }

  if (result) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card w-full max-w-md p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check size={26} /></div>
        <h2 className="mt-5 text-xl font-semibold text-primary">Order processed</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Decision: <strong className="text-primary">{result.decision.replace(/_/g, ' ')}</strong>{result.risk_level && <> · Risk: <span className="capitalize">{result.risk_level}</span></>}.</p>
        <button onClick={() => { onCreated(); onClose(); }} className="btn-primary mt-6 w-full">View orders</button>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card w-full max-w-lg p-6 sm:p-7">
        <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">New transaction</p><h2 className="mt-2 text-xl font-semibold text-primary">Create order</h2><p className="mt-1 text-sm text-secondary">The agent workforce will process it automatically.</p></div><button onClick={onClose} className="rounded-xl p-2 text-secondary hover:bg-surface-hover"><X size={18} /></button></div>
        <div className="mt-7 space-y-5">
          <label className="block"><span className="mb-2 block text-xs font-medium text-primary">Customer</span><select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input-field">{customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.status === 'suspended' ? '(suspended)' : ''}</option>)}</select></label>
          <div><span className="mb-2 block text-xs font-medium text-primary">Line item</span><div className="flex gap-2"><select value={sku} onChange={e => setSku(e.target.value)} className="input-field flex-1"><option value="SKU-001">MacBook Pro 14-inch · $1,999.00</option><option value="SKU-011">Logitech M185 Mouse · $24.00</option><option value="SKU-004">Dell UltraSharp Monitor · $649.00</option><option value="SKU-029">Herman Miller Chair · $1,097.00</option></select><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" className="input-field w-20 text-center" /></div></div>
          {error && <div className="flex items-center gap-2 rounded-xl bg-red-500/5 p-3 text-xs text-red-500"><AlertTriangle size={14} />{error}</div>}
        </div>
        <div className="mt-7 flex gap-3"><button onClick={onClose} className="btn-secondary flex-1">Cancel</button><button onClick={submit} disabled={submitting || !customerId} className="btn-primary flex flex-1 items-center justify-center gap-2">{submitting ? <><RefreshCw className="animate-spin" size={15} />Processing...</> : <><Send size={15} />Submit order</>}</button></div>
      </motion.div>
    </div>
  );
}

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = orders.filter(o => `${o.order_number} ${o.customers?.name ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Operations</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Orders</h1><p className="mt-1 text-sm text-secondary">Monitor every order-to-cash workflow in real time.</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex w-fit items-center gap-2 text-sm"><Plus size={16} />Create order</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search orders..." className="input-field pl-9 text-xs" /></div>
          <div className="flex items-center gap-2"><button className="btn-secondary flex items-center gap-2 text-xs"><Activity size={14} />All statuses</button><button className="btn-secondary p-2.5"><RefreshCw size={14} /></button></div>
        </div>
        <div className="hidden grid-cols-[1fr_1.5fr_120px_120px_120px_24px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid"><span>Order</span><span>Customer</span><span>Amount</span><span>Status</span><span>Risk</span><span /></div>
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : filtered.map(order => (
            <button onClick={() => setSelected(order)} key={order.id} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-surface-hover sm:grid-cols-[1fr_1.5fr_120px_120px_120px_24px] sm:gap-4 sm:px-5">
              <div><p className="font-mono text-xs font-medium text-blue-500">{order.order_number}</p><p className="mt-1 text-[11px] text-muted sm:hidden">{formatDate(order.created_at)}</p></div>
              <div className="flex min-w-0 items-center gap-2"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-[9px] font-semibold text-blue-500">{getInitials(order.customers?.name ?? '?')}</div><span className="truncate text-xs font-medium text-primary">{order.customers?.name ?? 'Unknown'}</span></div>
              <span className="hidden text-xs font-medium text-primary sm:block">{order.total_amount ? `$${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</span>
              <StatusBadge status={order.status} />
              <span className={`hidden text-xs capitalize sm:block ${order.risk_level === 'high' ? 'text-red-500' : order.risk_level === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{order.risk_level ?? '—'}</span>
              <ChevronRight className="text-muted" size={15} />
            </button>
          ))}
        </div>
      </div>
      {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
      <AnimatePresence>{showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchOrders().then(setOrders).catch(() => {}); }} />}</AnimatePresence>
    </div>
  );
}
