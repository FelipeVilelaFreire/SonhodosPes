'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, kind?: ToastKind) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastItem = { id, kind, message };
      setToasts(prev => [...prev, toast]);
      setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    toasts,
    showToast,
    showSuccess: (m: string) => showToast(m, 'success'),
    showError: (m: string) => showToast(m, 'error'),
    showInfo: (m: string) => showToast(m, 'info'),
    showWarning: (m: string) => showToast(m, 'warning'),
    dismiss,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve estar dentro de <ToastProvider>');
  return ctx;
}
