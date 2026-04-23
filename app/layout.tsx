import type { Metadata, Viewport } from 'next';
import { STRINGS } from '@/src/constants/strings';
import '@/src/styles/globals.css';

export const metadata: Metadata = {
  title: `${STRINGS.app.name} — ${STRINGS.app.tagline}`,
  description: 'Consulta de preços e estoque — Sonho dos Pés',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: STRINGS.app.name,
  },
};

export const viewport: Viewport = {
  themeColor: '#C8B091',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
