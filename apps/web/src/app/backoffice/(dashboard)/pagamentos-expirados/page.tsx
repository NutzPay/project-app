'use client';

import { useState, useEffect } from 'react';
import { formatBRL, formatCrypto } from '@/lib/currency';

interface ExpiredPayment {
  id: string;
  amount: number;
  brlAmount: number;
  pixTransactionId: string;
  createdAt: string;
  processedAt: string;
  description: string;
  wallet: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface ExpirationStats {
  totalExpired: number;
  totalValue: number;
  last24Hours: number;
  averageTimeToExpiry: number;
}

export default function PagamentosExpiradosPage() {
  const [expiredPayments, setExpiredPayments] = useState<ExpiredPayment[]>([]);
  const [stats, setStats] = useState<ExpirationStats>({
    totalExpired: 0,
    totalValue: 0,
    last24Hours: 0,
    averageTimeToExpiry: 0
  });
  const [loading, setLoading] = useState(true);
  const [runningExpiration, setRunningExpiration] = useState(false);

  useEffect(() => {
    loadExpiredPayments();
    loadStats();
  }, []);

  const loadExpiredPayments = async () => {
    try {
      const response = await fetch('/api/backoffice/expired-payments');
      const result = await response.json();

      if (result.success) {
        setExpiredPayments(result.payments);
      } else {
        console.error('Error loading expired payments:', result.error);
      }
    } catch (error) {
      console.error('Error loading expired payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/cron/expire-payments', { method: 'GET' });
      const result = await response.json();

      if (result.success) {
        // Additional stats would need to be calculated in the API
        console.log('Expiration status:', result.status);
      }
    } catch (error) {
      console.error('Error loading expiration stats:', error);
    }
  };

  const runExpirationJob = async () => {
    try {
      setRunningExpiration(true);
      const response = await fetch('/api/cron/expire-payments', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        console.log('Expiration job completed:', result.stats);
        // Reload data
        await loadExpiredPayments();
        await loadStats();
      } else {
        console.error('Error running expiration job:', result.error);
      }
    } catch (error) {
      console.error('Error running expiration job:', error);
    } finally {
      setRunningExpiration(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pagamentos Expirados</h1>
              <p className="text-gray-600 text-sm mt-1">Transações que expiraram após 15 minutos</p>
            </div>
            <button
              onClick={runExpirationJob}
              disabled={runningExpiration}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {runningExpiration ? 'Processando...' : 'Executar Limpeza Manual'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-900">{expiredPayments.length}</p>
                <p className="text-sm text-red-600">Total Expirados</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">
                  {formatBRL(expiredPayments.reduce((sum, p) => sum + Number(p.brlAmount || 0), 0))}
                </p>
                <p className="text-sm text-yellow-600">Valor Total Perdido</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {expiredPayments.filter(p => {
                    const processedDate = new Date(p.processedAt);
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return processedDate > oneDayAgo;
                  }).length}
                </p>
                <p className="text-sm text-blue-600">Últimas 24h</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">15 min</p>
                <p className="text-sm text-gray-600">Tempo Limite</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expired Payments Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Usuário</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">Valor USDT</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">Valor BRL</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">ID PIX</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Criado em</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Expirou em</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Tempo Ativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiredPayments.map((payment) => {
                  const createdAt = new Date(payment.createdAt);
                  const expiredAt = new Date(payment.processedAt);
                  const activeTime = Math.round((expiredAt.getTime() - createdAt.getTime()) / (1000 * 60)); // minutes

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{payment.wallet.user.name}</p>
                          <p className="text-sm text-gray-600">{payment.wallet.user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-sm">
                        {formatCrypto(Number(payment.amount), 'USDT', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-sm">
                        {formatBRL(Number(payment.brlAmount || 0))}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-mono text-gray-600">
                        {payment.pixTransactionId?.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {createdAt.toLocaleDateString('pt-BR')}
                        <br />
                        <span className="text-xs text-gray-400">
                          {createdAt.toLocaleTimeString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600">
                        {expiredAt.toLocaleDateString('pt-BR')}
                        <br />
                        <span className="text-xs text-gray-400">
                          {expiredAt.toLocaleTimeString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activeTime >= 15 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activeTime} min
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {expiredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum pagamento expirado encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Pagamentos são automaticamente expirados após 15 minutos</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Sistema de Expiração Automática</h3>
              <p className="text-blue-700 text-sm mt-1">
                Pagamentos PIX pendentes são automaticamente expirados após 15 minutos.
                Um job automático roda a cada 5 minutos para limpar transações antigas.
                Transações expiradas ficam com status "FAILED" e são registradas no audit log.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}