import AppShell from '@/src/components/layout/AppShell';
import AuthGuard from '@/src/components/layout/AuthGuard';
import HistoricoScreen from '@/src/screens/HistoricoScreen';

export default function HistoricoPage() {
  return (
    <AuthGuard allowedRoles={['admin', 'gerente']}>
      <AppShell title="Histórico">
        <HistoricoScreen />
      </AppShell>
    </AuthGuard>
  );
}
