'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import WithdrawalModal from '@/components/modals/WithdrawalModal';

interface PixTransaction {
  id: string;
  type: 'received' | 'sent';
  amount: number;
  description: string;
  pixKey: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  endToEndId?: string;
}

interface PixKey {
  id: string;
  type: 'email' | 'phone' | 'cpf' | 'random';
  key: string;
  isActive: boolean;
  createdAt: string;
}

export default function PixPage() {
  const [pixBalance, setPixBalance] = useState(0);
  const [pixTransactions, setPixTransactions] = useState<PixTransaction[]>([]);
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [statistics, setStatistics] = useState({ received30Days: 0, sent30Days: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'keys'>('overview');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    loadPixData();
  }, []);

  const loadPixData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceResponse, transactionsResponse, keysResponse] = await Promise.all([
        fetch('/api/pix/balance'),
        fetch('/api/pix/transactions'),
        fetch('/api/pix/keys')
      ]);

      if (!balanceResponse.ok) {
        throw new Error('Erro ao carregar saldo PIX');
      }
      if (!transactionsResponse.ok) {
        throw new Error('Erro ao carregar transações PIX');
      }
      if (!keysResponse.ok) {
        throw new Error('Erro ao carregar chaves PIX');
      }

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();
      const keysData = await keysResponse.json();

      if (balanceData.success) {
        setPixBalance(balanceData.balance.brlAmount);
      }

      if (transactionsData.success) {
        setPixTransactions(transactionsData.transactions);
        setStatistics(transactionsData.statistics);
      }

      if (keysData.success) {
        setPixKeys(keysData.keys);
      }

    } catch (error) {
      console.error('Error loading PIX data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados PIX');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getPixKeyTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'phone': return 'Telefone';
      case 'cpf': return 'CPF';
      case 'random': return 'Chave Aleatoria';
      default: return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'received') {
      return (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m8 8H4" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout 
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout 
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Erro ao carregar dados</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadPixData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      userType="operator"
      onWithdrawClick={() => setShowWithdrawalModal(true)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">PIX</h1>
            <p className="text-gray-600 mt-1">Gerencie suas transações e chaves PIX</p>
          </div>
        </div>

        {/* PIX Balance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Saldo PIX</h2>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-2">
            {formatCurrency(pixBalance)}
          </div>
          <p className="text-sm text-gray-500">Disponivel para transferencias PIX</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Visao Geral' },
              { key: 'transactions', label: 'Transacoes' },
              { key: 'keys', label: 'Chaves PIX' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recebido (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.received30Days)}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Enviado (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.sent30Days)}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Transacoes</p>
                    <p className="text-xl font-bold text-black">{statistics.totalTransactions}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Chaves Ativas</p>
                    <p className="text-xl font-bold text-black">{pixKeys.filter(k => k.isActive).length}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-black">Transacoes Recentes</h3>
              </div>
              <div className="p-4 space-y-3">
                {pixTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'received' ? 'text-green-600' : 'text-black'
                      }`}>
                        {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                <button className="w-full text-sm text-gray-600 hover:text-black py-2">
                  Ver todas as transacoes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Historico de Transacoes</h2>
                <div className="flex items-center space-x-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Ultimos 30 dias</option>
                    <option>Ultimos 7 dias</option>
                    <option>Hoje</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pixTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-black">{transaction.description}</h4>
                        <p className={`font-bold ${
                          transaction.type === 'received' ? 'text-green-600' : 'text-black'
                        }`}>
                          {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <p>Para: {transaction.pixKey}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status === 'completed' ? 'Concluida' :
                             transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </span>
                          <p>{new Date(transaction.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      {transaction.endToEndId && (
                        <p className="text-xs text-gray-400 mt-1">ID: {transaction.endToEndId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PIX Keys Tab */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">Minhas Chaves PIX</h2>
                  <button className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                    Nova Chave
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pixKeys.map((pixKey) => (
                    <div key={pixKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-black">{pixKey.key}</p>
                          <p className="text-sm text-gray-500">{getPixKeyTypeLabel(pixKey.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pixKey.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pixKey.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal 
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />
    </DashboardLayout>
  );
}