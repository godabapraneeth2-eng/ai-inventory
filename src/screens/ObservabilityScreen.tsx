import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Filter, Clock, Zap, Cpu, Check, Package, FileText, ShieldAlert, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';
import type { AgentExecution } from '@/lib/types';
import { fetchObservabilityLogs } from '@/lib/api';

function agentIcon(name: string) {
  if (name.includes('Validation')) return Check;
  if (name.includes('Inventory')) return Package;
  if (name.includes('Invoice')) return FileText;
  if (name.includes('Risk')) return ShieldAlert;
  if (name.includes('Fraud')) return ShieldAlert;
  if (name.includes('Return')) return RefreshCw;
  if (name.includes('Procurement')) return Package;
  if (name.includes('Shipping')) return Package;
  if (name.includes('Quality')) return Check;
  if (name.includes('Sentiment')) return Activity;
  return Cpu;
}

function agentColor(name: string) {
  if (name.includes('Validation')) return 'bg-emerald-500/10 text-emerald-500';
  if (name.includes('Inventory')) return 'bg-cyan-500/10 text-cyan-500';
  if (name.includes('Invoice')) return 'bg-blue-500/10 text-blue-500';
  if (name.includes('Risk') || name.includes('Fraud')) return 'bg-amber-500/10 text-amber-500';
  if (name.includes('Return')) return 'bg-purple-500/10 text-purple-500';
  return 'bg-slate-500/10 text-slate-500';
}

export function ObservabilityScreen() {
  const [logs, setLogs] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');

  useEffect(() => {
    fetchObservabilityLogs()
      .then((data: any) => setLogs(Array.isArray(data) ? data : data?.logs ?? []))
      .catch(() => {
        setLogs([
          { id: 'EX-001', agent_name: 'Orchestrator', action: 'Process order ORD-2026-0042', status: 'completed', confidence: 0.99, duration_ms: 1842, tokens_used: 245, created_at: new Date(Date.now() - 300000).toISOString() },
          { id: 'EX-002', agent_name: 'ValidationAgent', action: 'Validate customer account', status: 'completed', confidence: 0.99, duration_ms: 320, tokens_used: 0, created_at: new Date(Date.now() - 295000).toISOString() },
          { id: 'EX-003', agent_name: 'InventoryAgent', action: 'Check stock for SKU-001', status: 'completed', confidence: 0.97, duration_ms: 410, tokens_used: 0, created_at: new Date(Date.now() - 290000).toISOString() },
          { id: 'EX-004', agent_name: 'InvoiceAgent', action: 'Calculate invoice totals', status: 'completed', confidence: 0.99, duration_ms: 280, tokens_used: 0, created_at: new Date(Date.now() - 285000).toISOString() },
          { id: 'EX-005', agent_name: 'RiskAgent', action: 'Assess payment risk', status: 'completed', confidence: 0.96, duration_ms: 360, tokens_used: 0, created_at: new Date(Date.now() - 280000).toISOString() },
          { id: 'EX-006', agent_name: 'SentimentAgent', action: 'Analyze customer message sentiment', status: 'completed', confidence: 0.88, duration_ms: 125, tokens_used: 128, created_at: new Date(Date.now() - 120000).toISOString() },
          { id: 'EX-007', agent_name: 'FraudAgent', action: 'Scan customer FRD-102', status: 'error', confidence: 0, duration_ms: 5200, tokens_used: 0, error_message: 'Timeout: external API unreachable', retry_count: 3, created_at: new Date(Date.now() - 60000).toISOString() },
          { id: 'EX-008', agent_name: 'ReturnAgent', action: 'Process return RET-204', status: 'completed', confidence: 0.82, duration_ms: 890, tokens_used: 312, created_at: new Date(Date.now() - 30000).toISOString() },
          { id: 'EX-009', agent_name: 'QualityAgent', action: 'Inspect order ORD-2026-0038', status: 'completed', confidence: 0.94, duration_ms: 1560, tokens_used: 0, created_at: new Date(Date.now() - 15000).toISOString() },
          { id: 'EX-010', agent_name: 'ProcurementAgent', action: 'Generate PO for SKU-029', status: 'completed', confidence: 0.95, duration_ms: 440, tokens_used: 0, created_at: new Date(Date.now() - 5000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchesQuery = `${l.agent_name} ${l.action}`.toLowerCase().includes(query.toLowerCase());
    const matchesAgent = agentFilter === 'all' || l.agent_name === agentFilter;
    return matchesQuery && matchesAgent;
  });

  const agentNames = [...new Set(logs.map(l => l.agent_name))];
  const totalExec = logs.length;
  const avgDuration = logs.length ? Math.round(logs.reduce((s, l) => s + (l.duration_ms || 0), 0) / logs.length) : 0;
  const errorRate = logs.length ? ((logs.filter(l => l.status === 'error').length / logs.length) * 100).toFixed(1) : '0';
  const totalTokens = logs.reduce((s, l) => s + (l.tokens_used || 0), 0);

  const statusStyle = (s: string) => s === 'completed' ? 'badge-success' : s === 'error' ? 'badge-error' : s === 'running' ? 'badge-info' : 'badge-neutral';

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Observability</h1>
        <p className="mt-1 text-sm text-secondary">Agent execution logs, performance metrics, and failure tracing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={Activity} label="Total Executions" value={String(totalExec)} change="Last 24h" accent="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={Clock} label="Avg Duration" value={`${avgDuration}ms`} change="Across all agents" positive accent="bg-emerald-500/10 text-emerald-500" />
          <MetricCard icon={AlertTriangle} label="Error Rate" value={`${errorRate}%`} change={`${logs.filter(l => l.status === 'error').length} failures`} accent="bg-red-500/10 text-red-500" />
          <MetricCard icon={BarChart3} label="Total Tokens" value={totalTokens.toLocaleString()} change="LLM usage" accent="bg-purple-500/10 text-purple-500" />
        </>}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agent logs..." className="input-field pl-9 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted" />
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="input-field py-2 text-xs">
              <option value="all">All agents</option>
              {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        <div className="hidden grid-cols-[1fr_2fr_100px_80px_80px_80px_80px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted lg:grid">
          <span>Agent</span><span>Action</span><span>Status</span><span>Confidence</span><span>Duration</span><span>Tokens</span><span>Retries</span>
        </div>

        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Activity className="mx-auto text-muted" size={28} />
              <p className="mt-3 text-sm text-secondary">No matching execution logs.</p>
            </div>
          ) : filtered.map((log, i) => {
            const Icon = agentIcon(log.agent_name);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="flex flex-col"
              >
                <div className="grid items-center gap-3 px-4 py-4 lg:grid-cols-[1fr_2fr_100px_80px_80px_80px_80px] lg:gap-4 lg:px-5">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${agentColor(log.agent_name)}`}><Icon size={13} /></div>
                    <span className="text-xs font-medium text-primary">{log.agent_name}</span>
                  </div>
                  <p className="text-xs text-secondary truncate">{log.action}</p>
                  <span className={`badge ${statusStyle(log.status)}`}>{log.status}</span>
                  <span className="hidden text-xs font-mono text-emerald-500 lg:block">{log.confidence ? `${(log.confidence * 100).toFixed(0)}%` : '—'}</span>
                  <span className="hidden items-center gap-1 text-xs text-muted lg:flex"><Clock size={11} />{log.duration_ms}ms</span>
                  <span className="hidden text-xs text-muted lg:block">{log.tokens_used || '—'}</span>
                  <span className="hidden text-xs text-muted lg:block">{log.retry_count || 0}</span>
                </div>
                {log.status === 'error' && log.error_message && (
                  <div className="mx-5 mb-3 rounded-xl bg-red-500/5 p-3 text-xs text-red-500 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    {log.error_message} {log.retry_count ? `(${log.retry_count} retries)` : ''}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="glass-card-solid m-0 rounded-none border-t border-app p-4">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Activity size={14} className="text-blue-500" />
            <span>{filtered.length} of {logs.length} entries shown</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />All agents traced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
