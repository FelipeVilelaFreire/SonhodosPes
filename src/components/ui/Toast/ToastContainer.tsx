'use client';

import { CheckCircle2, XCircle, AlertTriangle, Info, X, type LucideIcon } from 'lucide-react';
import { useToast } from '@/src/contexts/ToastContext';
import type { ToastKind } from '@/src/contexts/ToastContext';
import styles from './Toast.module.css';

const ICON: Record<ToastKind, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map(t => {
        const Icon = ICON[t.kind];
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
            <Icon size={18} />
            <span className={styles.message}>{t.message}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => dismiss(t.id)}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
