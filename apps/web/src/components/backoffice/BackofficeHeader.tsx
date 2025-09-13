'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function BackofficeHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/backoffice') return 'Dashboard Administrativo';
    if (pathname === '/backoffice/usuarios') return 'Gerenciar Usuários';
    if (pathname === '/backoffice/investimentos') return 'Investimentos USDT';
    if (pathname === '/backoffice/transacoes') return 'Transações PIX';
    if (pathname === '/backoffice/empresas') return 'Empresas';
    if (pathname === '/backoffice/auditoria') return 'Auditoria';
    return 'Painel Backoffice';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/backoffice/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/backoffice/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API fails
      router.push('/backoffice/login');
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-32">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/backoffice" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-28 h-28 object-contain"
              />
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-white">AD</span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">Admin</div>
                  <div className="text-xs text-gray-500">Super Usuário</div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="border-t border-gray-100 my-2"></div>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      <span>Voltar ao Dashboard</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}