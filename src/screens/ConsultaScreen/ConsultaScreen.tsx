'use client';

import ConsultaView from '@/src/components/features/ConsultaView';
import { useConsultaScreen } from '@/src/hooks/produto/useConsultaScreen';
import { STRINGS } from '@/src/constants/strings';
import styles from './ConsultaScreen.module.css';

export default function ConsultaScreen() {
  const {
    isOnline,
    query,
    setQuery,
    clearQuery,
    results,
    stack,
    addToStack,
    removeFromStack,
    clearStack,
    loading,
    error,
    reload,
  } = useConsultaScreen();

  if (loading) {
    return (
      <div className={styles.loading}>
        {STRINGS.actions.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{STRINGS.errors.loadFailed}: {error}</p>
        <button type="button" className={styles.retryBtn} onClick={reload}>
          {STRINGS.actions.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <ConsultaView
      isOnline={isOnline}
      query={query}
      onQueryChange={setQuery}
      onQueryClear={clearQuery}
      results={results}
      stack={stack}
      onAddToStack={addToStack}
      onRemoveFromStack={removeFromStack}
      onClearStack={clearStack}
    />
  );
}
