import type { Produto } from '@/src/types/produto';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { csvService } from './csvService';

export const produtoService = {
  async list(): Promise<Produto[]> {
    if (isSupabaseConfigured()) {
      return produtoService.listFromSupabase();
    }
    return csvService.loadFromPath();
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
