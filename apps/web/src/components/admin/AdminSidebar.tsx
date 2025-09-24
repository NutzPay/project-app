'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { classNames } from '@/lib/utils';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    description: 'Visão geral do sistema'
  },
  { 
    name: 'Usuários', 
    href: '/admin/users', 
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
    description: 'Sellers e aprovações'
  },
  { 
    name: 'Empresas', 
    href: '/admin/companies', 
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    description: 'Controle de empresas'
  },
  { 
    name: 'Transações', 
    href: '/admin/transactions', 
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    description: 'Monitoramento PIX'
  },
  { 
    name: 'Investimentos', 
    href: '/admin/investments', 
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    description: 'Gestão investimentos USDT'
  },
  { 
    name: 'Chaves API', 
    href: '/admin/api-keys', 
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    description: 'Gerenciamento de APIs'
  },
  { 
    name: 'Webhooks', 
    href: '/admin/webhooks', 
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    description: 'Sistema de notificações'
  },
  { 
    name: 'Auditoria', 
    href: '/admin/audit', 
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    description: 'Logs de atividades'
  },
  { 
    name: 'Adquirentes', 
    href: '/admin/acquirers', 
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    description: 'APIs PIX e USDT'
  },
  { 
    name: 'Starkbank', 
    href: '/admin/starkbank', 
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Integração bancária'
  },
  { 
    name: 'Destaques', 
    href: '/admin/offers', 
    icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 010-2h3zM9 3v1h6V3H9zm0 3v8h6V6H9z',
    description: 'Banners promocionais'
  },
  { 
    name: 'Configurações', 
    href: '/admin/settings', 
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    description: 'Parâmetros do sistema'
  },
];

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white border-r border-gray-200">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fechar sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdminSidebarContent pathname={pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-1 flex-col min-h-0 bg-white border-r border-gray-200">
          <AdminSidebarContent pathname={pathname} />
        </div>
      </div>
    </>
  );
}

function AdminSidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Logo and Brand */}
      <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center group">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div className="ml-3">
            <div className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
              Nutz
            </div>
            <div className="text-xs text-gray-600 font-medium">
              PAINEL ADMINISTRATIVO
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-4">
          Gestão Bancária
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                isActive
                  ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200'
              )}
            >
              <div className={classNames(
                isActive ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-gray-200',
                'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mr-3 transition-colors'
              )}>
                <svg
                  className={classNames(
                    isActive ? 'text-red-600' : 'text-gray-600 group-hover:text-gray-700',
                    'w-5 h-5 transition-colors'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className={classNames(
                  isActive ? 'text-red-700' : 'text-gray-900',
                  'text-sm font-semibold'
                )}>
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <Link 
          href="/dashboard" 
          className="group flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
        >
          <div className="flex-shrink-0 w-9 h-9 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900">
              Dashboard
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Voltar ao painel principal
            </div>
          </div>
        </Link>

        {/* System Status */}
        <div className="mt-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="ml-2 text-xs font-medium text-green-700">Sistema Operacional</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Todos os serviços funcionando normalmente
          </div>
        </div>
      </div>
    </div>
  );
}