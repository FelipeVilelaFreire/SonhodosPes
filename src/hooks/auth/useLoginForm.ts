'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { useToast } from '@/src/contexts/ToastContext';

export interface LoginFormState {
  email: string;
  password: string;
  errors: { email?: string; password?: string; general?: string };
  submitting: boolean;
}

export interface UseLoginFormReturn {
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  generalError?: string;
  submitting: boolean;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  fillDemo: (role: 'admin' | 'gerente' | 'vendedora') => void;
}

const DEMO_CREDENTIALS = {
  admin: { email: 'admin@sonhodospes.com', password: 'admin123' },
  gerente: { email: 'gerente@sonhodospes.com', password: 'gerente123' },
  vendedora: { email: 'vendedora@sonhodospes.com', password: 'vendedora123' },
};

export function useLoginForm(): UseLoginFormReturn {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<LoginFormState>({
    email: '',
    password: '',
    errors: {},
    submitting: false,
  });

  const setEmail = (v: string) =>
    setState(s => ({ ...s, email: v, errors: { ...s.errors, email: undefined, general: undefined } }));

  const setPassword = (v: string) =>
    setState(s => ({ ...s, password: v, errors: { ...s.errors, password: undefined, general: undefined } }));

  const fillDemo = (role: 'admin' | 'gerente' | 'vendedora') => {
    const creds = DEMO_CREDENTIALS[role];
    setState(s => ({ ...s, email: creds.email, password: creds.password, errors: {} }));
  };

  const validate = (): boolean => {
    const errors: LoginFormState['errors'] = {};
    if (!state.email.trim()) errors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errors.email = 'Email inválido';
    if (!state.password) errors.password = 'Senha é obrigatória';
    setState(s => ({ ...s, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setState(s => ({ ...s, submitting: true, errors: {} }));
    try {
      const user = await login(state.email, state.password);
      showSuccess(`Bem-vinda, ${user.nome.split(' ')[0]}!`);
      const redirectTo = searchParams?.get('redirectTo') || '/';
      router.push(redirectTo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao fazer login';
      setState(s => ({ ...s, errors: { general: msg }, submitting: false }));
      showError(msg);
    }
  };

  return {
    email: state.email,
    password: state.password,
    emailError: state.errors.email,
    passwordError: state.errors.password,
    generalError: state.errors.general,
    submitting: state.submitting,
    setEmail,
    setPassword,
    handleSubmit,
    fillDemo,
  };
}
