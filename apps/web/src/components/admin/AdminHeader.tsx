'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Administrativo';
    if (pathname === '/admin/users') return 'Gerenciar Usuários';
    if (pathname === '/admin/investments') return 'Investimentos USDT';
    if (pathname === '/admin/transactions') return 'Transações PIX';
    if (pathname === '/admin/acquirers') return 'Adquirentes & Liquidantes';
    if (pathname === '/admin/settings') return 'Configurações';
    return 'Painel Admin';
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Nutz" 
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900">Nutz</div>
                <div className="text-xs text-gray-500 -mt-1">Admin</div>
              </div>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-medium text-gray-900">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden xl:flex items-center space-x-4 text-sm bg-gray-50 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600 text-xs">Sistema OK</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">247</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">1.2M</div>
                <div className="text-xs text-gray-500">Vol</div>
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a8.38 8.38 0 010-11.8L20 7h-5M5 17H0l3.5-3.5a8.38 8.38 0 010-11.8L0 7h5" />
              </svg>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">3</span>
              </span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
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
                    <Link 
                      href="/admin/settings" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Configurações</span>
                    </Link>
                    <Link 
                      href="/admin/audit" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Logs de Auditoria</span>
                    </Link>
                    <div className="border-t border-gray-100 my-2"></div>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      <span>Voltar ao Dashboard</span>
                    </Link>
                    <button 
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