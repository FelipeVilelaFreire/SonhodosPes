'use client';

import { useMemo, useState } from 'react';
import type { Produto } from '@/src/types/produto';
import { isAllDigits, normalizeText, padCodigo } from '@/src/utils/normalize';
import { APP_CONFIG } from '@/src/constants/config';

export interface UseProdutoSearchOptions {
  produtos: Produto[];
}

export interface UseProdutoSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  results: Produto[];
  exactMatch: Produto | null;
  hasQuery: boolean;
}

export function useProdutoSearch({ produtos }: UseProdutoSearchOptions): UseProdutoSearchReturn {
  const [query, setQuery] = useState('');

  const byCodigoMap = useMemo(() => {
    const m = new Map<string, Produto>();
    produtos.forEach(p => m.set(p.codigo, p));
    return m;
  }, [produtos]);

  const { results, exactMatch } = useMemo(() => {
    const raw = query.trim();
    if (!raw) return { results: [], exactMatch: null };

    if (isAllDigits(raw) && raw.length === 5) {
      const exact = byCodigoMap.get(padCodigo(raw)) ?? null;
      return { results: exact ? [exact] : [], exactMatch: exact };
    }

    if (isAllDigits(raw)) {
      const partial = produtos
        .filter(p => p.codigo.startsWith(raw))
        .slice(0, APP_CONFIG.MAX_AUTOCOMPLETE);
      return { results: partial, exactMatch: null };
    }

    const terms = normalizeText(raw).split(/\s+/).filter(Boolean);
    const matches = produtos
      .filter(p => terms.every(t => p.searchIndex.includes(t)))
      .slice(0, APP_CONFIG.MAX_AUTOCOMPLETE);

    return { results: matches, exactMatch: null };
  }, [query, produtos, byCodigoMap]);

  return {
    query,
    setQuery,
    clearQuery: () => setQuery(''),
    results,
    exactMatch,
    hasQuery: query.trim().length > 0,
  };
}
