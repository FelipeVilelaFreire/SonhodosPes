import type { Produto } from '@/src/types/produto';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { csvService } from './csvService';
import { cacheService } from './cacheService';

export const produtoService = {
  async list(): Promise<Produto[]> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      const cached = cacheService.get();
      if (cached.length) return cached;
      // último recurso offline: CSV estático local
      return csvService.loadFromPath();
    }

    try {
      const produtos = await produtoService.fetchFresh();
      cacheService.set(produtos);
      return produtos;
    } catch {
      // falhou online (ex: Supabase fora) — usa cache se tiver
      const cached = cacheService.get();
      if (cached.length) return cached;
      return csvService.loadFromPath();
    }
  },

  async fetchFresh(): Promise<Produto[]> {
    if (isSupabaseConfigured()) {
      return produtoService.listFromSupabase();
    }
    return csvService.loadFromPath();
  },

  async syncNow(): Promise<{ produtos: Produto[]; total: number }> {
    const produtos = await produtoService.fetchFresh();
    cacheService.set(produtos);
    return { produtos, total: produtos.length };
  },

  async listFromSupabase(): Promise<Produto[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('produtos_view')
      .select('*');

    if (error) throw error;
    return (data as Produto[]) ?? [];
  },

  async getByCodigo(codigo: string): Promise<Produto | null> {
    const all = await produtoService.list();
    return all.find(p => p.codigo === codigo) ?? null;
  },
};
