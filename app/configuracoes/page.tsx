import AppShell from '@/src/components/layout/AppShell';
import AuthGuard from '@/src/components/layout/AuthGuard';
import ConfiguracoesScreen from '@/src/screens/ConfiguracoesScreen';

export default function ConfiguracoesPage() {
  return (
    <AuthGuard>
      <AppShell title="Configurações">
        <ConfiguracoesScreen />
      </AppShell>
    </AuthGuard>
  );
}
