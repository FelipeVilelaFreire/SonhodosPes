'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import type { UserRole } from '@/src/types/auth';
import Spinner from '@/src/components/ui/Spinner';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirectTo = encodeURIComponent(pathname ?? '/');
      router.replace(`/login?redirectTo=${redirectTo}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-soft)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>
          Acesso negado
        </h2>
        <p>Você não tem permissão para ver esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}
