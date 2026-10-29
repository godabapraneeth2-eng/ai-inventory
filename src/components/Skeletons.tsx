export function SkeletonCard() {
  return <div className="glass-card p-5"><div className="flex items-start justify-between"><div className="shimmer h-10 w-10 rounded-xl" /><div className="shimmer h-4 w-16 rounded" /></div><div className="mt-4 shimmer h-3 w-24 rounded" /><div className="mt-2 shimmer h-7 w-20 rounded" /></div>;
}

export function SkeletonRow() {
  return <div className="flex items-center gap-3 px-5 py-4"><div className="shimmer h-8 w-8 rounded-lg" /><div className="flex-1 space-y-2"><div className="shimmer h-3 w-32 rounded" /><div className="shimmer h-2 w-20 rounded" /></div><div className="shimmer h-6 w-16 rounded-full" /></div>;
}

export function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return <div className="glass-card p-6 space-y-4">{Array.from({ length: lines }).map((_, i) => <div key={i} className="shimmer h-4 rounded" style={{ width: `${100 - i * 12}%` }} />)}</div>;
}
