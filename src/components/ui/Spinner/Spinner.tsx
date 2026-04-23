import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  center?: boolean;
}

export default function Spinner({ size = 'md', center }: SpinnerProps) {
  const spinner = <span className={`${styles.spinner} ${styles[`size-${size}`]}`} />;
  if (center) return <div className={styles.center}>{spinner}</div>;
  return spinner;
}
