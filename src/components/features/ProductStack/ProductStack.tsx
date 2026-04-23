'use client';

import type { Produto } from '@/src/types/produto';
import ProductCard from '@/src/components/cards/entity/ProductCard';
import { ICONS } from '@/src/constants/icons';
import { STRINGS } from '@/src/constants/strings';
import styles from './ProductStack.module.css';

interface ProductStackProps {
  stack: Produto[];
  onRemove: (codigo: string) => void;
  onClearAll: () => void;
}

export default function ProductStack({ stack, onRemove, onClearAll }: ProductStackProps) {
  const BagIcon = ICONS.bag;

  if (stack.length === 0) {
    return (
      <section className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden>
          <BagIcon size={72} strokeWidth={1} />
        </div>
        <h3 className={styles.emptyTitle}>{STRINGS.stack.empty.title}</h3>
        <p className={styles.emptyDescription}>{STRINGS.stack.empty.description}</p>
      </section>
    );
  }

  return (
    <>
      <div className={styles.stackHeader}>
        <span className={styles.count}>{STRINGS.stack.count(stack.length)}</span>
        <button type="button" className={styles.clearAll} onClick={onClearAll}>
          {STRINGS.actions.clearAll}
        </button>
      </div>

      <section className={styles.stack}>
        {stack.map(produto => (
          <ProductCard
            key={produto.codigo}
            produto={produto}
            onClose={onRemove}
          />
        ))}
      </section>
    </>
  );
}
