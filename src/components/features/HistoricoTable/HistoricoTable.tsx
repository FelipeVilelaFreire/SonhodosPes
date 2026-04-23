'use client';

import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Input from '@/src/components/ui/Input';
import Button from '@/src/components/ui/Button';
import type { LogMudanca, OperacaoEstoque } from '@/src/types/estoque';
import styles from './HistoricoTable.module.css';

interface HistoricoTableProps {
  logs: LogMudanca[];
  total: number;
  query: string;
  onQueryChange: (v: string) => void;
  operacao: OperacaoEstoque | '';
  onOperacaoChange: (v: OperacaoEstoque | '') => void;
  usuarioId: string;
  onUsuarioChange: (v: string) => void;
  usuarios: Array<{ id: string; nome: string }>;
  pagina: number;
  totalPaginas: number;
  onPaginaChange: (p: number) => void;
  onExport: () => void;
}

const OPERACAO_LABEL: Record<OperacaoEstoque, string> = {
  venda: 'Venda',
  entrada: 'Entrada',
  ajuste: 'Ajuste',
  devolucao: 'Devolução',
};

function formatWhen(d: Date): { date: string; time: string } {
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function HistoricoTable({
  logs,
  total,
  query,
  onQueryChange,
  operacao,
  onOperacaoChange,
  usuarioId,
  onUsuarioChange,
  usuarios,
  pagina,
  totalPaginas,
  onPaginaChange,
  onExport,
}: HistoricoTableProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <label>
          Buscar
          <Input
            placeholder="Produto, código, usuário"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            leftSlot={<Search size={16} />}
          />
        </label>

        <label>
          Operação
          <select value={operacao} onChange={e => onOperacaoChange(e.target.value as OperacaoEstoque | '')}>
            <option value="">Todas</option>
            <option value="venda">Venda</option>
            <option value="entrada">Entrada</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolucao">Devolução</option>
          </select>
        </label>

        <label>
          Usuário
          <select value={usuarioId} onChange={e => onUsuarioChange(e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </label>

        <Button variant="secondary" leftIcon={<Download size={14} />} onClick={onExport}>
          Exportar CSV
        </Button>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>Produto · Cor · Tam</th>
              <th>Operação</th>
              <th style={{ textAlign: 'center' }}>Antes</th>
              <th style={{ textAlign: 'center' }}>Depois</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const when = formatWhen(log.createdAt);
                return (
                  <tr key={log.id}>
                    <td className={styles.whenCell}>
                      <div className={styles.whenDate}>{when.date}</div>
                      <div>{when.time}</div>
                    </td>
                    <td className={styles.userCell}>{log.usuarioNome ?? '—'}</td>
                    <td className={styles.estoqueCell}>{log.estoqueId}</td>
                    <td>
                      <span className={`${styles.operacaoCell} ${styles[log.operacao]}`}>
                        {OPERACAO_LABEL[log.operacao]}
                      </span>
                    </td>
                    <td className={styles.qtdCell}>{log.qtdAnterior}</td>
                    <td className={styles.qtdCell}>{log.qtdNova}</td>
                    <td className={styles.obsCell}>{log.observacao ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {pagina} de {totalPaginas} · {total} registros
            </span>
            <div className={styles.paginationBtns}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPaginaChange(pagina - 1)}
                disabled={pagina === 1}
                leftIcon={<ChevronLeft size={14} />}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPaginaChange(pagina + 1)}
                disabled={pagina >= totalPaginas}
                rightIcon={<ChevronRight size={14} />}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
