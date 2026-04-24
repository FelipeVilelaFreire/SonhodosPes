'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Produto } from '@/src/types/produto';
import type { Cor } from '@/src/types/cor';
import { useProdutoList } from '@/src/hooks/produto/useProdutoList';
import { useToast } from '@/src/contexts/ToastContext';
import { normalizeText } from '@/src/utils/normalize';
import { collectAllSizes } from '@/src/utils/mappers/produtoMappers';
import { cacheService } from '@/src/services/cacheService';

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
  updateField: (codigo: string, corNome: string, field: string, value: string | number) => void;
  addRow: (codigo: string, corNome: string) => void;
  deleteRow: (codigo: string, corNome: string) => void;
  deleteColumn: (tamanho: string) => void;
}

function rebuildSearchIndex(p: Produto): string {
  return normalizeText(
    [p.codigo, p.modelo, p.categoria, p.grupo, p.referencia, p.cores.map(c => c.nome).join(' ')]
      .filter(Boolean)
      .join(' ')
  );
}

export function useEstoqueScreen(): UseEstoqueScreenReturn {
  const { produtos: loadedProdutos, loading, error } = useProdutoList();
  const { showSuccess, showError } = useToast();

  const [localProdutos, setLocalProdutos] = useState<Produto[]>([]);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  const [apenasEsgotados, setApenasEsgotados] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loadedProdutos.length > 0) setLocalProdutos(loadedProdutos);
  }, [loadedProdutos]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    localProdutos.forEach(p => { if (p.categoria) set.add(p.categoria); });
    return Array.from(set).sort();
  }, [localProdutos]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    localProdutos.forEach(p => collectAllSizes(p, false).forEach(s => set.add(s)));
    return Array.from(set).sort((a, b) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b);
    });
  }, [localProdutos]);

  const rows: EstoqueRow[] = useMemo(() => {
    const q = normalizeText(query);
    const list: EstoqueRow[] = [];
    localProdutos.forEach(p => {
      if (categoria && p.categoria !== categoria) return;
      if (q && !p.searchIndex.includes(q)) return;
      p.cores.forEach((cor, i) => {
        const total = Object.values(cor.tamanhos).reduce((a, b) => a + (b || 0), 0);
        if (apenasEsgotados && total > 0) return;
        list.push({ produto: p, cor, rowKey: `${p.codigo}-${cor.nome}-${i}` });
      });
    });
    return list;
  }, [localProdutos, query, categoria, apenasEsgotados]);

  const updateField = useCallback((codigo: string, corNome: string, field: string, value: string | number) => {
    setLocalProdutos(prev => {
      const next = prev.map(p => {
        if (p.codigo !== codigo) return p;

        // Cor name
        if (field === 'corNome') {
          const updated = {
            ...p,
            cores: p.cores.map(c => c.nome === corNome ? { ...c, nome: value as string } : c),
          };
          updated.searchIndex = rebuildSearchIndex(updated);
          return updated;
        }

        // Size / quantity field
        if (p.cores.some(c => c.nome === corNome) &&
            (field === 'U' || field === 'UN' || /^\d{2,3}$/.test(field))) {
          return {
            ...p,
            cores: p.cores.map(c =>
              c.nome === corNome
                ? { ...c, tamanhos: { ...c.tamanhos, [field]: value as number } }
                : c
            ),
          };
        }

        // Produto-level field
        const updated = { ...p, [field]: value };
        updated.searchIndex = rebuildSearchIndex(updated);
        return updated;
      });
      cacheService.set(next);
      return next;
    });
  }, []);

  const addRow = useCallback((codigo: string, corNome: string) => {
    setLocalProdutos(prev => {
      const existing = prev.find(p => p.codigo === codigo);
      if (existing) {
        if (existing.cores.some(c => c.nome === corNome)) return prev;
        const updated = prev.map(p =>
          p.codigo === codigo
            ? { ...p, cores: [{ nome: corNome, tamanhos: {} }, ...p.cores] }
            : p
        );
        cacheService.set(updated);
        return updated;
      }
      const novo: Produto = {
        codigo,
        modelo: '',
        categoria: '',
        grupo: '',
        referencia: '',
        preco: 0,
        cores: [{ nome: corNome || 'ÚNICA', tamanhos: {} }],
        searchIndex: normalizeText(codigo),
      };
      const updated = [novo, ...prev];
      cacheService.set(updated);
      return updated;
    });
  }, []);

  const deleteRow = useCallback((codigo: string, corNome: string) => {
    setLocalProdutos(prev => {
      const updated = prev
        .map(p => p.codigo !== codigo ? p : { ...p, cores: p.cores.filter(c => c.nome !== corNome) })
        .filter(p => p.cores.length > 0);
      cacheService.set(updated);
      return updated;
    });
  }, []);

  const deleteColumn = useCallback((tamanho: string) => {
    setLocalProdutos(prev => {
      const updated = prev.map(p => ({
        ...p,
        cores: p.cores.map(c => {
          const { [tamanho]: _removed, ...rest } = c.tamanhos;
          return { ...c, tamanhos: rest };
        }),
      }));
      cacheService.set(updated);
      return updated;
    });
  }, []);

  const openEdit = (target: EditTarget) => setEditTarget(target);
  const closeEdit = () => setEditTarget(null);

  const saveEdit = async (novaQuantidade: number, _observacao?: string) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      updateField(editTarget.produto.codigo, editTarget.cor.nome, editTarget.tamanho, novaQuantidade);
      showSuccess(
        `${editTarget.produto.codigo} · ${editTarget.cor.nome} tam ${editTarget.tamanho}: ${editTarget.quantidadeAtual} → ${novaQuantidade}`
      );
      closeEdit();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return {
    rows, allSizes, loading, error,
    query, setQuery,
    categoria, setCategoria,
    apenasEsgotados, setApenasEsgotados,
    categorias,
    editTarget, openEdit, closeEdit, saveEdit, saving,
    updateField, addRow, deleteRow, deleteColumn,
  };
}
