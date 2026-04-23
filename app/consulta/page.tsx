import AppShell from '@/src/components/layout/AppShell';
import AuthGuard from '@/src/components/layout/AuthGuard';
import ConsultaScreen from '@/src/screens/ConsultaScreen';

export default function ConsultaPage() {
  return (
    <AuthGuard>
      <AppShell title="Consulta">
        <ConsultaScreen />
      </AppShell>
    </AuthGuard>
  );
}
