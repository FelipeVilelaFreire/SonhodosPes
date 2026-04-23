'use client';

import type { Produto } from '@/src/types/produto';
import Header from '@/src/components/layout/Header';
import SearchBar from '@/src/components/features/SearchBar';
import Autocomplete from '@/src/components/features/Autocomplete';
import ProductStack from '@/src/components/features/ProductStack';
import { STRINGS } from '@/src/constants/strings';
import styles from './ConsultaView.module.css';

interface ConsultaViewProps {
  isOnline: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onQueryClear: () => void;
  results: Produto[];
  stack: Produto[];
  onAddToStack: (produto: Produto) => void;
  onRemoveFromStack: (codigo: string) => void;
  onClearStack: () => void;
  onSettingsClick?: () => void;
  lastSyncText?: string;
}

export default function ConsultaView({
  isOnline,
  query,
  onQueryChange,
  onQueryClear,
  results,
  stack,
  onAddToStack,
  onRemoveFromStack,
  onClearStack,
  onSettingsClick,
  lastSyncText,
}: ConsultaViewProps) {
  return (
    <div className={styles.app}>
      <Header isOnline={isOnline} onSettingsClick={onSettingsClick} />

      <SearchBar
        value={query}
        onChange={onQueryChange}
        onClear={onQueryClear}
      />

      {query && (
        <Autocomplete
          results={results}
          onSelect={onAddToStack}
          query={query}
        />
      )}

      <main className={styles.main}>
        {!query && (
          <ProductStack
            stack={stack}
            onRemove={onRemoveFromStack}
            onClearAll={onClearStack}
          />
        )}
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          {lastSyncText ?? STRINGS.sync.never}
        </p>
      </footer>
    </div>
  );
}
