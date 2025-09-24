'use client';

import { RouteGuard } from '@/components/rbac/RouteGuard';
import BackofficeHeader from '@/components/backoffice/BackofficeHeader';
import BackofficeFloatingNav from '@/components/backoffice/BackofficeFloatingNav';
import BackofficeFooter from '@/components/backoffice/BackofficeFooter';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <BackofficeHeader />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <BackofficeFooter />

        {/* Floating Navigation */}
        <BackofficeFloatingNav />
      </div>
    </RouteGuard>
  );
}