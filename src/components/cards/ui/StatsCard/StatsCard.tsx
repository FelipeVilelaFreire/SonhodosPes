import type { ReactNode } from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  icon?: ReactNode;
  variant?: 'default' | 'highlight' | 'danger';
}

export default function StatsCard({
  label,
  value,
  unit,
  caption,
  icon,
  variant = 'default',
}: StatsCardProps) {
  return (
    <div
      className={`${styles.card} ${
        variant === 'highlight' ? styles.highlight : variant === 'danger' ? styles.danger : ''
      }`}
    >
      {icon && <div className={styles.iconBox}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
        {caption && <div className={styles.caption}>{caption}</div>}
      </div>
    </div>
  );
}
