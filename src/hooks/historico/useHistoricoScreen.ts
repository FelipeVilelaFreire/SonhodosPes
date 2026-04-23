'use client';

import { useMemo, useState } from 'react';
import { MOCK_HISTORICO } from '@/src/mocks/historico';
import { MOCK_USERS } from '@/src/mocks/users';
import type { LogMudanca, OperacaoEstoque } from '@/src/types/estoque';

export interface UseHistoricoScreenReturn {
  logs: LogMudanca[];
  total: number;
  query: string;
  setQuery: (q: string) => void;
  operacao: OperacaoEstoque | '';
  setOperacao: (v: OperacaoEstoque | '') => void;
  usuarioId: string;
  setUsuarioId: (v: string) => void;
  usuarios: Array<{ id: string; nome: string }>;
  pagina: number;
  setPagina: (p: number) => void;
  totalPaginas: number;
  porPagina: number;
  loading: boolean;
  error: string | null;
  exportCsv: () => void;
}

const POR_PAGINA = 20;

export function useHistoricoScreen(): UseHistoricoScreenReturn {
  const [query, setQuery] = useState('');
  const [operacao, setOperacao] = useState<OperacaoEstoque | ''>('');
  const [usuarioId, setUsuarioId] = useState('');
  const [pagina, setPagina] = useState(1);

  const usuarios = useMemo(
    () => MOCK_USERS.map(u => ({ id: u.id, nome: u.nome })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_HISTORICO.filter(log => {
      if (operacao && log.operacao !== operacao) return false;
      if (usuarioId && log.usuarioId !== usuarioId) return false;
      if (q) {
        const haystack = `${log.estoqueId} ${log.usuarioNome ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, operacao, usuarioId]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));

  const pageItems = useMemo(() => {
    const start = (pagina - 1) * POR_PAGINA;
    return filtered.slice(start, start + POR_PAGINA);
  }, [filtered, pagina]);

  const exportCsv = () => {
    const header = 'quando,usuario,estoque_id,operacao,antes,depois,observacao\n';
    const rows = filtered
      .map(
        l =>
          `${l.createdAt.toISOString()},${l.usuarioNome ?? ''},${l.estoqueId},${l.operacao},${l.qtdAnterior},${l.qtdNova},"${l.observacao ?? ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    logs: pageItems,
    total: filtered.length,
    query,
    setQuery: (q: string) => {
      setQuery(q);
      setPagina(1);
    },
    operacao,
    setOperacao: (v: OperacaoEstoque | '') => {
      setOperacao(v);
      setPagina(1);
    },
    usuarioId,
    setUsuarioId: (v: string) => {
      setUsuarioId(v);
      setPagina(1);
    },
    usuarios,
    pagina,
    setPagina,
    totalPaginas,
    porPagina: POR_PAGINA,
    loading: false,
    error: null,
    exportCsv,
  };
}
