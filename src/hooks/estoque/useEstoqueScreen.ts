'use client';

import { useMemo, useState } from 'react';
import type { Produto } from '@/src/types/produto';
import type { Cor } from '@/src/types/cor';
import { useProdutoList } from '@/src/hooks/produto/useProdutoList';
import { useToast } from '@/src/contexts/ToastContext';
import { normalizeText } from '@/src/utils/normalize';
import { simulateApiDelay } from '@/src/mocks';
import { collectAllSizes } from '@/src/utils/mappers/produtoMappers';

export interface EstoqueRow {
  produto: Produto;
  cor: Cor;
  rowKey: string;
}

export interface EditTarget {
  produto: Produto;
  cor: Cor;
  tamanho: string;
  quantidadeAtual: number;
}

export interface UseEstoqueScreenReturn {
  rows: EstoqueRow[];
  allSizes: string[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
  categoria: string;
  setCategoria: (c: string) => void;
  apenasEsgotados: boolean;
  setApenasEsgotados: (v: boolean) => void;
  categorias: string[];
  editTarget: EditTarget | null;
  openEdit: (target: EditTarget) => void;
  closeEdit: () => void;
  saveEdit: (novaQuantidade: number, observacao?: string) => Promise<void>;
  saving: boolean;
}

export function useEstoqueScreen(): UseEstoqueScreenReturn {
  const { produtos, loading, error, reload } = useProdutoList();
  const { showSuccess, showError } = useToast();

  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  const [apenasEsgotados, setApenasEsgotados] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Record<string, number>>({});

  const categorias = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach(p => { if (p.categoria) set.add(p.categoria); });
    return Array.from(set).sort();
  }, [produtos]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach(p => {
      collectAllSizes(p, false).forEach(s => set.add(s));
    });
    return Array.from(set).sort((a, b) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b);
    });
  }, [produtos]);

  const rows: EstoqueRow[] = useMemo(() => {
    const q = normalizeText(query);
    const list: EstoqueRow[] = [];
    produtos.forEach(p => {
      if (categoria && p.categoria !== categoria) return;
      if (q && !p.searchIndex.includes(q)) return;
      p.cores.forEach((cor, i) => {
        const totalCor = Object.values(cor.tamanhos).reduce((a, b) => a + (b || 0), 0);
        if (apenasEsgotados && totalCor > 0) return;
        list.push({
          produto: p,
          cor: {
            ...cor,
            tamanhos: { ...cor.tamanhos, ...extractOverrides(p.codigo, cor.nome, localOverrides) },
          },
          rowKey: `${p.codigo}-${cor.nome}-${i}`,
        });
      });
    });
    return list;
  }, [produtos, query, categoria, apenasEsgotados, localOverrides]);

  const openEdit = (target: EditTarget) => setEditTarget(target);
  const closeEdit = () => setEditTarget(null);

  const saveEdit = async (novaQuantidade: number, _observacao?: string) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await simulateApiDelay(350);
      const key = `${editTarget.produto.codigo}::${editTarget.cor.nome}::${editTarget.tamanho}`;
      setLocalOverrides(prev => ({ ...prev, [key]: novaQuantidade }));
      showSuccess(
        `${editTarget.produto.codigo} · ${editTarget.cor.nome} tam ${editTarget.tamanho}: ${editTarget.quantidadeAtual} → ${novaQuantidade}`
      );
      closeEdit();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    allSizes,
    loading,
    error,
    query,
    setQuery,
    categoria,
    setCategoria,
    apenasEsgotados,
    setApenasEsgotados,
    categorias,
    editTarget,
    openEdit,
    closeEdit,
    saveEdit,
    saving,
  };
}

function extractOverrides(
  codigo: string,
  corNome: string,
  overrides: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  const prefix = `${codigo}::${corNome}::`;
  Object.entries(overrides).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      const tamanho = key.slice(prefix.length);
      result[tamanho] = value;
    }
  });
  return result;
}
