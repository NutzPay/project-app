import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nutz - Gateway de Pagamentos',
  description: 'Plataforma de pagamentos segura com recursos avançados de API e webhooks',
  keywords: 'pagamentos, api, gateway, webhooks, stark bank, fintech',
  authors: [{ name: 'Nutz Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = 'width=device-width, initial-scale=1';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </body>
    </html>
  );
}