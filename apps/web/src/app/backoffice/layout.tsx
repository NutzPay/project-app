import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Backoffice • NutzBeta',
  description: 'Sistema de gestão administrativo interno',
  robots: 'noindex, nofollow', // Não indexar o backoffice
};

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="backoffice-root">
      <main>
        {children}
      </main>
    </div>
  );
}