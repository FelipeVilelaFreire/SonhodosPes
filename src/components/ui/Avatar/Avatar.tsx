import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
  return (
    <div className={`${styles.avatar} ${styles[`size-${size}`]}`} aria-label={name}>
      {src ? <img src={src} alt={name} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}
