'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftSlot, rightSlot, invalid, disabled, size = 'md', className, ...rest },
  ref
) {
  const wrapperClasses = [
    styles.wrapper,
    styles[`size-${size}`],
    invalid && styles.invalid,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [styles.input, leftSlot && styles.withLeft].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {leftSlot && <div className={styles.leftSlot}>{leftSlot}</div>}
      <input ref={ref} disabled={disabled} className={inputClasses} {...rest} />
      {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
    </div>
  );
});

export default Input;
