import { useState, useEffect } from 'react';
import { PackageX, RotateCcw, ShieldCheck, FileWarning, Search, Upload } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ReturnRequest } from '@/lib/types';
import { SkeletonRow, SkeletonCard } from '@/components/Skeletons';

export function ReturnsScreen() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Mock data for returns since backend might not have this yet
  useEffect(() => {
    setTimeout(() => {
      setReturns([
        { id: 'RTN-001', order_id: 'ORD-8172', customer_name: 'Acme Corp', reason: 'Damaged in transit', status: 'approved', confidence: 98, created_at: new Date().toISOString() },
        { id: 'RTN-002', order_id: 'ORD-9921', customer_name: 'Globex', reason: 'Wrong item shipped', status: 'pending', confidence: 85, created_at: new Date().toISOString() },
        { id: 'RTN-003', order_id: 'ORD-1022', customer_name: 'Initech', reason: 'Defective product', status: 'more_evidence_needed', confidence: 60, created_at: new Date().toISOString() },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filtered = returns.filter(r => `${r.id} ${r.order_id} ${r.customer_name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Returns & Refunds</h1>
          <p className="mt-1 text-sm text-secondary">AI-assisted reverse logistics and fraud prevention.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Upload size={16} /> Upload Evidence
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <MetricCard icon={RotateCcw} label="Total Returns (30d)" value="1,284" change="12% from last month" accent="bg-blue-500/10 text-blue-500" />
            <MetricCard icon={ShieldCheck} label="Auto-Approved" value="84%" change="2.1%" positive accent="bg-emerald-500/10 text-emerald-500" />
            <MetricCard icon={PackageX} label="Pending Review" value="42" change="Needs action" accent="bg-amber-500/10 text-amber-500" />
            <MetricCard icon={FileWarning} label="Rejected (Fraud Risk)" value="128" change="5.4%" positive accent="bg-red-500/10 text-red-500" />
          </>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search returns..." className="input-field pl-9 text-xs" />
          </div>
        </div>
        
        <div className="hidden grid-cols-[1fr_1.5fr_1.5fr_120px_120px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid">
          <span>Return ID</span>
          <span>Customer / Order</span>
          <span>Reason</span>
          <span>Status</span>
          <span>AI Confidence</span>
        </div>
        
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : filtered.map(ret => (
            <div key={ret.id} className="grid w-full items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_1.5fr_1.5fr_120px_120px] sm:gap-4 sm:px-5">
              <span className="font-mono text-xs font-medium text-blue-500">{ret.id}</span>
              <div>
                <p className="text-xs font-medium text-primary">{ret.customer_name}</p>
                <p className="font-mono text-[10px] text-muted">{ret.order_id}</p>
              </div>
              <span className="text-xs text-secondary">{ret.reason}</span>
              <StatusBadge status={ret.status === 'more_evidence_needed' ? 'exception' : ret.status === 'pending' ? 'processing' : ret.status === 'approved' ? 'completed' : 'rejected'} />
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                  <div className={`h-full rounded-full ${ret.confidence > 90 ? 'bg-emerald-500' : ret.confidence > 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${ret.confidence}%` }} />
                </div>
                <span className="text-[10px] font-mono text-muted">{ret.confidence}%</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
             <div className="p-8 text-center text-sm text-muted">No returns found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
