import { Menu, ChevronRight, Sun, Moon, Bell, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

export function Topbar({ onNewOrder }: { onNewOrder?: () => void }) {
  const { darkMode, setDarkMode, setSidebarOpen } = useAppStore();
  const { role } = useAuthStore();

  return (
    <header className="flex h-20 items-center justify-between border-b border-app px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="text-secondary lg:hidden" onClick={() => setSidebarOpen(true)}>
          <Menu size={21} />
        </button>
        <div className="hidden items-center gap-2 text-sm text-secondary sm:flex">
          <span className="text-muted">Workspace</span>
          <ChevronRight size={14} />
          <span className="font-medium text-primary capitalize">{role || 'Operations'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setDarkMode(!darkMode)} className="rounded-xl p-2.5 text-secondary transition hover:bg-surface-hover hover:text-primary">
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="relative rounded-xl p-2.5 text-secondary transition hover:bg-surface-hover hover:text-primary">
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-[rgb(var(--color-bg))]" />
        </button>
        <div className="mx-2 hidden h-6 w-px bg-[rgb(var(--color-border))] sm:block" />
        <div className="hidden items-center gap-2.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-500">
            EA
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-primary">Enterprise User</p>
            <p className="text-[10px] text-muted capitalize">{role || 'Admin'}</p>
          </div>
        </div>
        {onNewOrder && (
          <button onClick={onNewOrder} className="btn-primary ml-2 hidden items-center gap-2 text-xs sm:flex">
            <Plus size={15} />New order
          </button>
        )}
      </div>
    </header>
  );
}
