'use client';

import type { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export default function FormField({ label, htmlFor, required, hint, error, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}
