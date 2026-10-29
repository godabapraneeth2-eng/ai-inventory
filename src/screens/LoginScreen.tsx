import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/layout/Logo';
import { UserRole } from '@/lib/types';

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard');
  };

  const roles: { role: UserRole; desc: string }[] = [
    { role: 'admin', desc: 'Full system access' },
    { role: 'manager', desc: 'Operations & oversight' },
    { role: 'support', desc: 'Customer support' },
    { role: 'warehouse', desc: 'Inventory & shipping' },
    { role: 'finance', desc: 'Approvals & fraud' },
    { role: 'customer', desc: 'External view' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-primary">Sign in to workspace</h1>
          <p className="mt-2 text-sm text-secondary">Select a demo role to continue</p>
        </div>

        <div className="grid gap-3">
          {roles.map(({ role, desc }) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className="flex items-center gap-4 rounded-xl border border-[rgb(var(--color-border))] bg-surface p-4 text-left transition hover:border-blue-500/30 hover:bg-surface-hover hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                {role === 'admin' ? <ShieldCheck size={18} /> : <User size={18} />}
              </div>
              <div>
                <p className="font-medium capitalize text-primary">{role}</p>
                <p className="text-xs text-secondary">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
