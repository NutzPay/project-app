'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'FAILED';
  lastTriggeredAt?: string;
  createdAt: string;
  maxRetries: number;
  retryCount: number;
}

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    url: 'https://api.myapp.com/webhooks/payments',
    events: ['payment.created', 'payment.completed', 'payment.failed'],
    status: 'ACTIVE',
    lastTriggeredAt: '2025-08-21T08:30:00Z',
    createdAt: '2025-07-15T14:20:00Z',
    maxRetries: 3,
    retryCount: 0,
  },
  {
    id: '2',
    url: 'https://webhook.site/unique-id',
    events: ['payment.completed'],
    status: 'ACTIVE',
    lastTriggeredAt: '2025-08-20T15:45:00Z',
    createdAt: '2025-07-20T09:10:00Z',
    maxRetries: 5,
    retryCount: 2,
  },
  {
    id: '3',
    url: 'https://old-endpoint.com/webhook',
    events: ['payment.created'],
    status: 'FAILED',
    lastTriggeredAt: '2025-08-18T12:15:00Z',
    createdAt: '2025-06-10T16:45:00Z',
    maxRetries: 3,
    retryCount: 3,
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadWebhooks = async () => {
      try {
        const response = await fetch('/api/webhooks');
        const result = await response.json();
        
        if (result.success) {
          setWebhooks(result.webhooks);
        }
      } catch (error) {
        console.error('Erro ao carregar webhooks:', error);
        // Se der erro, usar dados mockados como fallback temporário
        setWebhooks(mockWebhooks);
      } finally {
        setIsLoading(false);
      }
    };

    loadWebhooks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-black">Webhooks</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configure webhooks para receber notificações em tempo real sobre eventos em sua conta.
              Monitore entregas, falhas e configure retry automático.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Webhook
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}>
                  {webhook.status}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold text-black truncate" title={webhook.url}>
                  {webhook.url}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {webhook.events.length} evento{webhook.events.length !== 1 ? 's' : ''} configurado{webhook.events.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {webhook.events.slice(0, 3).map((event, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {event}
                    </span>
                  ))}
                  {webhook.events.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      +{webhook.events.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  Criado em {formatDate(webhook.createdAt)}
                </div>
                {webhook.lastTriggeredAt && (
                  <div>
                    Último disparo: {formatDate(webhook.lastTriggeredAt)}
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tentativas: {webhook.retryCount}/{webhook.maxRetries}</span>
                  {webhook.retryCount > 0 && (
                    <span className="text-orange-600">
                      {webhook.retryCount} falha{webhook.retryCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button className="text-black hover:text-red-600 text-sm font-medium transition-colors">
                  Editar
                </button>
                <button className="text-gray-600 hover:text-black text-sm font-medium transition-colors">
                  Testar
                </button>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {webhooks.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-bold text-black">Nenhum webhook configurado</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando um webhook para receber notificações de eventos.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Webhook
            </button>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl border border-gray-200 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-bold text-black">
                    Criar Novo Webhook
                  </h3>
                  <div className="mt-4">
                    <form className="space-y-4">
                      <div>
                        <label htmlFor="webhook-url" className="block text-sm font-medium text-black">
                          URL do Webhook
                        </label>
                        <input
                          type="url"
                          name="webhook-url"
                          id="webhook-url"
                          placeholder="https://api.exemplo.com/webhook"
                          className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          URL que receberá as notificações dos eventos
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-black">
                          Eventos
                        </label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center">
                            <input
                              id="payment-created"
                              name="events"
                              type="checkbox"
                              className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                            <label htmlFor="payment-created" className="ml-2 block text-sm text-black">
                              payment.created - Pagamento criado
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="payment-completed"
                              name="events"
                              type="checkbox"
                              className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                            <label htmlFor="payment-completed" className="ml-2 block text-sm text-black">
                              payment.completed - Pagamento concluído
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="payment-failed"
                              name="events"
                              type="checkbox"
                              className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                            <label htmlFor="payment-failed" className="ml-2 block text-sm text-black">
                              payment.failed - Pagamento falhou
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="payment-refunded"
                              name="events"
                              type="checkbox"
                              className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                            <label htmlFor="payment-refunded" className="ml-2 block text-sm text-black">
                              payment.refunded - Pagamento estornado
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="max-retries" className="block text-sm font-medium text-black">
                          Máximo de tentativas
                        </label>
                        <select
                          id="max-retries"
                          name="max-retries"
                          className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                        >
                          <option value="3">3 tentativas</option>
                          <option value="5">5 tentativas</option>
                          <option value="10">10 tentativas</option>
                        </select>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Criar Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}