'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Package,
  History,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import Avatar from '@/src/components/ui/Avatar';
import { useAuth } from '@/src/contexts/AuthContext';
import type { UserRole } from '@/src/types/auth';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'gerente'] },
  { label: 'Consulta', href: '/consulta', icon: Search, roles: ['admin', 'gerente', 'vendedora'] },
  { label: 'Estoque', href: '/estoque', icon: Package, roles: ['admin', 'gerente'] },
  { label: 'Histórico', href: '/historico', icon: History, roles: ['admin', 'gerente'] },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, roles: ['admin', 'gerente', 'vendedora'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export default function Sidebar({ open, onClose, isOnline }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, mockMode } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden
      />
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.svg" alt="Sonho dos Pés" width={260} height={46} className={styles.logoImg} priority />
          </Link>
          <p className={styles.tagline}>Gestão de Estoque</p>
        </div>

        {user && (
          <div className={styles.userBox}>
            <Avatar name={user.nome} size="md" />
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.nome}</div>
              <div className={styles.userMeta}>
                {user.role}{user.loja ? ` · ${user.loja}` : ''}
              </div>
            </div>
          </div>
        )}

        <nav className={styles.nav}>
          <div className={styles.navSection}>Menu</div>
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={onClose}
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          {mockMode && <span className={styles.demoTag}>MODO DEMO</span>}

          <div className={styles.statusLine}>
            <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} />
            <span>Sair</span>
          </button>

          <span className={styles.version}>v0.2.0 · Next.js</span>
        </div>
      </aside>
    </>
  );
}
