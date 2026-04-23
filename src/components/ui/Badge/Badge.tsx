import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'dark';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
  children: ReactNode;
}

export default function Badge({
  variant = 'default',
  withDot,
  className,
  children,
  ...rest
}: BadgeProps) {
  const classes = [styles.badge, styles[`variant-${variant}`], className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {withDot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}
