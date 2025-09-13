'use client';

import { useState, useEffect } from 'react';

interface TimelineEvent {
  id: string;
  type: 'pix_received' | 'usdt_credited' | 'payout_requested' | 'payout_sent' | 'investment_applied' | 'limit_request';
  title: string;
  description: string;
  amount?: number;
  currency?: 'BRL' | 'USDT';
  status: 'completed' | 'processing' | 'pending' | 'failed';
  timestamp: Date;
  network?: string;
  txHash?: string;
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'usdt_credited',
    title: 'USDT Creditado',
    description: 'Conversão PIX → USDT realizada com sucesso',
    amount: 1842.33,
    currency: 'USDT',
    status: 'completed',
    timestamp: new Date('2024-08-21T10:15:00'),
  },
  {
    id: '2',
    type: 'pix_received',
    title: 'PIX Recebido',
    description: 'Pagamento PIX confirmado',
    amount: 10000.00,
    currency: 'BRL',
    status: 'completed',
    timestamp: new Date('2024-08-21T10:10:00'),
  },
  {
    id: '3',
    type: 'payout_requested',
    title: 'Payout Solicitado',
    description: 'Saque USDT para rede TRC20',
    amount: 500.00,
    currency: 'USDT',
    status: 'processing',
    timestamp: new Date('2024-08-21T09:30:00'),
    network: 'TRC20',
  },
  {
    id: '4',
    type: 'investment_applied',
    title: 'Investimento Aplicado',
    description: 'Aporte no produto 300% CDI',
    amount: 2000.00,
    currency: 'USDT',
    status: 'completed',
    timestamp: new Date('2024-08-20T16:45:00'),
  },
  {
    id: '5',
    type: 'limit_request',
    title: 'Solicitação de Limite',
    description: 'Pedido de aumento de limite negado',
    status: 'failed',
    timestamp: new Date('2024-08-20T14:20:00'),
  },
];

function getEventIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'pix_received':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'usdt_credited':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'payout_requested':
    case 'payout_sent':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      );
    case 'investment_applied':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'limit_request':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getStatusColor(status: TimelineEvent['status']) {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

function getStatusLabel(status: TimelineEvent['status']) {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'processing':
      return 'Processando';
    case 'pending':
      return 'Pendente';
    case 'failed':
      return 'Falhou';
    default:
      return 'Desconhecido';
  }
}

export default function AccountTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'pix' | 'payout' | 'investment'>('all');

  useEffect(() => {
    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'pix') return event.type === 'pix_received' || event.type === 'usdt_credited';
    if (filter === 'payout') return event.type === 'payout_requested' || event.type === 'payout_sent';
    if (filter === 'investment') return event.type === 'investment_applied';
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = (amount: number, currency: 'BRL' | 'USDT') => {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
    }
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount)} USDT`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Histórico da Conta</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtrar:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="pix">PIX/USDT</option>
              <option value="payout">Payouts</option>
              <option value="investment">Investimentos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h4>
            <p className="text-gray-500">Suas transações e atividades aparecerão aqui.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredEvents.map((event, index) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {index !== filteredEvents.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1 ${getStatusColor(event.status)} rounded-full flex items-center justify-center h-10 w-10`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {getStatusLabel(event.status)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDate(event.timestamp)}</span>
                            {event.network && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                {event.network}
                              </span>
                            )}
                          </div>
                          {event.amount && event.currency && (
                            <span className="text-sm font-medium text-gray-900">
                              {formatAmount(event.amount, event.currency)}
                            </span>
                          )}
                        </div>
                        {event.txHash && (
                          <div className="mt-2">
                            <a
                              href={`#`}
                              className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                            >
                              {event.txHash}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}