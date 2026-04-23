'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSolid';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      <span className={styles.content}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
});

export default Button;
