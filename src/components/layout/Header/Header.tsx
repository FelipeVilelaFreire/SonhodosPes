'use client';

import Image from 'next/image';
import { ICONS } from '@/src/constants/icons';
import { STRINGS } from '@/src/constants/strings';
import styles from './Header.module.css';

interface HeaderProps {
  isOnline: boolean;
  onSettingsClick?: () => void;
}

export default function Header({ isOnline, onSettingsClick }: HeaderProps) {
  const SettingsIcon = ICONS.settings;

  return (
    <header className={styles.header}>
      <div className={styles.statusBar}>
        <span
          className={`${styles.statusIndicator} ${
            isOnline ? styles.online : styles.offline
          }`}
        >
          <span className={styles.statusDot} />
          <span>{isOnline ? STRINGS.status.online : STRINGS.status.offline}</span>
        </span>

        <button
          type="button"
          className={styles.settingsBtn}
          onClick={onSettingsClick}
          aria-label="Configurações"
        >
          <SettingsIcon size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.brand}>
        <div className={styles.logoWrapper} aria-label={STRINGS.app.name}>
          <Image
            src="/logo.svg"
            alt={STRINGS.app.name}
            width={260}
            height={46}
            className={styles.logo}
            priority
          />
        </div>
        <p className={styles.tagline}>{STRINGS.app.tagline}</p>
        <div className={styles.ornament} aria-hidden>
          <span className={styles.ornamentLine} />
          <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
            <circle cx={5} cy={5} r={2} />
          </svg>
          <span className={styles.ornamentLine} />
        </div>
      </div>
    </header>
  );
}
