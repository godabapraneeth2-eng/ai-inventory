import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Check, Clock3, Cpu, FileText, Filter, Package, Search, ShieldAlert, Zap } from 'lucide-react';
import { fetchAgentLogs } from '@/lib/api';
import type { AgentLog } from '@/lib/types';
import { SkeletonRow } from '@/components/Skeletons';

function agentIcon(name: string) {
  if (name.includes('Validation')) return Check;
  if (name.includes('Inventory')) return Package;
  if (name.includes('Invoice')) return FileText;
  if (name.includes('Risk')) return ShieldAlert;
  return Cpu;
}

function agentColor(name: string) {
  if (name.includes('Validation')) return 'bg-emerald-500/10 text-emerald-500';
  if (name.includes('Inventory')) return 'bg-cyan-500/10 text-cyan-500';
  if (name.includes('Invoice')) return 'bg-blue-500/10 text-blue-500';
  if (name.includes('Risk')) return 'bg-amber-500/10 text-amber-500';
  return 'bg-slate-500/10 text-slate-500';
}

function statusStyle(status: string) {
  if (status === 'completed') return 'badge-success';
  if (status === 'exception' || status === 'escalated') return 'badge-warning';
  if (status === 'rejected') return 'badge-error';
  return 'badge-info';
}

export function AuditTrailScreen() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  useEffect(() => {
    fetchAgentLogs()
      .then(setLogs)
      .catch(() => setError('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchesQuery = `${l.agent_name} ${l.message ?? ''} ${l.orders?.order_number ?? ''}`.toLowerCase().includes(query.toLowerCase());
    const matchesAgent = agentFilter === 'all' || l.agent_name === agentFilter;
    return matchesQuery && matchesAgent;
  });

  const agentNames = [...new Set(logs.map(l => l.agent_name))];

  if (loading) return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>;
  if (error) return <div className="glass-card p-8 text-center"><AlertTriangle className="mx-auto text-amber-500" size={28} /><p className="mt-3 text-sm text-secondary">{error}</p></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Audit trail</h1>
        <p className="mt-1 text-sm text-secondary">Every agent handoff, decision, and confidence signal — fully traceable.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search logs..." className="input-field pl-9 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted" />
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="input-field py-2 text-xs">
              <option value="all">All agents</option>
              {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        <div className="hidden grid-cols-[120px_1fr_1fr_100px_80px_80px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted lg:grid">
          <span>Order</span><span>Agent</span><span>Message</span><span>Status</span><span>Confidence</span><span>Duration</span>
        </div>

        <div className="divide-y divide-[rgb(var(--color-border))]">
          {filtered.length === 0 && <div className="px-5 py-12 text-center"><Activity className="mx-auto text-muted" size={28} /><p className="mt-3 text-sm text-secondary">No matching audit entries.</p></div>}
          {filtered.map((log, i) => {
            const Icon = agentIcon(log.agent_name);
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }} key={log.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[120px_1fr_1fr_100px_80px_80px] sm:gap-4 sm:px-5">
                <span className="font-mono text-xs text-blue-500 truncate">{log.orders?.order_number ?? '—'}</span>
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${agentColor(log.agent_name)}`}><Icon size={13} /></div>
                  <span className="text-xs font-medium text-primary">{log.agent_name}</span>
                </div>
                <p className="hidden text-xs text-secondary lg:block">{log.message}</p>
                <span className={`badge ${statusStyle(log.status)}`}>{log.status}</span>
                <span className="hidden items-center gap-1 text-xs text-emerald-500 lg:flex"><Zap size={11} />{log.confidence}%</span>
                <span className="hidden items-center gap-1 text-xs text-muted lg:flex"><Clock3 size={11} />{log.duration_ms ?? 0}ms</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Activity size={14} className="text-blue-500" />
          <span>{filtered.length} of {logs.length} entries shown</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />All handoffs logged</span>
        </div>
      </div>
    </div>
  );
}
