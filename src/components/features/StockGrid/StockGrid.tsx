'use client';

import type { Produto } from '@/src/types/produto';
import { STRINGS } from '@/src/constants/strings';
import {
  collectAllSizes,
  filterCoresWithStock,
  getTotalEmEstoque,
  mapTamanhoCells,
} from '@/src/utils/mappers/produtoMappers';
import styles from './StockGrid.module.css';

interface StockGridProps {
  produto: Produto;
}

const SIZE_DISPLAY_LABELS: Record<string, string> = {
  U: STRINGS.product.qtdHeader,
  UN: STRINGS.product.qtdHeader,
  UNICO: STRINGS.product.qtdHeader,
  'ÚNICO': STRINGS.product.qtdHeader,
};

export default function StockGrid({ produto }: StockGridProps) {
  const allSizes = collectAllSizes(produto, true);
  const cores = filterCoresWithStock(produto);

  if (!cores.length || !allSizes.length) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>{STRINGS.product.semEstoque}</p>
      </div>
    );
  }

  const hasOnlyQtd = allSizes.length === 1 && Boolean(SIZE_DISPLAY_LABELS[allSizes[0]]);
  const cornerText = hasOnlyQtd ? STRINGS.product.corHeader : STRINGS.product.corTamHeader;

  const total = getTotalEmEstoque(produto);

  return (
    <div className={styles.wrapper}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th className={styles.cornerHeader}>{cornerText}</th>
            {allSizes.map(size => (
              <th key={size}>{SIZE_DISPLAY_LABELS[size] ?? size}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cores.map((cor, i) => {
            const cells = mapTamanhoCells(cor.tamanhos, allSizes);
            return (
              <tr key={`${cor.nome}-${i}`}>
                <th className={styles.corLabel}>{cor.nome}</th>
                {cells.map(cell => (
                  <td
                    key={cell.tamanho}
                    className={`${styles.cell} ${styles[cell.status]}`}
                  >
                    {cell.status === 'esgotado' ? '—' : cell.quantidade}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {total > 0 && (
        <p className={styles.total}>
          <strong>{total}</strong> {STRINGS.product.totalPares(total, cores.length).split('·')[0].trim().split(' ').slice(1).join(' ')} · {cores.length} {cores.length === 1 ? 'cor' : 'cores'}
        </p>
      )}
    </div>
  );
}
