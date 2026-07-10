import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X as XIcon, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue>({ toast: () => {} });

const TOAST_ICONS = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: 'border-success/20 bg-success/5',
  error: 'border-destructive/20 bg-destructive/5',
  info: 'border-border bg-card',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = TOAST_ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
                  TOAST_STYLES[t.type]
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-foreground">{t.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
