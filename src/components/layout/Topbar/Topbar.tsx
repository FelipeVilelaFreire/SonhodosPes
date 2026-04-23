'use client';

import { Menu, Bell } from 'lucide-react';
import Avatar from '@/src/components/ui/Avatar';
import { useAuth } from '@/src/contexts/AuthContext';
import styles from './Topbar.module.css';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  notificationCount?: number;
}

export default function Topbar({ title, onMenuClick, notificationCount = 0 }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} aria-label="Notificações">
          <Bell size={20} strokeWidth={1.5} />
          {notificationCount > 0 && (
            <span className={styles.notifBadge}>{notificationCount}</span>
          )}
        </button>

        {user && <Avatar name={user.nome} size="sm" />}
      </div>
    </header>
  );
}
