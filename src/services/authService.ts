import type { LoginInput, User } from '@/src/types/auth';
import { getSupabase } from './supabase';

export const authService = {
  async login({ email, password }: LoginInput): Promise<User> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const u = data.user;
    if (!u) throw new Error('Login falhou: usuário inválido');

    return {
      id: u.id,
      email: u.email ?? '',
      nome: u.user_metadata?.nome ?? u.email?.split('@')[0] ?? 'Usuário',
      role: u.user_metadata?.role ?? 'vendedora',
      loja: u.user_metadata?.loja,
    };
  },

  async logout(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return null;

    return {
      id: u.id,
      email: u.email ?? '',
      nome: u.user_metadata?.nome ?? u.email?.split('@')[0] ?? 'Usuário',
      role: u.user_metadata?.role ?? 'vendedora',
      loja: u.user_metadata?.loja,
    };
  },
};
