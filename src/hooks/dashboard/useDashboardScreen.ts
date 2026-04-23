'use client';

import { useMemo } from 'react';
import { useProdutoList } from '@/src/hooks/produto/useProdutoList';
import { computeStatsFromProdutos, type DashboardStats } from '@/src/mocks/stats';
import { getMockHistoricoRecentes } from '@/src/mocks/historico';
import type { LogMudanca } from '@/src/types/estoque';

export interface UseDashboardScreenReturn {
  stats: DashboardStats | null;
  recentLogs: LogMudanca[];
  loading: boolean;
  error: string | null;
}

export function useDashboardScreen(): UseDashboardScreenReturn {
  const { produtos, loading, error } = useProdutoList();

  const stats = useMemo<DashboardStats | null>(() => {
    if (!produtos.length) return null;
    return computeStatsFromProdutos(produtos);
  }, [produtos]);

  const recentLogs = useMemo(() => getMockHistoricoRecentes(5), []);

  return { stats, recentLogs, loading, error };
}
