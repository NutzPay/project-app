'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await fetch('/api/audit/logs');
        const result = await response.json();
        
        if (result.success) {
          setAuditLogs(result.logs);
        }
      } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
        setAuditLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuditLogs();
  }, []);
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const mockAuditLogs = auditLogs.length > 0 ? auditLogs : [
    {
      id: '1',
      action: 'API_KEY_GENERATE',
      resource: 'api_key',
      resourceId: 'key_123',
      userId: 'user_456',
      userName: 'João Silva',
      details: {
        keyName: 'Production API Key',
        scopes: ['payments:read', 'payments:write'],
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2025-08-21T10:30:00Z',
    },
    {
      id: '2',
      action: 'WEBHOOK_CREATE',
      resource: 'webhook',
      resourceId: 'webhook_789',
      userId: 'user_456',
      userName: 'João Silva',
      details: {
        url: 'https://api.exemplo.com/webhook',
        events: ['payment.completed'],
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2025-08-21T09:15:00Z',
    },
    {
      id: '3',
      action: 'LOGIN',
      resource: 'user',
      resourceId: 'user_456',
      userId: 'user_456',
      userName: 'João Silva',
      details: {
        method: 'email_password',
        success: true,
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: '2025-08-21T08:45:00Z',
    },
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-100 text-blue-800';
      case 'API_KEY_GENERATE':
      case 'WEBHOOK_CREATE':
        return 'bg-green-100 text-green-800';
      case 'API_KEY_REVOKE':
      case 'WEBHOOK_DELETE':
        return 'bg-red-100 text-red-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'API_KEY_GENERATE':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'WEBHOOK_CREATE':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      LOGIN: 'Login realizado',
      LOGOUT: 'Logout realizado',
      API_KEY_GENERATE: 'Chave API criada',
      API_KEY_REVOKE: 'Chave API revogada',
      API_KEY_ROTATE: 'Chave API rotacionada',
      WEBHOOK_CREATE: 'Webhook criado',
      WEBHOOK_UPDATE: 'Webhook atualizado',
      WEBHOOK_DELETE: 'Webhook excluído',
      UPDATE: 'Atualização realizada',
      CREATE: 'Criação realizada',
      DELETE: 'Exclusão realizada',
    };
    return actionMap[action] || action;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Logs de Auditoria</h1>
        <p className="mt-1 text-sm text-gray-600">
          Acompanhe todas as ações realizadas na sua conta para manter a segurança e compliance.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="action-filter" className="block text-sm font-medium text-black">
              Ação
            </label>
            <select
              id="action-filter"
              name="action-filter"
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
            >
              <option value="">Todas as ações</option>
              <option value="LOGIN">Login</option>
              <option value="API_KEY_GENERATE">Criação de Chave API</option>
              <option value="WEBHOOK_CREATE">Criação de Webhook</option>
              <option value="UPDATE">Atualizações</option>
            </select>
          </div>

          <div>
            <label htmlFor="user-filter" className="block text-sm font-medium text-black">
              Usuário
            </label>
            <select
              id="user-filter"
              name="user-filter"
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
            >
              <option value="">Todos os usuários</option>
              <option value="user_456">João Silva</option>
              <option value="user_123">Maria Santos</option>
            </select>
          </div>

          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-black">
              Data Inicial
            </label>
            <input
              type="date"
              id="date-from"
              name="date-from"
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-black">
              Data Final
            </label>
            <input
              type="date"
              id="date-to"
              name="date-to"
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-2xl">
        <ul className="divide-y divide-gray-200">
          {mockAuditLogs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-black">
                          {formatAction(log.action)}
                        </p>
                        <p className="text-sm text-gray-500">
                          por {log.userName} • {formatDate(log.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-red-600 hover:text-red-700 transition-colors">
                            Ver detalhes
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <span>IP: {log.ipAddress}</span>
                      <span>•</span>
                      <span>Resource: {log.resource}#{log.resourceId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 transition-colors">
              Anterior
            </a>
            <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Próxima
            </a>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">10</span> de{' '}
                <span className="font-medium">97</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                  1
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                  2
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                  3
                </a>
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <span className="sr-only">Próxima</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}