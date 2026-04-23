'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/src/types/auth';
import { isSupabaseConfigured, getSupabase } from '@/src/services/supabase';
import { findMockUser } from '@/src/mocks/users';
import { simulateApiDelay } from '@/src/mocks';

const STORAGE_KEY_MOCK_SESSION = 'sdp:mock-session';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  mockMode: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isGerente: boolean;
  isVendedora: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mockMode = !isSupabaseConfigured();

  useEffect(() => {
    async function bootstrap() {
      if (mockMode) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY_MOCK_SESSION);
          if (raw) setUser(JSON.parse(raw));
        } catch (e) {
          console.warn('Erro ao restaurar sessão mock:', e);
        }
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? '',
          nome: data.user.user_metadata?.nome ?? data.user.email?.split('@')[0] ?? 'Usuário',
          role: data.user.user_metadata?.role ?? 'vendedora',
          loja: data.user.user_metadata?.loja,
        });
      }
      setLoading(false);
    }
    bootstrap();
  }, [mockMode]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    if (mockMode) {
      await simulateApiDelay(400);
      const found = findMockUser(email, password);
      if (!found) {
        throw new Error('Email ou senha incorretos');
      }
      localStorage.setItem(STORAGE_KEY_MOCK_SESSION, JSON.stringify(found));
      setUser(found);
      return found;
    }

    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const u = data.user;
    if (!u) throw new Error('Login falhou');

    const mapped: User = {
      id: u.id,
      email: u.email ?? '',
      nome: u.user_metadata?.nome ?? u.email?.split('@')[0] ?? 'Usuário',
      role: u.user_metadata?.role ?? 'vendedora',
      loja: u.user_metadata?.loja,
    };
    setUser(mapped);
    return mapped;
  }, [mockMode]);

  const logout = useCallback(async () => {
    if (mockMode) {
      localStorage.removeItem(STORAGE_KEY_MOCK_SESSION);
      setUser(null);
      return;
    }
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [mockMode]);

  const hasRole = useCallback(
    (roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user]
  );

  const value: AuthContextValue = {
    user,
    loading,
    mockMode,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isGerente: user?.role === 'gerente',
    isVendedora: user?.role === 'vendedora',
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>');
  return ctx;
}
