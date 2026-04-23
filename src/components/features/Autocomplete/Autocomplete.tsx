'use client';

import type { Produto } from '@/src/types/produto';
import { mapProdutoAutocompleteItem } from '@/src/utils/mappers/produtoMappers';
import { STRINGS } from '@/src/constants/strings';
import styles from './Autocomplete.module.css';

interface AutocompleteProps {
  results: Produto[];
  onSelect: (produto: Produto) => void;
  query: string;
}

export default function Autocomplete({ results, onSelect, query }: AutocompleteProps) {
  if (!query.trim()) return null;

  if (results.length === 0) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>
          {STRINGS.search.notFound(query)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {results.map(produto => {
        const item = mapProdutoAutocompleteItem(produto);
        return (
          <button
            key={produto.codigo}
            type="button"
            className={`${styles.item} ${item.esgotado ? styles.esgotado : ''}`}
            onClick={() => onSelect(produto)}
          >
            <div className={styles.left}>
              <span className={styles.codigo}>{item.codigo}</span>
              <span className={styles.modelo}>{item.modelo}</span>
              {item.resumoCategoria && (
                <span className={styles.resumo}>{item.resumoCategoria}</span>
              )}
            </div>
            <div className={styles.right}>
              {item.esgotado ? (
                <span className={styles.esgotadoTag}>
                  {STRINGS.product.esgotado}
                </span>
              ) : (
                <span className={styles.preco}>{item.precoFormatted}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
