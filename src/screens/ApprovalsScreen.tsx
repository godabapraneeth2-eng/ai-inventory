import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';
import type { ApprovalItem } from '@/lib/types';
import { fetchApprovals, approveItem, rejectItem } from '@/lib/api';

export function ApprovalsScreen() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals()
      .then((data: any) => setItems(Array.isArray(data) ? data : data?.approvals ?? []))
      .catch(() => {
        setItems([
          { id: 'APR-001', type: 'refund', entity_id: 'RET-204', description: 'Refund of $1,249.00 for damaged MacBook Pro', agent_name: 'ReturnAgent', confidence: 0.82, status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'APR-002', type: 'order_override', entity_id: 'ORD-2026-0044', description: 'High-risk order override for VIP customer Acme Corp', agent_name: 'RiskAgent', confidence: 0.71, status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 'APR-003', type: 'fraud_clear', entity_id: 'FRD-103', description: 'Clear fraud flag for Jane Smith - return fraud', agent_name: 'FraudAgent', confidence: 0.88, status: 'pending', created_at: new Date(Date.now() - 14400000).toISOString() },
          { id: 'APR-004', type: 'procurement', entity_id: 'PO-9916', description: 'Auto-generated PO for 100 units of SKU-011', agent_name: 'ProcurementAgent', confidence: 0.95, status: 'approved', reviewed_by: 'admin', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'APR-005', type: 'refund', entity_id: 'RET-198', description: 'Refund rejected - product shows signs of intentional damage', agent_name: 'ReturnAgent', confidence: 0.91, status: 'rejected', reviewed_by: 'manager', created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter(i => i.status === 'pending');
  const history = items.filter(i => i.status !== 'pending');
  const displayed = tab === 'pending' ? pending : history;

  async function handleApprove(id: string) {
    setActing(id);
    try {
      await approveItem(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' as const, reviewed_by: 'admin' } : i));
    } catch { /* fallback */ setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' as const, reviewed_by: 'admin' } : i)); }
    setActing(null);
  }

  async function handleReject(id: string) {
    setActing(id);
    try {
      await rejectItem(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' as const, reviewed_by: 'admin' } : i));
    } catch { setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' as const, reviewed_by: 'admin' } : i)); }
    setActing(null);
  }

  const confidenceColor = (c: number) => c >= 0.95 ? 'text-emerald-500' : c >= 0.7 ? 'text-amber-500' : 'text-red-500';
  const confidenceLabel = (c: number) => c >= 0.95 ? 'Auto-executable' : c >= 0.7 ? 'Manager review' : 'Manual review required';
  const typeColor = (t: string) => t === 'refund' ? 'bg-blue-500/10 text-blue-500' : t === 'fraud_clear' ? 'bg-red-500/10 text-red-500' : t === 'procurement' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500';

  const formatTime = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Security</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Approval Queue</h1>
          <p className="mt-1 text-sm text-secondary">Human-in-the-loop decisions for AI agent recommendations.</p>
        </div>
        {pending.length > 0 && <span className="badge badge-warning animate-pulse"><Clock size={14} />{pending.length} pending review</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={Clock} label="Pending Review" value={String(pending.length)} change="Requires action" accent="bg-amber-500/10 text-amber-500" />
          <MetricCard icon={CheckCircle} label="Approved" value={String(items.filter(i => i.status === 'approved').length)} change="This week" positive accent="bg-emerald-500/10 text-emerald-500" />
          <MetricCard icon={XCircle} label="Rejected" value={String(items.filter(i => i.status === 'rejected').length)} change="This week" accent="bg-red-500/10 text-red-500" />
          <MetricCard icon={Zap} label="Avg Response" value="12m" change="Target: 30m" positive accent="bg-blue-500/10 text-blue-500" />
        </>}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-1 border-b border-app p-1.5">
          <button onClick={() => setTab('pending')} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'pending' ? 'bg-blue-500/10 text-blue-500' : 'text-secondary hover:text-primary'}`}>
            Pending ({pending.length})
          </button>
          <button onClick={() => setTab('history')} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'history' ? 'bg-blue-500/10 text-blue-500' : 'text-secondary hover:text-primary'}`}>
            History ({history.length})
          </button>
        </div>

        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />) : displayed.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ListChecks className="mx-auto text-muted" size={28} />
              <p className="mt-3 text-sm text-secondary">{tab === 'pending' ? 'No pending approvals. All caught up!' : 'No history yet.'}</p>
            </div>
          ) : displayed.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColor(item.type)}`}>
                <ListChecks size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-blue-500">{item.entity_id}</span>
                  <span className="rounded-md bg-surface-hover px-2 py-0.5 text-[10px] text-muted">{item.type.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-primary">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><Zap size={10} />{item.agent_name}</span>
                  <span className={`flex items-center gap-1 font-medium ${confidenceColor(item.confidence)}`}>
                    {(item.confidence * 100).toFixed(0)}% confidence · {confidenceLabel(item.confidence)}
                  </span>
                  <span><Clock size={10} className="inline" /> {formatTime(item.created_at)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {item.status === 'pending' ? (
                  <>
                    <button onClick={() => handleApprove(item.id)} disabled={acting === item.id} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs">
                      <CheckCircle size={14} />Approve
                    </button>
                    <button onClick={() => handleReject(item.id)} disabled={acting === item.id} className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs text-red-500">
                      <XCircle size={14} />Reject
                    </button>
                  </>
                ) : (
                  <span className={`badge ${item.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                    {item.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {item.status} by {item.reviewed_by}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
