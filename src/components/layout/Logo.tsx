import { Command } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="gradient-hero flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-blue-500/20">
        <Command size={18} />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight text-primary">
          NEXUS<span className="text-blue-500">.AI</span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          Enterprise Platform
        </div>
      </div>
    </div>
  );
}
