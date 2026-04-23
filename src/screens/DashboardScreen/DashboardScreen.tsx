'use client';

import DashboardView from '@/src/components/features/DashboardView';
import Spinner from '@/src/components/ui/Spinner';
import { useDashboardScreen } from '@/src/hooks/dashboard/useDashboardScreen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { stats, recentLogs, loading, error } = useDashboardScreen();

  if (!user) return null;

  if (loading) {
    return <Spinner size="lg" center />;
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-danger)' }}>
        Erro ao carregar dashboard: {error}
      </div>
    );
  }

  return <DashboardView user={user} stats={stats} recentLogs={recentLogs} />;
}
