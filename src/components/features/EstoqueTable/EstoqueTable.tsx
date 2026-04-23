'use client';

import { Search } from 'lucide-react';
import Input from '@/src/components/ui/Input';
import type { EstoqueRow } from '@/src/hooks/estoque/useEstoqueScreen';
import { getStockStatus } from '@/src/utils/mappers/produtoMappers';
import styles from './EstoqueTable.module.css';

interface EstoqueTableProps {
  rows: EstoqueRow[];
  allSizes: string[];
  query: string;
  onQueryChange: (v: string) => void;
  categoria: string;
  onCategoriaChange: (v: string) => void;
  categorias: string[];
  apenasEsgotados: boolean;
  onApenasEsgotadosChange: (v: boolean) => void;
  onEditCell: (row: EstoqueRow, tamanho: string, quantidadeAtual: number) => void;
}

const SIZE_LABEL: Record<string, string> = {
  U: 'QTD',
  UN: 'QTD',
};

export default function EstoqueTable({
  rows,
  allSizes,
  query,
  onQueryChange,
  categoria,
  onCategoriaChange,
  categorias,
  apenasEsgotados,
  onApenasEsgotadosChange,
  onEditCell,
}: EstoqueTableProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <label>
            Buscar
            <Input
              placeholder="Código, nome ou marca"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              leftSlot={<Search size={16} />}
            />
          </label>
          <label>
            Categoria
            <select value={categoria} onChange={e => onCategoriaChange(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={styles.checkboxWrap}>
            <input
              type="checkbox"
              checked={apenasEsgotados}
              onChange={e => onApenasEsgotadosChange(e.target.checked)}
            />
            <span>Apenas esgotados</span>
          </label>
        </div>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Cor</th>
              {allSizes.map(s => (
                <th key={s} className={styles.centered}>
                  {SIZE_LABEL[s] ?? s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3 + allSizes.length} className={styles.emptyState}>
                  Nenhum resultado para os filtros aplicados.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.rowKey}>
                  <td className={styles.codigoCol}>{row.produto.codigo}</td>
                  <td className={styles.modeloCol}>
                    {row.produto.modelo}
                    {row.produto.categoria && <small>{row.produto.categoria}</small>}
                  </td>
                  <td className={styles.corCol}>{row.cor.nome}</td>
                  {allSizes.map(tamanho => {
                    const qty = row.cor.tamanhos[tamanho];
                    const hasSize = tamanho in row.cor.tamanhos;
                    if (!hasSize) {
                      return (
                        <td key={tamanho} className={styles.qtdCell}>
                          <span className={`${styles.qtdBtn} ${styles.indisponivel}`}>·</span>
                        </td>
                      );
                    }
                    const status = getStockStatus(qty);
                    const cls = [
                      styles.qtdBtn,
                      status === 'baixo' && styles.baixo,
                      status === 'esgotado' && styles.esgotado,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <td key={tamanho} className={styles.qtdCell}>
                        <button
                          type="button"
                          className={cls}
                          onClick={() => onEditCell(row, tamanho, qty || 0)}
                          aria-label={`Editar tamanho ${tamanho} da cor ${row.cor.nome}`}
                        >
                          {status === 'esgotado' ? '—' : qty}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className={styles.counter}>
          {rows.length === 0
            ? 'Nenhuma linha'
            : `Exibindo ${rows.length} ${rows.length === 1 ? 'linha' : 'linhas'}`}
        </div>
      </div>
    </div>
  );
}
