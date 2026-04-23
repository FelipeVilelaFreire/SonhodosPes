'use client';

import type { Produto } from '@/src/types/produto';
import StockGrid from '@/src/components/features/StockGrid';
import { ICONS } from '@/src/constants/icons';
import { STRINGS } from '@/src/constants/strings';
import { formatCurrency } from '@/src/utils/formatters/currency';
import { isProdutoEsgotado } from '@/src/utils/mappers/produtoMappers';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  produto: Produto;
  onClose: (codigo: string) => void;
}

export default function ProductCard({ produto, onClose }: ProductCardProps) {
  const CloseIcon = ICONS.close;
  const esgotado = isProdutoEsgotado(produto);

  return (
    <article
      className={`${styles.card} ${esgotado ? styles.esgotado : ''}`}
      data-codigo={produto.codigo}
    >
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => onClose(produto.codigo)}
        aria-label={STRINGS.actions.close}
      >
        <CloseIcon size={18} strokeWidth={2} />
      </button>

      {esgotado && <div className={styles.esgotadoBadge}>{STRINGS.product.esgotado}</div>}

      <div className={styles.header}>
        <span className={styles.codigo}>{produto.codigo}</span>
        <span className={styles.categoria}>
          {produto.categoria || produto.grupo || ''}
        </span>
      </div>

      <h2 className={styles.modelo}>{produto.modelo || 'Sem descrição'}</h2>

      <div className={styles.divider} />

      <StockGrid produto={produto} />

      <div className={styles.priceBlock}>
        <span className={styles.priceLabel}>{STRINGS.product.priceLabel}</span>
        <span className={styles.priceValue}>{formatCurrency(produto.preco)}</span>
      </div>
    </article>
  );
}
