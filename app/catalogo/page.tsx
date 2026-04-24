import AppShell from '@/src/components/layout/AppShell';
import AuthGuard from '@/src/components/layout/AuthGuard';
import CatalogoScreen from '@/src/screens/CatalogoScreen';

export default function CatalogoPage() {
  return (
    <AuthGuard allowedRoles={['admin', 'gerente']}>
      <AppShell title="Catálogo">
        <CatalogoScreen />
      </AppShell>
    </AuthGuard>
  );
}
