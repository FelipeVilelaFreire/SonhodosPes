'use client';

import { ICONS } from '@/src/constants/icons';
import { STRINGS } from '@/src/constants/strings';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, onClear, placeholder }: SearchBarProps) {
  const SearchIcon = ICONS.search;
  const CloseIcon = ICONS.close;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <label htmlFor="consultaInput" className={styles.label}>
          {STRINGS.search.label}
        </label>
      </div>

      <div className={styles.wrapper}>
        <SearchIcon size={20} strokeWidth={2} className={styles.searchIcon} />
        <input
          id="consultaInput"
          type="text"
          className={styles.input}
          placeholder={placeholder ?? STRINGS.search.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {value && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={onClear}
            aria-label={STRINGS.actions.clear}
          >
            <CloseIcon size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </section>
  );
}
