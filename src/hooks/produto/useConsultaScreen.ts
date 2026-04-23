'use client';

import { useCallback, useEffect } from 'react';
import type { Produto } from '@/src/types/produto';
import { useProdutoList } from './useProdutoList';
import { useProdutoSearch } from './useProdutoSearch';
import { useStack } from './useStack';
import { useOnlineStatus } from '../shared/useOnlineStatus';

export interface UseConsultaScreenReturn {
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  results: Produto[];
  hasQuery: boolean;

  stack: Produto[];
  stackCount: number;
  addToStack: (produto: Produto) => void;
  removeFromStack: (codigo: string) => void;
  clearStack: () => void;

  isOnline: boolean;
}

export function useConsultaScreen(): UseConsultaScreenReturn {
  const { produtos, loading, error, reload } = useProdutoList();
  const search = useProdutoSearch({ produtos });
  const stackHelper = useStack();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (search.exactMatch) {
      const { wasNew } = stackHelper.add(search.exactMatch);
      if (wasNew) search.clearQuery();
    }
  }, [search, stackHelper]);

  const addToStack = useCallback(
    (produto: Produto) => {
      stackHelper.add(produto);
      search.clearQuery();
    },
    [stackHelper, search]
  );

  return {
    produtos,
    loading,
    error,
    reload,

    query: search.query,
    setQuery: search.setQuery,
    clearQuery: search.clearQuery,
    results: search.results,
    hasQuery: search.hasQuery,

    stack: stackHelper.stack,
    stackCount: stackHelper.count,
    addToStack,
    removeFromStack: stackHelper.remove,
    clearStack: stackHelper.clear,

    isOnline,
  };
}
