import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldBan, ShieldCheck, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonRow, SkeletonCard } from '@/components/Skeletons';
import { motion, AnimatePresence } from 'framer-motion';

function RiskGauge({ score }: { score: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score > 80 ? 'text-red-500' : score > 50 ? 'text-amber-500' : 'text-emerald-500';
  
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} className="stroke-surface-hover" strokeWidth="4" fill="transparent" />
        <circle cx="20" cy="20" r={radius} className={`stroke-current ${color}`} strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <span className={`absolute text-[10px] font-bold ${color}`}>{score}</span>
    </div>
  );
}

export function FraudScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setAlerts([
        { id: 'FRD-102', customer_name: 'John Doe', fraud_type: 'Identity Theft', score: 94, risk_level: 'high', status: 'blocked', explanation: 'Multiple high-value orders from new IPs', evidence: ['IP mismatch (Nigeria)', 'Credit card name mismatch', 'Velocity: 5 orders/hr'], created_at: new Date().toISOString() },
        { id: 'FRD-103', customer_name: 'Jane Smith', fraud_type: 'Return Fraud', score: 65, risk_level: 'medium', status: 'investigated', explanation: 'High frequency of returns on expensive items', evidence: ['Return rate > 60%', 'Box weight discrepancies'], created_at: new Date().toISOString() },
        { id: 'FRD-104', customer_name: 'Acme Corp', fraud_type: 'Account Takeover', score: 88, risk_level: 'high', status: 'active', explanation: 'Password reset followed by immediate address change', evidence: ['Password reset at 3am', 'Shipping address changed to freight forwarder'], created_at: new Date().toISOString() }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Security</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Fraud Detection</h1>
          <p className="mt-1 text-sm text-secondary">Real-time AI monitoring and threat prevention.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error animate-pulse"><ShieldAlert size={14} /> 3 Active Alerts</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <MetricCard icon={ShieldAlert} label="Active Alerts" value="3" change="Requires action" accent="bg-red-500/10 text-red-500" />
            <MetricCard icon={AlertTriangle} label="High Risk Flagged" value="12" change="Past 24h" accent="bg-amber-500/10 text-amber-500" />
            <MetricCard icon={ShieldBan} label="Accounts Blocked" value="142" change="8.4% from last week" positive accent="bg-blue-500/10 text-blue-500" />
            <MetricCard icon={ShieldCheck} label="Total Investigated" value="2,891" change="99.2% accuracy" positive accent="bg-emerald-500/10 text-emerald-500" />
          </>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input placeholder="Search alerts..." className="input-field pl-9 text-xs" />
          </div>
        </div>
        <div className="hidden grid-cols-[80px_1fr_1fr_120px_100px_40px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid">
          <span>Score</span>
          <span>Customer</span>
          <span>Fraud Type</span>
          <span>Risk Level</span>
          <span>Status</span>
          <span />
        </div>
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : alerts.map(alert => (
            <div key={alert.id} className="flex flex-col transition hover:bg-surface-hover">
              <div className="grid w-full cursor-pointer items-center gap-3 px-4 py-4 sm:grid-cols-[80px_1fr_1fr_120px_100px_40px] sm:gap-4 sm:px-5" onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}>
                <RiskGauge score={alert.score} />
                <div>
                  <p className="text-xs font-medium text-primary">{alert.customer_name}</p>
                  <p className="font-mono text-[10px] text-muted">{alert.id}</p>
                </div>
                <span className="text-xs text-secondary">{alert.fraud_type}</span>
                <span className={`text-xs capitalize ${alert.risk_level === 'high' ? 'text-red-500 font-semibold' : 'text-amber-500'}`}>{alert.risk_level} Risk</span>
                <StatusBadge status={alert.status === 'blocked' ? 'rejected' : alert.status === 'active' ? 'exception' : 'completed'} />
                <button className="text-secondary">{expanded === alert.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              </div>
              <AnimatePresence>
                {expanded === alert.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-surface-hover/50 px-5">
                    <div className="py-4 border-t border-app">
                      <p className="text-sm font-medium text-primary mb-2">AI Explanation</p>
                      <p className="text-xs text-secondary mb-4">{alert.explanation}</p>
                      <p className="text-sm font-medium text-primary mb-2">Evidence Points</p>
                      <ul className="list-disc pl-4 text-xs text-secondary space-y-1">
                        {alert.evidence.map((ev: string, idx: number) => <li key={idx}>{ev}</li>)}
                      </ul>
                      <div className="mt-4 flex gap-2">
                        {alert.status !== 'blocked' && <button className="btn-primary bg-red-500 hover:bg-red-600 text-xs py-1.5 px-3">Block Account</button>}
                        <button className="btn-secondary text-xs py-1.5 px-3">Clear Alert</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
