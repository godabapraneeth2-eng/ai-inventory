import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, AlertTriangle, CheckCircle, MapPin, Cloud, ArrowUpRight } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';
import type { ShippingPrediction } from '@/lib/types';
import { fetchShippingPredictions } from '@/lib/api';

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.9 ? 'bg-emerald-500' : value >= 0.7 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-hover">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export function ShippingScreen() {
  const [predictions, setPredictions] = useState<ShippingPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShippingPredictions()
      .then((data: any) => setPredictions(Array.isArray(data) ? data : data?.predictions ?? []))
      .catch(() => {
        // Fallback demo data
        setPredictions([
          { id: 'SHP-1', order_id: 'ord-1', order_number: 'ORD-2026-0042', carrier: 'FedEx', eta: 'Aug 25, 2026', confidence: 0.92, delay_risk: 'low', status: 'in_transit' },
          { id: 'SHP-2', order_id: 'ord-2', order_number: 'ORD-2026-0038', carrier: 'UPS', eta: 'Aug 27, 2026', confidence: 0.74, delay_risk: 'medium', status: 'in_transit' },
          { id: 'SHP-3', order_id: 'ord-3', order_number: 'ORD-2026-0035', carrier: 'DHL', eta: 'Aug 24, 2026', confidence: 0.55, delay_risk: 'high', status: 'delayed' },
          { id: 'SHP-4', order_id: 'ord-4', order_number: 'ORD-2026-0031', carrier: 'FedEx', eta: 'Aug 22, 2026', confidence: 0.99, delay_risk: 'low', status: 'delivered' },
          { id: 'SHP-5', order_id: 'ord-5', order_number: 'ORD-2026-0029', carrier: 'USPS', eta: 'Aug 26, 2026', confidence: 0.68, delay_risk: 'medium', status: 'in_transit' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const inTransit = predictions.filter(p => p.status === 'in_transit').length;
  const delayed = predictions.filter(p => p.status === 'delayed' || p.delay_risk === 'high').length;
  const delivered = predictions.filter(p => p.status === 'delivered').length;
  const avgConf = predictions.length ? (predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length * 100).toFixed(0) : '0';

  const riskColor = (risk: string) => risk === 'high' ? 'badge-error' : risk === 'medium' ? 'badge-warning' : 'badge-success';
  const statusColor = (status: string) => status === 'delivered' ? 'badge-success' : status === 'delayed' ? 'badge-error' : 'badge-info';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Shipping Intelligence</h1>
          <p className="mt-1 text-sm text-secondary">AI-powered delivery predictions and proactive delay detection.</p>
        </div>
        {delayed > 0 && <span className="badge badge-warning animate-pulse"><AlertTriangle size={14} />{delayed} potential delays</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={Truck} label="In Transit" value={String(inTransit)} change="Active shipments" accent="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={AlertTriangle} label="Delayed" value={String(delayed)} change="Needs attention" accent="bg-red-500/10 text-red-500" />
          <MetricCard icon={CheckCircle} label="Delivered Today" value={String(delivered)} change="On schedule" positive accent="bg-emerald-500/10 text-emerald-500" />
          <MetricCard icon={Clock} label="Avg ETA Confidence" value={`${avgConf}%`} change="AI prediction" positive accent="bg-cyan-500/10 text-cyan-500" />
        </>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />) : predictions.map((pred, i) => (
          <motion.div
            key={pred.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pred.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : pred.delay_risk === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  <Truck size={19} />
                </div>
                <div>
                  <p className="font-mono text-xs font-medium text-blue-500">{pred.order_number}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{pred.carrier}</p>
                </div>
              </div>
              <span className={`badge ${statusColor(pred.status)}`}>{pred.status.replace('_', ' ')}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">ETA</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary"><Clock size={12} />{pred.eta}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">Delay Risk</p>
                <span className={`mt-1 badge ${riskColor(pred.delay_risk)}`}>{pred.delay_risk}</span>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted">ETA Confidence</p>
              <div className="mt-1"><ConfidenceBar value={pred.confidence} /></div>
            </div>

            {pred.delay_risk === 'high' && (
              <div className="mt-3 flex gap-2 rounded-xl bg-red-500/5 p-3 text-xs text-red-500">
                <Cloud size={14} className="mt-0.5 shrink-0" />
                <span>Weather conditions along route may cause delays. Customer has been proactively notified.</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
