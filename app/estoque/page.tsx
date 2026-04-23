import AppShell from '@/src/components/layout/AppShell';
import AuthGuard from '@/src/components/layout/AuthGuard';
import EstoqueScreen from '@/src/screens/EstoqueScreen';

export default function EstoquePage() {
  return (
    <AuthGuard allowedRoles={['admin', 'gerente']}>
      <AppShell title="Controle de Estoque">
        <EstoqueScreen />
      </AppShell>
    </AuthGuard>
  );
}
