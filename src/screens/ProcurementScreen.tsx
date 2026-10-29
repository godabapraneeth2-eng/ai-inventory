import { useState, useEffect } from 'react';
import { FileText, PackagePlus, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonRow, SkeletonCard } from '@/components/Skeletons';

export function ProcurementScreen() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setPos([
        { id: 'PO-9912', sku: 'SKU-001', product: 'MacBook Pro 14-inch', quantity: 50, supplier: 'Apple Inc', status: 'pending', estimated_delivery: 'Aug 28, 2026' },
        { id: 'PO-9913', sku: 'SKU-011', product: 'Logitech M185 Mouse', quantity: 200, supplier: 'Logitech', status: 'processing', estimated_delivery: 'Aug 25, 2026' },
        { id: 'PO-9914', sku: 'SKU-004', product: 'Dell UltraSharp Monitor', quantity: 30, supplier: 'Dell Technologies', status: 'completed', estimated_delivery: 'Aug 22, 2026' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleGeneratePOs = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setPos(prev => [{ id: 'PO-9915', sku: 'SKU-029', product: 'Herman Miller Chair', quantity: 15, supplier: 'Herman Miller', status: 'pending', estimated_delivery: 'Sep 02, 2026' }, ...prev]);
    }, 1500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Procurement</h1>
          <p className="mt-1 text-sm text-secondary">Automated purchase orders and supplier management.</p>
        </div>
        <button onClick={handleGeneratePOs} disabled={generating} className="btn-primary flex items-center gap-2 text-sm">
          {generating ? <Clock className="animate-spin" size={16} /> : <PackagePlus size={16} />}
          {generating ? 'Generating POs...' : 'Generate Auto POs'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <MetricCard icon={FileText} label="Active POs" value="14" change="2 generated today" accent="bg-blue-500/10 text-blue-500" />
            <MetricCard icon={Clock} label="Pending Delivery" value="1,240 items" change="ETA this week" accent="bg-amber-500/10 text-amber-500" />
            <MetricCard icon={CheckCircle} label="Total Ordered Items" value="8,402" change="15% YoY increase" positive accent="bg-emerald-500/10 text-emerald-500" />
            <MetricCard icon={DollarSign} label="Budget Used (Q3)" value="$1.2M" change="45% of quarterly cap" positive accent="bg-purple-500/10 text-purple-500" />
          </>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden grid-cols-[1fr_2fr_100px_1.5fr_120px_150px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid">
          <span>PO #</span>
          <span>Product (SKU)</span>
          <span>Quantity</span>
          <span>Supplier</span>
          <span>Status</span>
          <span>Est. Delivery</span>
        </div>
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : pos.map(po => (
            <div key={po.id} className="grid w-full items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_2fr_100px_1.5fr_120px_150px] sm:gap-4 sm:px-5">
              <span className="font-mono text-xs font-medium text-blue-500">{po.id}</span>
              <div>
                <p className="text-xs font-medium text-primary">{po.product}</p>
                <p className="font-mono text-[10px] text-muted">{po.sku}</p>
              </div>
              <span className="text-xs font-semibold text-primary">{po.quantity}</span>
              <span className="text-xs text-secondary">{po.supplier}</span>
              <StatusBadge status={po.status} />
              <span className="text-xs text-secondary flex items-center gap-1.5"><Clock size={12} className="text-muted" />{po.estimated_delivery}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
