import { useState, useEffect } from 'react';
import { LineChart, Search, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';

export function ExecutiveScreen() {
  const [query, setQuery] = useState('');
  const [insight, setInsight] = useState('');
  
  const askAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setInsight('Analyzing the data across logistics and supply chain...');
    setTimeout(() => {
      setInsight('Based on current trends, your projected revenue this quarter is up 12.4%. We recommend increasing procurement for SKU-001 to prevent a stockout next week.');
    }, 1500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Analytics</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-secondary">High-level insights powered by Nexus AI.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Total Revenue (QTD)" value="$4.2M" change="12.4% vs last Q" positive accent="bg-emerald-500/10 text-emerald-500" />
        <MetricCard icon={LineChart} label="Profit Margin" value="28.4%" change="1.2%" positive accent="bg-blue-500/10 text-blue-500" />
        <MetricCard icon={AlertTriangle} label="Supply Shortage Risk" value="High" change="SKU-001 at risk" accent="bg-amber-500/10 text-amber-500" />
        <MetricCard icon={Sparkles} label="AI Decisions Made" value="142,092" change="99.8% confidence" positive accent="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Sparkles size={16} />
          </div>
          <h2 className="font-semibold text-primary">Ask Nexus AI</h2>
        </div>
        <form onSubmit={askAI} className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Ask about revenue, risks, or predictions..." 
            className="input-field w-full pl-11 py-3 text-sm bg-surface-hover border-transparent focus:border-blue-500/50" 
          />
        </form>
        {insight && (
          <div className="animate-fade-in rounded-xl bg-blue-500/5 p-4 border border-blue-500/20">
            <p className="text-sm text-primary leading-relaxed">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
