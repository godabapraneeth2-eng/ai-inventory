import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function LiveNotifications() {
  const { notifications, removeNotification } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500 shrink-0" />;
      default:
        return <Info size={16} className="text-blue-500 shrink-0" />;
    }
  };

  const getBorder = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'warning':
        return 'border-amber-500/30';
      case 'error':
        return 'border-red-500/30';
      default:
        return 'border-blue-500/30';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2.5">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`glass-card flex items-start gap-3 border ${getBorder(n.type)} p-4 shadow-xl backdrop-blur-md`}
          >
            <div className="mt-0.5">{getIcon(n.type)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">{n.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-secondary">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-muted transition hover:text-primary"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
