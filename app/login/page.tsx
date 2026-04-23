import { Suspense } from 'react';
import LoginScreen from '@/src/screens/LoginScreen';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
