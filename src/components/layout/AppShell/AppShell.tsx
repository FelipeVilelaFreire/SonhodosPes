'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/src/components/layout/Sidebar';
import Topbar from '@/src/components/layout/Topbar';
import { useOnlineStatus } from '@/src/hooks/shared/useOnlineStatus';
import styles from './AppShell.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/estoque': 'Tabela',
  '/consulta': 'Consulta',
  '/catalogo': 'Catálogo',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
};

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isOnline = useOnlineStatus();

  const pageTitle = title || PAGE_TITLES[pathname ?? '/'] || 'Sonho dos Pés';

  return (
    <div className={styles.shell}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isOnline={isOnline}
      />

      <div className={styles.main}>
        <Topbar title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
