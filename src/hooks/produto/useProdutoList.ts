'use client';

import { useCallback, useEffect, useState } from 'react';
import { produtoService } from '@/src/services';
import type { Produto } from '@/src/types/produto';

export interface UseProdutoListReturn {
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useProdutoList(): UseProdutoListReturn {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await produtoService.list();
      setProdutos(data);
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { produtos, loading, error, reload: load };
}
