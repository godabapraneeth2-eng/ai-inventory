import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  LayoutDashboard, ShoppingCart, Package, ShieldAlert, Activity, Sparkles,
  RotateCcw, Truck, FileText, CheckSquare, ShieldBan, ListChecks,
  LineChart, ServerCrash, Plus, Search
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 p-4 pt-[15vh] backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-app bg-surface shadow-2xl">
        <Command className="w-full">
          <div className="flex items-center border-b border-app px-4 py-3">
            <Search className="mr-3 text-muted" size={18} />
            <Command.Input
              placeholder="Type a command or jump to screen... (ESC to close)"
              className="w-full bg-transparent text-sm text-primary placeholder-muted outline-none"
              autoFocus
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-center text-xs text-muted">
              No matching commands found.
            </Command.Empty>

            <Command.Group heading="Workspace" className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <LayoutDashboard size={16} /> Overview Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/orders'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <ShoppingCart size={16} /> Orders & Workflows
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/inventory'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <Package size={16} /> Inventory Stock
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Operations & Logistics" className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/returns'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <RotateCcw size={16} /> Returns & Refunds AI
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/shipping'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <Truck size={16} /> Shipping Intelligence
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/procurement'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <FileText size={16} /> Auto-Procurement
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/quality'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <CheckSquare size={16} /> Quality Inspection
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Intelligence & Security" className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/assistant'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <Sparkles size={16} /> AI Assistant (Enterprise RAG)
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/fraud'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <ShieldBan size={16} /> Fraud Detection Center
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/risk'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <ShieldAlert size={16} /> Risk Center
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/approvals'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <ListChecks size={16} /> Human-in-the-Loop Approvals
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Executive & Analytics" className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/executive'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <LineChart size={16} /> Executive CEO Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/observability'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <ServerCrash size={16} /> Agent Observability & Telemetry
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/audit'))}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-primary transition hover:bg-surface-hover hover:text-blue-500 aria-selected:bg-blue-500/10 aria-selected:text-blue-500"
              >
                <Activity size={16} /> System Audit Trail
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-app bg-surface-hover/50 px-4 py-2 text-[11px] text-muted">
            <span>Navigate with ↑↓, select with Enter</span>
            <span className="font-mono">⌘K / Ctrl+K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
