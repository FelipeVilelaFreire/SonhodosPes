'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/src/components/features/LoginForm';
import { useAuth } from '@/src/contexts/AuthContext';
import Spinner from '@/src/components/ui/Spinner';

export default function LoginScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return null;

  return <LoginForm />;
}
