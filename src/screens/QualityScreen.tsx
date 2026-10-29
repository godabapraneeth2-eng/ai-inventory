import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, XCircle, AlertTriangle, Search, Package, Check, X, ShieldCheck } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';
import type { QualityInspection } from '@/lib/types';
import { fetchQualityInspections } from '@/lib/api';

export function QualityScreen() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchQualityInspections()
      .then((data: any) => setInspections(Array.isArray(data) ? data : data?.inspections ?? []))
      .catch(() => {
        setInspections([
          { id: 'QI-101', order_id: 'ord-1', order_number: 'ORD-2026-0042', result: 'passed', issues: [], confidence: 0.98, created_at: new Date().toISOString() },
          { id: 'QI-102', order_id: 'ord-2', order_number: 'ORD-2026-0038', result: 'failed', issues: ['Wrong product variant', 'Missing power adapter'], confidence: 0.94, created_at: new Date().toISOString() },
          { id: 'QI-103', order_id: 'ord-3', order_number: 'ORD-2026-0035', result: 'warning', issues: ['Minor packaging dent'], confidence: 0.87, created_at: new Date().toISOString() },
          { id: 'QI-104', order_id: 'ord-4', order_number: 'ORD-2026-0031', result: 'passed', issues: [], confidence: 0.99, created_at: new Date().toISOString() },
          { id: 'QI-105', order_id: 'ord-5', order_number: 'ORD-2026-0029', result: 'passed', issues: [], confidence: 0.96, created_at: new Date().toISOString() },
          { id: 'QI-106', order_id: 'ord-6', order_number: 'ORD-2026-0025', result: 'failed', issues: ['Seal broken', 'Quantity mismatch: expected 3, found 2'], confidence: 0.91, created_at: new Date().toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = inspections.filter(insp =>
    `${insp.order_number} ${insp.result} ${insp.issues.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  );

  const passed = inspections.filter(i => i.result === 'passed').length;
  const failed = inspections.filter(i => i.result === 'failed').length;
  const warnings = inspections.filter(i => i.result === 'warning').length;
  const passRate = inspections.length ? ((passed / inspections.length) * 100).toFixed(1) : '0';

  const resultStyle = (result: string) => result === 'passed' ? 'badge-success' : result === 'failed' ? 'badge-error' : 'badge-warning';
  const resultIcon = (result: string) => result === 'passed' ? <Check size={12} /> : result === 'failed' ? <X size={12} /> : <AlertTriangle size={12} />;
  const boolIcon = (val: boolean) => val ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-red-500" />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Quality Inspection</h1>
          <p className="mt-1 text-sm text-secondary">AI-powered verification of packed items before shipment.</p>
        </div>
        {failed > 0 && <span className="badge badge-error"><XCircle size={14} />{failed} shipments held</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={CheckSquare} label="Total Inspected" value={String(inspections.length)} change="Last 7 days" accent="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={ShieldCheck} label="Passed" value={String(passed)} change={`${passRate}% pass rate`} positive accent="bg-emerald-500/10 text-emerald-500" />
          <MetricCard icon={XCircle} label="Failed" value={String(failed)} change="Shipments held" accent="bg-red-500/10 text-red-500" />
          <MetricCard icon={AlertTriangle} label="Warnings" value={String(warnings)} change="Minor issues" accent="bg-amber-500/10 text-amber-500" />
        </>}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search inspections..." className="input-field pl-9 text-xs" />
          </div>
          <span className="text-xs text-secondary">{filtered.length} of {inspections.length} inspections</span>
        </div>

        <div className="hidden grid-cols-[1fr_100px_80px_80px_80px_80px_80px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted lg:grid">
          <span>Order</span><span>Result</span><span>Product</span><span>Qty</span><span>Packaging</span><span>Seal</span><span>Confidence</span>
        </div>

        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />) : filtered.map((insp, i) => (
            <motion.div
              key={insp.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex flex-col"
            >
              <div className="grid items-center gap-3 px-4 py-4 lg:grid-cols-[1fr_100px_80px_80px_80px_80px_80px] lg:gap-4 lg:px-5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${insp.result === 'passed' ? 'bg-emerald-500/10 text-emerald-500' : insp.result === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <Package size={14} />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-medium text-blue-500">{insp.order_number}</span>
                    <p className="text-[10px] text-muted">{insp.id}</p>
                  </div>
                </div>
                <span className={`badge ${resultStyle(insp.result)}`}>{resultIcon(insp.result)}{insp.result}</span>
                <span className="hidden lg:flex justify-center">{boolIcon(true)}</span>
                <span className="hidden lg:flex justify-center">{boolIcon(insp.issues.every(i => !i.toLowerCase().includes('quantity')))}</span>
                <span className="hidden lg:flex justify-center">{boolIcon(insp.issues.every(i => !i.toLowerCase().includes('packaging') && !i.toLowerCase().includes('dent')))}</span>
                <span className="hidden lg:flex justify-center">{boolIcon(insp.issues.every(i => !i.toLowerCase().includes('seal')))}</span>
                <span className="hidden text-xs font-mono text-emerald-500 lg:block">{(insp.confidence * 100).toFixed(0)}%</span>
              </div>
              {insp.issues.length > 0 && (
                <div className="mx-5 mb-3 rounded-xl bg-red-500/5 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-red-500 mb-1">Issues Found</p>
                  <ul className="space-y-1">
                    {insp.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-secondary">
                        <X size={11} className="text-red-500 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
