import type { AtualizarEstoqueInput, EstoqueEntry, LogMudanca } from '@/src/types/estoque';
import { getSupabase } from './supabase';

export const estoqueService = {
  async vender(estoqueId: string, quantidade = 1, observacao?: string): Promise<EstoqueEntry> {
    return estoqueService.atualizar({
      estoqueId,
      operacao: 'venda',
      delta: -quantidade,
      observacao,
    });
  },

  async devolver(estoqueId: string, quantidade = 1, observacao?: string): Promise<EstoqueEntry> {
    return estoqueService.atualizar({
      estoqueId,
      operacao: 'devolucao',
      delta: +quantidade,
      observacao,
    });
  },

  async ajustar(estoqueId: string, quantidadeAbsoluta: number, observacao?: string): Promise<EstoqueEntry> {
    return estoqueService.atualizar({
      estoqueId,
      operacao: 'ajuste',
      quantidadeAbsoluta,
      observacao,
    });
  },

  async atualizar(_input: AtualizarEstoqueInput): Promise<EstoqueEntry> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase necessário para edição de estoque');

    throw new Error('Não implementado ainda — aguardando schema Supabase');
  },

  async getHistorico(_estoqueId?: string, _limit = 50): Promise<LogMudanca[]> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase necessário para histórico');

    throw new Error('Não implementado ainda — aguardando schema Supabase');
  },
};
