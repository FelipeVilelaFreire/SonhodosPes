import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  ornament?: boolean;
  children: ReactNode;
}

export default function Card({
  hoverable,
  highlighted,
  compact,
  ornament,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    hoverable && styles.hoverable,
    highlighted && styles.highlighted,
    compact && styles.compact,
    ornament && styles.ornament,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
