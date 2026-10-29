import { useState, useEffect } from 'react';
import { AlertTriangle, CircleDollarSign, Package, Search } from 'lucide-react';
import { fetchInventory } from '@/lib/api';
import type { InventoryItem } from '@/lib/types';
import { MetricCard } from '@/components/common/MetricCard';
import { SkeletonCard, SkeletonRow } from '@/components/Skeletons';

export function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => { fetchInventory().then(setItems).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = items.filter(i => `${i.products?.sku ?? ''} ${i.products?.name ?? ''} ${i.products?.category ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const lowCount = items.filter(i => i.quantity_on_hand <= i.reorder_point).length;
  const totalValue = items.reduce((s, i) => s + i.quantity_on_hand * (i.products?.unit_price ?? 0), 0);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Supply chain</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Inventory</h1><p className="mt-1 text-sm text-secondary">Real-time stock visibility across the main warehouse.</p></div>
        <div className="flex items-center gap-2"><span className="badge badge-warning"><AlertTriangle size={12} />{lowCount} below reorder point</span></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <MetricCard icon={Package} label="Active SKUs" value={String(items.length)} change="2.4%" positive accent="bg-blue-500/10 text-blue-500" />
          <MetricCard icon={AlertTriangle} label="Low stock items" value={String(lowCount)} change="Needs action" accent="bg-amber-500/10 text-amber-500" />
          <MetricCard icon={CircleDollarSign} label="Inventory value" value={`$${(totalValue / 1000).toFixed(1)}K`} change="6.1%" positive accent="bg-emerald-500/10 text-emerald-500" />
        </>}
      </div>
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-app p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search inventory..." className="input-field pl-9 text-xs" /></div>
          <span className="text-xs text-secondary">Main Warehouse · Updated just now</span>
        </div>
        <div className="hidden grid-cols-[1fr_1.6fr_1fr_100px_100px_120px] gap-4 border-b border-app bg-surface-hover px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid"><span>SKU</span><span>Product</span><span>Category</span><span>On hand</span><span>Reserved</span><span>Health</span></div>
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : filtered.map(item => { const low = item.quantity_on_hand <= item.reorder_point; return (
            <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_1.6fr_1fr_100px_100px_120px] sm:gap-4 sm:px-5">
              <span className="font-mono text-xs text-blue-500">{item.products?.sku ?? '—'}</span>
              <div className="flex min-w-0 items-center gap-2"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${low ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}><Package size={14} /></div><span className="truncate text-xs font-medium text-primary">{item.products?.name ?? 'Unknown'}</span></div>
              <span className="hidden text-xs text-secondary sm:block">{item.products?.category ?? '—'}</span>
              <span className={`text-xs font-semibold ${low ? 'text-amber-500' : 'text-primary'}`}>{item.quantity_on_hand}</span>
              <span className="hidden text-xs text-secondary sm:block">{item.quantity_reserved}</span>
              <span className={`badge ${low ? 'badge-warning' : 'badge-success'}`}>{low ? 'Reorder' : 'Healthy'}</span>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
