import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, ShieldAlert, ShieldCheck, ShieldX, TrendingDown, Zap } from 'lucide-react';
import { fetchRiskReports } from '@/lib/api';
import type { RiskReport } from '@/lib/types';
import { SkeletonBlock } from '@/components/Skeletons';

function riskColor(level: string) {
  return level === 'high' ? 'text-red-500 bg-red-500/10' : level === 'medium' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
}

function riskBadge(level: string) {
  return level === 'high' ? 'badge-error' : level === 'medium' ? 'badge-warning' : 'badge-success';
}

function RiskGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 60 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#22c55e';
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgb(var(--color-border))" strokeWidth="6" />
        <motion.circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] uppercase tracking-wider text-muted">score</span>
      </div>
    </div>
  );
}

export function RiskCenterScreen() {
  const [reports, setReports] = useState<RiskReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskReports()
      .then(setReports)
      .catch(() => setError('Failed to load risk reports'))
      .finally(() => setLoading(false));
  }, []);

  const highRisk = reports.filter(r => r.risk_level === 'high');
  const mediumRisk = reports.filter(r => r.risk_level === 'medium');
  const lowRisk = reports.filter(r => r.risk_level === 'low');
  const avgScore = reports.length ? Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / reports.length) : 0;

  if (loading) return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} lines={3} />)}</div><SkeletonBlock lines={6} /></div>;
  if (error) return <div className="glass-card p-8 text-center"><AlertTriangle className="mx-auto text-amber-500" size={28} /><p className="mt-3 text-sm text-secondary">{error}</p></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Risk center</h1>
        <p className="mt-1 text-sm text-secondary">Payment risk assessments from the Risk Agent across all processed orders.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div whileHover={{ y: -3 }} className="glass-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><ShieldX size={19} /></div>
          <p className="mt-4 text-sm text-secondary">High risk</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{highRisk.length}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} className="glass-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500"><ShieldAlert size={19} /></div>
          <p className="mt-4 text-sm text-secondary">Medium risk</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{mediumRisk.length}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} className="glass-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><ShieldCheck size={19} /></div>
          <p className="mt-4 text-sm text-secondary">Low risk</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{lowRisk.length}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} className="glass-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><TrendingDown size={19} /></div>
          <p className="mt-4 text-sm text-secondary">Avg risk score</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{avgScore}</p>
        </motion.div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-app px-5 py-4">
          <h2 className="font-semibold text-primary">Risk assessments</h2>
          <p className="mt-1 text-xs text-secondary">Each report is generated deterministically by the Payment Risk Agent.</p>
        </div>
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {reports.length === 0 && <div className="px-5 py-12 text-center"><ShieldCheck className="mx-auto text-emerald-500" size={28} /><p className="mt-3 text-sm text-secondary">No risk reports yet. Reports are generated when orders are processed.</p></div>}
          {reports.map((report, i) => (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} key={report.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
              <RiskGauge score={report.risk_score} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-blue-500">{report.orders?.order_number ?? '—'}</span>
                  <span className={`badge ${riskBadge(report.risk_level)}`}>{report.risk_level}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-primary">{report.customers?.name ?? 'Unknown customer'}</p>
                <p className="mt-2 text-xs leading-relaxed text-secondary">{report.explanation}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted">
                  <span>Credit: <strong className="text-secondary">{report.credit_score}</strong></span>
                  <span>Late payments: <strong className="text-secondary">{report.late_payment_count}</strong></span>
                  <span>Outstanding: <strong className="text-secondary">${Number(report.outstanding_balance).toLocaleString()}</strong></span>
                  <span>Order value: <strong className="text-secondary">${Number(report.order_value).toLocaleString()}</strong></span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <span className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${riskColor(report.risk_level)}`}>
                  {report.risk_level === 'high' ? <ShieldX size={13} /> : report.risk_level === 'medium' ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                  {report.recommendation ?? 'Standard terms'}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted"><Zap size={10} />{report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
