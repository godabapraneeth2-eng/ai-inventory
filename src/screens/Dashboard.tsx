import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowUpRight, Check, ChevronRight,
  CircleDollarSign, Clock3, Cpu, Eye, Package, ShieldAlert,
  ShoppingCart, Zap,
} from 'lucide-react';
import { fetchOrders, fetchAnalytics } from '@/lib/api';
import type { Order, Analytics } from '@/lib/types';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';

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

export function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnalytics().catch(() => null),
      fetchOrders().then(o => o.slice(0, 5)).catch(() => []),
    ]).then(([a, o]) => {
      setAnalytics(a);
      setOrders(o);
    }).finally(() => setLoading(false));
  }, []);

  const revenue = analytics ? `$${(analytics.total_revenue / 1000000).toFixed(2)}M` : '—';
  const exceptionOrders = orders.filter(o => o.exception_type).slice(0, 3);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Friday, August 22, 2026</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">Good morning<span className="text-blue-500">.</span></h1>
          <p className="mt-1 text-sm text-secondary">Here's what your AI workforce is handling today.</p>
        </div>
        <button onClick={() => navigate('/orders')} className="btn-secondary flex w-fit items-center gap-2 text-sm"><Eye size={15} />View live operations</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={ShoppingCart} label="Orders processed" value={String(analytics?.total_orders ?? 0)} change="12.8%" positive accent="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={CircleDollarSign} label="Revenue processed" value={revenue} change="8.4%" positive accent="bg-emerald-500/10 text-emerald-500" />
          <MetricCard icon={AlertTriangle} label="Inventory alerts" value={String(analytics?.low_stock_items?.length ?? 0)} change={`${analytics?.exception_orders ?? 0} exceptions`} accent="bg-amber-500/10 text-amber-500" />
          <MetricCard icon={ShieldAlert} label="Success rate" value={`${analytics?.success_rate ?? 0}%`} change="1.2%" positive accent="bg-cyan-500/10 text-cyan-500" />
        </>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        {/* Order throughput chart */}
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="font-semibold text-primary">Order throughput</h2><p className="mt-1 text-xs text-secondary">Processed orders · Last 7 days</p></div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-hover p-1 text-[11px]"><button className="rounded-md bg-surface px-2.5 py-1 font-medium text-primary shadow-sm">7 days</button><button className="px-2.5 py-1 text-muted">30 days</button></div>
          </div>
          <div className="mt-7 flex h-48 items-end gap-2 sm:gap-4">{[42,58,48,76,62,88,74,94,81,100,90,108,96,115,102,128,116,140,124,132,118,146].map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${i > 17 ? 'bg-blue-500' : 'bg-blue-500/20'}`} style={{ height: `${height}px` }} /></div>)}</div>
          <div className="mt-3 flex justify-between text-[10px] text-muted"><span>Aug 16</span><span>Aug 17</span><span>Aug 18</span><span>Aug 19</span><span>Aug 20</span><span>Aug 21</span><span>Today</span></div>
        </div>

        {/* Agent health */}
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold text-primary">Agent health</h2><p className="mt-1 text-xs text-secondary">Real-time performance</p></div><span className="flex items-center gap-1.5 text-[11px] text-emerald-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</span></div>
          <div className="mt-6 space-y-4">{([
            ['Orchestrator','99.4%','1,284 runs',Cpu,'text-blue-500'],
            ['Validation Agent','99.8%','1,284 checks',Check,'text-emerald-500'],
            ['Inventory Agent','97.1%','1,284 checks',Package,'text-cyan-500'],
            ['Risk Agent','98.6%','1,281 assessments',ShieldAlert,'text-amber-500'],
          ] as const).map(([name, confidence, runs, Icon, color]) => (
            <div key={name} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover ${color}`}><Icon size={15} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-xs"><span className="font-medium text-primary">{name}</span><span className="font-mono text-emerald-500">{confidence}</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-emerald-500" style={{ width: confidence }} /></div>
                <p className="mt-1 text-[10px] text-muted">{runs}</p>
              </div>
            </div>
          ))}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent orders */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-app px-5 py-4">
            <div><h2 className="font-semibold text-primary">Recent orders</h2><p className="mt-1 text-xs text-secondary">Latest activity across your workspace</p></div>
            <button onClick={() => navigate('/orders')} className="text-xs font-medium text-blue-500 hover:text-blue-600">View all <ChevronRight className="inline" size={13} /></button>
          </div>
          <div className="divide-y divide-[rgb(var(--color-border))]">
            {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : orders.map(order => {
              const name = order.customers?.name ?? 'Unknown';
              return (
                <button key={order.id} onClick={() => navigate('/orders')} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-surface-hover">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[10px] font-semibold text-blue-500">{getInitials(name)}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-primary">{name}</p><p className="mt-0.5 font-mono text-[10px] text-muted">{order.order_number}</p></div>
                  <div className="hidden text-right sm:block"><p className="text-xs font-medium text-primary">{order.total_amount ? `$${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</p><p className="mt-0.5 text-[10px] text-muted">{formatDate(order.created_at)}</p></div>
                  <StatusBadge status={order.status} />
                  <ChevronRight className="text-muted" size={15} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Needs attention */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-primary">Needs attention</h2><p className="mt-1 text-xs text-secondary">Exceptions requiring review</p></div><span className="badge badge-warning">{analytics?.exception_orders ?? 0} open</span></div>
          <div className="mt-5 space-y-3">
            {exceptionOrders.length === 0 && <p className="text-xs text-muted">No exceptions found.</p>}
            {exceptionOrders.map(order => (
              <div key={order.id} className="flex items-start gap-3 rounded-xl bg-surface-hover p-3">
                <div className={`mt-0.5 rounded-lg p-2 ${order.status === 'escalated' || order.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{order.status === 'escalated' || order.status === 'rejected' ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary">{order.exception_type?.replace(/_/g, ' ')}</p>
                  <p className="mt-1 truncate text-[11px] text-secondary">{order.order_number} · {order.customers?.name ?? 'Unknown'}</p>
                  <button onClick={() => navigate('/orders')} className="mt-2 text-[11px] font-medium text-blue-500">Review case <ChevronRight className="inline" size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
