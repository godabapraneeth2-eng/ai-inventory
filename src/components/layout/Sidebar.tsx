import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, ShieldAlert, Activity, Sparkles, 
  RotateCcw, ShieldBan, FileText, Truck, LineChart, CheckSquare, 
  ListChecks, ServerCrash, Settings 
} from 'lucide-react';
import { Logo } from './Logo';

export function Sidebar({ open, setOpen, counts = { orders: 0, alerts: 0 } }: { open: boolean; setOpen: (o: boolean) => void; counts?: { orders: number; alerts: number } }) {
  const location = useLocation();
  const screen = location.pathname.substring(1) || 'dashboard';

  const workspaceNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: counts.orders },
    { id: 'inventory', label: 'Inventory', icon: Package, count: counts.alerts },
  ];
  
  const intelNav = [
    { id: 'risk', label: 'Risk center', icon: ShieldAlert },
    { id: 'audit', label: 'Audit trail', icon: Activity },
    { id: 'assistant', label: 'AI assistant', icon: Sparkles },
  ];

  const opsNav = [
    { id: 'returns', label: 'Returns', icon: RotateCcw },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'procurement', label: 'Procurement', icon: FileText },
    { id: 'quality', label: 'Quality', icon: CheckSquare },
  ];

  const securityNav = [
    { id: 'fraud', label: 'Fraud detection', icon: ShieldBan },
    { id: 'approvals', label: 'Approvals', icon: ListChecks },
  ];

  const analyticsNav = [
    { id: 'executive', label: 'Executive Dashboard', icon: LineChart },
    { id: 'observability', label: 'Observability', icon: ServerCrash },
  ];

  const renderNav = (items: any[]) => items.map(item => {
    const Icon = item.icon;
    const isActive = screen === item.id;
    return (
      <Link 
        key={item.id} 
        to={`/${item.id}`}
        onClick={() => setOpen(false)} 
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-blue-500/10 font-medium text-blue-500' : 'text-secondary hover:bg-surface-hover hover:text-primary'}`}
      >
        <span className="flex items-center gap-3"><Icon size={17} />{item.label}</span>
        {item.count !== undefined && item.count > 0 && (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-blue-500/15 text-blue-500' : 'bg-surface-hover text-muted'}`}>{item.count}</span>
        )}
      </Link>
    );
  });

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden ${open ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-app bg-surface px-4 py-6 transition-transform duration-300 lg:static lg:translate-x-0 overflow-y-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-3"><Logo /></div>
        
        <div className="mt-8 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Workspace</div>
        <nav className="mt-3 space-y-1">{renderNav(workspaceNav)}</nav>
        
        <div className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Intelligence</div>
        <nav className="mt-3 space-y-1">{renderNav(intelNav)}</nav>

        <div className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Operations</div>
        <nav className="mt-3 space-y-1">{renderNav(opsNav)}</nav>

        <div className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Security</div>
        <nav className="mt-3 space-y-1">{renderNav(securityNav)}</nav>

        <div className="mt-6 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Analytics</div>
        <nav className="mt-3 space-y-1">{renderNav(analyticsNav)}</nav>

        <div className="mt-auto pt-8">
          <div className="mb-4 rounded-2xl bg-surface-hover p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Agents operational
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-secondary">All systems are running within normal parameters.</p>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary hover:bg-surface-hover">
            <Settings size={17} />Settings
          </button>
        </div>
      </aside>
    </>
  );
}
