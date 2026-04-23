'use client';

import { useCallback, useState } from 'react';
import type { Produto } from '@/src/types/produto';

export interface UseStackReturn {
  stack: Produto[];
  add: (produto: Produto) => { wasNew: boolean };
  remove: (codigo: string) => void;
  clear: () => void;
  has: (codigo: string) => boolean;
  count: number;
}

export function useStack(): UseStackReturn {
  const [stack, setStack] = useState<Produto[]>([]);

  const add = useCallback((produto: Produto) => {
    let wasNew = false;
    setStack(prev => {
      if (prev.some(p => p.codigo === produto.codigo)) return prev;
      wasNew = true;
      return [produto, ...prev];
    });
    return { wasNew };
  }, []);

  const remove = useCallback((codigo: string) => {
    setStack(prev => prev.filter(p => p.codigo !== codigo));
  }, []);

  const clear = useCallback(() => setStack([]), []);

  const has = useCallback(
    (codigo: string) => stack.some(p => p.codigo === codigo),
    [stack]
  );

  return { stack, add, remove, clear, has, count: stack.length };
}
