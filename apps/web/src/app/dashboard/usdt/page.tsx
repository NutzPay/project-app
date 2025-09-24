'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import WithdrawalModal from '@/components/modals/WithdrawalModal';

interface USDTTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'transfer_in' | 'transfer_out' | 'adjustment';
  amount: number;
  brlAmount?: number;
  exchangeRate?: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  pixCode?: string;
  externalId?: string;
  balanceAfter?: number;
  createdAt: string;
  processedAt?: string;
}

interface USDTWallet {
  balance: number;
  frozenBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  availableBalance: number;
  brlEquivalent: number;
  exchangeRate: number;
}

interface Statistics {
  deposited30Days: number;
  withdrawn30Days: number;
  invested30Days: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
}

export default function USDTPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<USDTWallet | null>(null);
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ 
    deposited30Days: 0, withdrawn30Days: 0, invested30Days: 0, 
    totalTransactions: 0, completedTransactions: 0, pendingTransactions: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'history'>('overview');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');

  useEffect(() => {
    loadUSDTData();
  }, []);

  const loadUSDTData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch('/api/usdt/balance'),
        fetch('/api/usdt/transactions')
      ]);

      if (!balanceResponse.ok) {
        throw new Error('Erro ao carregar saldo USDT');
      }
      if (!transactionsResponse.ok) {
        throw new Error('Erro ao carregar transações USDT');
      }

      const balanceData = await balanceResponse.json();
      const transactionsData = await transactionsResponse.json();

      if (balanceData.success) {
        setWallet(balanceData.wallet);
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
        setStatistics(transactionsData.statistics);
      }

    } catch (error) {
      console.error('Error loading USDT data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados USDT');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USDT' | 'BRL' = 'USDT') => {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount);
    }
    return `${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Saque';
      case 'investment': return 'Investimento';
      case 'return': return 'Retorno';
      case 'transfer_in': return 'Recebida';
      case 'transfer_out': return 'Enviada';
      case 'adjustment': return 'Ajuste';
      default: return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    const containerClass = "w-10 h-10 rounded-full flex items-center justify-center";
    
    switch (type) {
      case 'deposit':
      case 'return':
      case 'transfer_in':
        return (
          <div className={`${containerClass} bg-green-100`}>
            <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        );
      case 'withdrawal':
      case 'transfer_out':
        return (
          <div className={`${containerClass} bg-red-100`}>
            <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
        );
      case 'investment':
        return (
          <div className={`${containerClass} bg-blue-100`}>
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${containerClass} bg-gray-100`}>
            <svg className={`${iconClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const filteredTransactions = transactionFilter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === transactionFilter);

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
              onClick={loadUSDTData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!wallet) {
    return (
      <DashboardLayout 
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="text-center py-12">
          <p className="text-gray-600">Carteira USDT não encontrada</p>
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
            <h1 className="text-2xl font-bold text-black">USDT</h1>
            <p className="text-gray-600 mt-1">Gerencie sua carteira USDT e transações</p>
          </div>
        </div>

        {/* USDT Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Saldo Disponivel</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {formatCurrency(wallet.availableBalance)}
            </div>
            <p className="text-sm text-gray-500">{formatCurrency(wallet.brlEquivalent, 'BRL')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Saldo Bloqueado</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {formatCurrency(wallet.frozenBalance)}
            </div>
            <p className="text-sm text-gray-500">Bloqueado em investimentos</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Saldo Total</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {formatCurrency(wallet.balance)}
            </div>
            <p className="text-sm text-gray-500">Disponivel + Bloqueado</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Visao Geral' },
              { key: 'transactions', label: 'Transacoes' },
              { key: 'history', label: 'Historico' }
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
                    <p className="text-sm text-gray-500">Depositado (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.deposited30Days)}</p>
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
                    <p className="text-sm text-gray-500">Sacado (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.withdrawn30Days)}</p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors cursor-pointer group"
                onClick={() => router.push('/dashboard/investimentos')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Investido (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.invested30Days)}</p>
                    <p className="text-xs text-blue-600 group-hover:text-blue-700 mt-1">
                      Ver detalhes completos →
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
            </div>

            {/* Investment Access Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer group hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                 onClick={() => router.push('/dashboard/investimentos')}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-50 group-hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Painel de Investimentos</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Dashboard completo</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Investido</span>
                  <span className="font-semibold text-black">{formatCurrency(statistics.invested30Days)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Performance em tempo real
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Análise detalhada por plano
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Histórico de rendimentos
                </div>
              </div>
              
              <div className="flex items-center justify-center py-2 bg-gray-50 group-hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">Acessar Dashboard Completo</span>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab - Second Row */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-black">Transacoes Recentes</h3>
              </div>
              <div className="p-4 space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
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
                        ['deposit', 'return', 'transfer_in'].includes(transaction.type) ? 'text-green-600' : 'text-black'
                      }`}>
                        {['deposit', 'return', 'transfer_in'].includes(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="w-full text-sm text-gray-600 hover:text-black py-2"
                >
                  Ver todas as transacoes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {(activeTab === 'transactions' || activeTab === 'history') && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">
                  {activeTab === 'transactions' ? 'Transacoes USDT' : 'Historico Completo'}
                </h2>
                <div className="flex items-center space-x-2">
                  <select 
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="deposit">Depositos</option>
                    <option value="withdrawal">Saques</option>
                    <option value="investment">Investimentos</option>
                    <option value="return">Retornos</option>
                    <option value="transfer_in">Transferencias recebidas</option>
                    <option value="transfer_out">Transferencias enviadas</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-black">{transaction.description}</h4>
                          <p className={`font-bold ${
                            ['deposit', 'return', 'transfer_in'].includes(transaction.type) ? 'text-green-600' : 'text-black'
                          }`}>
                            {['deposit', 'return', 'transfer_in'].includes(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <p>{getTransactionTypeLabel(transaction.type)}</p>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {transaction.status === 'completed' ? 'Concluida' :
                               transaction.status === 'pending' ? 'Pendente' : 
                               transaction.status === 'failed' ? 'Falhou' : 'Cancelada'}
                            </span>
                            <p>{new Date(transaction.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        {transaction.externalId && (
                          <p className="text-xs text-gray-400 mt-1">ID: {transaction.externalId}</p>
                        )}
                        {transaction.brlAmount && (
                          <p className="text-xs text-gray-400 mt-1">
                            BRL: {formatCurrency(transaction.brlAmount, 'BRL')}
                            {transaction.exchangeRate && ` (Taxa: ${transaction.exchangeRate.toFixed(4)})`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
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