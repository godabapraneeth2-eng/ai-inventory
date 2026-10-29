import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

export function MetricCard({ icon: Icon, label, value, change, positive, accent }: { icon: any; label: string; value: string; change: string; positive?: boolean; accent: string }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={19} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-500' : 'text-amber-500'}`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}
        </span>
      </div>
      <p className="mt-4 text-sm text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">{value}</p>
    </motion.div>
  );
}
