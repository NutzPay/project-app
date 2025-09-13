'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import FloatingNav from '@/components/ui/FloatingNav';

interface BaseLayoutProps {
  children: ReactNode;
  // Header props
  userType?: 'operator' | 'admin' | 'user';
  showProfileMenu?: boolean;
  // Footer props
  footerVariant?: 'dark' | 'light';
  showFooterLinks?: boolean;
  compactFooter?: boolean;
  // Layout props
  showFloatingNav?: boolean;
  floatingNavType?: 'operator' | 'admin' | 'user';
  maxWidth?: string;
  className?: string;
  onWithdrawClick?: () => void;
}

export default function BaseLayout({
  children,
  userType = 'operator',
  showProfileMenu = true,
  footerVariant = 'dark',
  showFooterLinks = false,
  compactFooter = false,
  showFloatingNav = true,
  floatingNavType,
  maxWidth = 'max-w-6xl',
  className = '',
  onWithdrawClick
}: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Floating Navigation */}
      {showFloatingNav && (
        <FloatingNav 
          userType={floatingNavType || userType} 
          onWithdrawClick={onWithdrawClick}
        />
      )}
      
      {/* Header */}
      <Header 
        userType={userType} 
        showProfileMenu={showProfileMenu}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 ${maxWidth} mx-auto w-full px-6 py-8 ${className}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer 
        variant={footerVariant}
        showLinks={showFooterLinks}
        compactMode={compactFooter}
      />
    </div>
  );
}

// Variações pré-configuradas do layout

export function DashboardLayout({ 
  children, 
  userType = 'operator',
  onWithdrawClick
}: { 
  children: ReactNode; 
  userType?: 'operator' | 'admin' | 'user';
  onWithdrawClick?: () => void;
}) {
  return (
    <BaseLayout
      userType={userType}
      showProfileMenu={true}
      footerVariant="dark"
      showFooterLinks={false}
      compactFooter={false}
      showFloatingNav={true}
      maxWidth="max-w-6xl"
      onWithdrawClick={onWithdrawClick}
    >
      {children}
    </BaseLayout>
  );
}

export function PublicLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <BaseLayout
      showProfileMenu={false}
      footerVariant="light"
      showFooterLinks={true}
      compactFooter={false}
      showFloatingNav={false}
      maxWidth="max-w-7xl"
    >
      {children}
    </BaseLayout>
  );
}

export function AdminLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <BaseLayout
      userType="admin"
      showProfileMenu={true}
      footerVariant="dark"
      showFooterLinks={true}
      compactFooter={true}
      showFloatingNav={true}
      floatingNavType="admin"
      maxWidth="max-w-7xl"
    >
      {children}
    </BaseLayout>
  );
}

export function CompactLayout({ 
  children,
  userType = 'operator' 
}: { 
  children: ReactNode;
  userType?: 'operator' | 'admin' | 'user'
}) {
  return (
    <BaseLayout
      userType={userType}
      showProfileMenu={true}
      footerVariant="light"
      showFooterLinks={true}
      compactFooter={true}
      showFloatingNav={false}
      maxWidth="max-w-4xl"
    >
      {children}
    </BaseLayout>
  );
}