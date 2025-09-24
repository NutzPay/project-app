'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import WithdrawalModal from '@/components/modals/WithdrawalModal';
import { useTransactions } from '@/hooks/useTransactions';
import '@/styles/mobile-transactions.css';

const mockTransactions = [
  {
    id: 'TXN001',
    date: '2024-08-22T10:30:00Z',
    type: 'deposit',
    method: 'PIX',
    amount: 1500.00,
    fee: 0.00,
    status: 'completed',
    description: 'Depósito PIX - João Silva',
    reference: 'PIX-2024-08-22-001',
    wallet: 'BRL',
    hash: '0x1a2b3c4d5e6f...',
    fromAddress: '***1234',
    toAddress: '***5678',
    confirmations: 12,
    network: 'PIX',
    cpf: '123.456.789-01',
    customerName: 'João Silva',
    origin: 'Loja Virtual ABC'
  },
  {
    id: 'TXN002',
    date: '2024-08-22T09:15:00Z',
    type: 'withdrawal',
    method: 'USDT',
    amount: 500.00,
    fee: 2.50,
    status: 'pending',
    description: 'Saque USDT - Maria Santos',
    reference: 'USDT-2024-08-22-002',
    wallet: 'USDT',
    hash: '0x9z8y7x6w5v4u...',
    fromAddress: '0x742d35Cc6aB16c...',
    toAddress: '0x9e4f23B8cD7a1E...',
    confirmations: 3,
    network: 'TRC20',
    cpf: '987.654.321-09',
    customerName: 'Maria Santos',
    origin: 'E-commerce XYZ'
  },
  {
    id: 'TXN003',
    date: '2024-08-22T08:45:00Z',
    type: 'exchange',
    method: 'BRL/USDT',
    amount: 2000.00,
    fee: 10.00,
    status: 'completed',
    description: 'Troca BRL → USDT - Pedro Oliveira',
    reference: 'EXC-2024-08-22-003',
    wallet: 'EXCHANGE',
    hash: '',
    fromAddress: 'BRL Wallet',
    toAddress: 'USDT Wallet',
    confirmations: 0,
    network: 'INTERNAL',
    cpf: '555.444.333-22',
    customerName: 'Pedro Oliveira',
    origin: 'Portal de Trocas'
  },
  {
    id: 'TXN004',
    date: '2024-08-21T16:20:00Z',
    type: 'deposit',
    method: 'CRYPTO',
    amount: 750.00,
    fee: 0.00,
    status: 'completed',
    description: 'Depósito Bitcoin - Ana Costa',
    reference: 'BTC-2024-08-21-004',
    wallet: 'BTC',
    hash: '0xabc123def456...',
    fromAddress: '1A2B3C4D5E6F7G8H...',
    toAddress: '9I0J1K2L3M4N5O6P...',
    confirmations: 6,
    network: 'BITCOIN',
    cpf: '111.222.333-44',
    customerName: 'Ana Costa',
    origin: 'Carteira Bitcoin'
  },
  {
    id: 'TXN005',
    date: '2024-08-21T14:10:00Z',
    type: 'withdrawal',
    method: 'PIX',
    amount: 1200.00,
    fee: 0.00,
    status: 'failed',
    description: 'Saque PIX - Carlos Ferreira',
    reference: 'PIX-2024-08-21-005',
    wallet: 'BRL',
    hash: '',
    fromAddress: '***9012',
    toAddress: '***3456',
    confirmations: 0,
    network: 'PIX',
    cpf: '999.888.777-66',
    customerName: 'Carlos Ferreira',
    origin: 'Conta Corrente'
  }
];

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  processing: 'bg-gray-100 text-gray-800'
};

const typeColors = {
  deposit: 'text-green-600',
  withdrawal: 'text-red-600',
  exchange: 'text-gray-700',
  transfer: 'text-purple-600'
};

export default function TransactionsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });

  // Use the dynamic transactions hook
  const { transactions: apiTransactions, loading, error, pagination, refetch } = useTransactions({
    page: 1,
    limit: 20,
    ...(filters.status && { status: filters.status.toUpperCase() }),
    ...(filters.method === 'USDT' && { type: 'USDT' }),
    ...(filters.method === 'PIX' && { type: 'PIX' }),
  });

  // Temporarily use only mock data to debug
  const transactions = mockTransactions;

  const stats = {
    totalTransactions: pagination.total || 1247,
    totalVolume: 2458750.50, // This would need to be calculated from API
    completedToday: 89, // This would need to be calculated from API
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    averageValue: 1972.45, // This would need to be calculated from API
    totalFees: 12580.30 // This would need to be calculated from API
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    let validCurrency = 'BRL';
    
    if (currency === 'USDT') {
      validCurrency = 'USD';
    } else if (currency === 'BTC') {
      validCurrency = 'USD'; // Display BTC values as USD equivalent
    } else if (['BRL', 'USD', 'EUR'].includes(currency)) {
      validCurrency = currency;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: validCurrency
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
      case 'pending':
        return <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
      case 'failed':
        return <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
      default:
        return <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
    }
  };

  return (
    <DashboardLayout 
      userType="standard" // Não usado mais, configuração única
      onWithdrawClick={() => setShowWithdrawalModal(true)}
    >
      <div className="space-y-6">
        {/* Page Header - Mobile Optimized */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transações</h1>
            <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Gerencie e monitore todas as transações da plataforma</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button className="flex-1 sm:flex-none px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards - Compact Layout */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Resumo de Transações</h3>
          
          {/* Mobile: Vertical layout, Desktop: 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Volume</p>
                <p className="text-xs sm:text-lg font-bold text-gray-900" title={formatCurrency(stats.totalVolume)}>
                  <span className="sm:hidden">R$ 2,46M</span>
                  <span className="hidden sm:inline">{formatCurrency(stats.totalVolume)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Hoje</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Pendentes</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{stats.pendingTransactions}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Média</p>
                <p className="text-xs sm:text-lg font-bold text-gray-900" title={formatCurrency(stats.averageValue)}>
                  <span className="sm:hidden">R$ 1,97K</span>
                  <span className="hidden sm:inline">{formatCurrency(stats.averageValue)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-600">Taxas</p>
                <p className="text-xs sm:text-lg font-bold text-gray-900" title={formatCurrency(stats.totalFees)}>
                  <span className="sm:hidden">R$ 12,6K</span>
                  <span className="hidden sm:inline">{formatCurrency(stats.totalFees)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avançados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Todos</option>
                  <option value="completed">Concluídas</option>
                  <option value="pending">Pendentes</option>
                  <option value="failed">Falhadas</option>
                  <option value="processing">Processando</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Todos</option>
                  <option value="deposit">Depósitos</option>
                  <option value="withdrawal">Saques</option>
                  <option value="exchange">Trocas</option>
                  <option value="transfer">Transferências</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data De</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Até</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Transaction Tabs - Mobile Optimized */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide tabs-scroll px-4 sm:px-6">
              {[
                { id: 'all', label: 'Todas', count: transactions.length },
                { id: 'deposits', label: 'Depósitos', count: transactions.filter(t => t.type === 'deposit').length },
                { id: 'withdrawals', label: 'Saques', count: transactions.filter(t => t.type === 'withdrawal').length },
                { id: 'exchanges', label: 'Trocas', count: transactions.filter(t => t.type === 'exchange').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === 'all' ? 'Todas' : 
                     tab.id === 'deposits' ? 'Depós.' : 
                     tab.id === 'withdrawals' ? 'Saques' : 'Trocas'}
                  </span>
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID/Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo/Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor/Taxa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                        <p className="text-sm text-gray-600">Carregando transações...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-red-600 mb-2">{error}</p>
                        <button
                          onClick={refetch}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.id}</div>
                        <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${typeColors[transaction.type as keyof typeof typeColors]}`}>
                          {transaction.type === 'deposit' ? 'Depósito' : 
                           transaction.type === 'withdrawal' ? 'Saque' :
                           transaction.type === 'exchange' ? 'Troca' : 'Transferência'}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.method}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount, transaction.wallet)}
                        </div>
                        <div className="text-sm text-gray-500">Taxa: {formatCurrency(transaction.fee)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                          {transaction.status === 'completed' ? 'Concluída' :
                           transaction.status === 'pending' ? 'Pendente' :
                           transaction.status === 'failed' ? 'Falhada' : 'Processando'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{transaction.description}</div>
                      <div className="text-sm text-gray-500">{transaction.reference}</div>
                      {transaction.network !== 'PIX' && transaction.network !== 'INTERNAL' && (
                        <div className="text-xs text-gray-400">
                          Confirmações: {transaction.confirmations}/6
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-gray-700 hover:text-gray-900 mr-2"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Enhanced */}
          <div className="md:hidden">
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{transactions.length} transações</span>
                <span>Deslize para ver mais</span>
              </div>
            </div>
            <div className="space-y-3 px-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Carregando transações...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={refetch}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  onClick={() => setSelectedTransaction(transaction)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mobile-card cursor-pointer no-select"
                >
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {transaction.type === 'deposit' ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        ) : transaction.type === 'withdrawal' ? (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {transaction.customerName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {transaction.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transaction.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[transaction.status as keyof typeof statusColors]}`}>
                        {transaction.status === 'completed' ? 'OK' :
                         transaction.status === 'pending' ? 'Pend.' :
                         transaction.status === 'failed' ? 'Erro' : 'Proc.'}
                      </span>
                    </div>
                  </div>

                  {/* Amount and Type */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(transaction.amount, transaction.wallet)}
                      </div>
                      {transaction.fee > 0 && (
                        <div className="text-xs text-gray-500">
                          Taxa: {formatCurrency(transaction.fee)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${typeColors[transaction.type as keyof typeof typeColors]}`}>
                        {transaction.type === 'deposit' ? 'Entrada' : 
                         transaction.type === 'withdrawal' ? 'Saída' :
                         transaction.type === 'exchange' ? 'Câmbio' : 'Transfer.'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.method}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                      <span>{new Date(transaction.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {transaction.network !== 'PIX' && transaction.network !== 'INTERNAL' && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>{transaction.confirmations}/6</span>
                      </div>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Pagination - Mobile Optimized */}
          <div className="bg-white px-4 sm:px-6 py-4 border-t border-gray-200">
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between sm:hidden">
              <button className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              <div className="text-sm text-gray-700">
                <span className="font-medium">1</span>-<span className="font-medium">5</span> de <span className="font-medium">1247</span>
              </div>
              <button className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                Próximo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Desktop Pagination */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
                  <span className="font-medium">1247</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="bg-gray-900 border-gray-900 text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-800 transition-colors">
                    1
                  </button>
                  <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors">
                    2
                  </button>
                  <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors">
                    3
                  </button>
                  <button className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl shadow-lg rounded-xl bg-white my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Comprovante de Transação</h3>
                  <p className="text-sm text-gray-600">#{selectedTransaction.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6 flex justify-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selectedTransaction.status as keyof typeof statusColors]}`}>
                {getStatusIcon(selectedTransaction.status)}
                <span className="ml-2">
                  {selectedTransaction.status === 'completed' ? 'Transação Concluída' :
                   selectedTransaction.status === 'pending' ? 'Transação Pendente' :
                   selectedTransaction.status === 'failed' ? 'Transação Falhada' : 'Processando Transação'}
                </span>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-gray-50 p-6 rounded-xl mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.wallet)}
                </div>
                <div className={`text-lg font-medium ${typeColors[selectedTransaction.type as keyof typeof typeColors]} mb-1`}>
                  {selectedTransaction.type === 'deposit' ? 'Depósito Recebido' : 
                   selectedTransaction.type === 'withdrawal' ? 'Saque Realizado' :
                   selectedTransaction.type === 'exchange' ? 'Troca Executada' : 'Transferência'}
                </div>
                <div className="text-sm text-gray-600">
                  via {selectedTransaction.method} • {formatDate(selectedTransaction.date)}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Cliente</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedTransaction.customerName}</p>
                  <p className="text-xs text-gray-600">{selectedTransaction.cpf}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Origem</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedTransaction.origin}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Descrição</label>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900 text-sm">Detalhes Técnicos</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-500 mb-1">Referência</label>
                  <p className="text-gray-900 font-mono">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-500 mb-1">Rede</label>
                  <p className="text-gray-900">{selectedTransaction.network}</p>
                </div>
                
                {selectedTransaction.fee > 0 && (
                  <div>
                    <label className="block font-medium text-gray-500 mb-1">Taxa</label>
                    <p className="text-gray-900">{formatCurrency(selectedTransaction.fee)}</p>
                  </div>
                )}
                
                {selectedTransaction.network !== 'PIX' && selectedTransaction.network !== 'INTERNAL' && (
                  <div>
                    <label className="block font-medium text-gray-500 mb-1">Confirmações</label>
                    <p className="text-gray-900">{selectedTransaction.confirmations}/6</p>
                  </div>
                )}
              </div>
              
              {selectedTransaction.hash && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hash da Transação</label>
                  <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded border">
                    {selectedTransaction.hash}
                  </p>
                </div>
              )}
              
              {selectedTransaction.network !== 'INTERNAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Endereço de Origem</label>
                    <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded border">
                      {selectedTransaction.fromAddress}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Endereço de Destino</label>
                    <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded border">
                      {selectedTransaction.toAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  // Função para gerar e baixar comprovante em PDF
                  const generatePDF = async () => {
                    try {
                      // Criar conteúdo HTML do comprovante
                      const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Comprovante - NutzPay</title>
                          <style>
                            @page { 
                              size: A4; 
                              margin: 15mm; 
                            }
                            * {
                              margin: 0;
                              padding: 0;
                              box-sizing: border-box;
                            }
                            body { 
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              color: #1a1a1a;
                              line-height: 1.4;
                              background: #fff;
                              padding: 32px;
                              font-size: 15px;
                            }
                            
                            /* Header minimalista */
                            .header {
                              display: flex;
                              align-items: center;
                              margin-bottom: 24px;
                              padding-bottom: 16px;
                              border-bottom: 1px solid #f0f0f0;
                            }
                            
                            .logo-container {
                              display: flex;
                              align-items: center;
                              flex: 1;
                            }
                            
                            .logo {
                              height: 45px;
                              width: auto;
                              margin-right: 16px;
                            }
                            
                            .status-indicator {
                              width: 24px;
                              height: 24px;
                              background: #dc2626;
                              border-radius: 50%;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              margin-left: auto;
                            }
                            
                            .status-indicator:after {
                              content: '✓';
                              color: white;
                              font-size: 14px;
                              font-weight: bold;
                            }

                            /* Título minimalista */
                            .document-title {
                              font-size: 22px;
                              font-weight: 400;
                              color: #1a1a1a;
                              margin-bottom: 8px;
                              letter-spacing: -0.01em;
                            }

                            /* Data */
                            .datetime {
                              font-size: 14px;
                              color: #6b7280;
                              margin-bottom: 24px;
                              font-weight: 400;
                            }

                            /* Informações principais */
                            .info-row {
                              display: flex;
                              justify-content: space-between;
                              align-items: flex-start;
                              padding: 10px 0;
                              border-bottom: 1px solid #f5f5f5;
                            }
                            
                            .info-row:last-child {
                              border-bottom: none;
                            }

                            .info-label {
                              font-size: 15px;
                              color: #1a1a1a;
                              font-weight: 400;
                              flex-shrink: 0;
                              width: 160px;
                            }

                            .info-value {
                              font-size: 15px;
                              color: #1a1a1a;
                              text-align: right;
                              font-weight: 500;
                              word-break: break-word;
                              flex: 1;
                            }
                            
                            .amount-value {
                              font-size: 20px;
                              font-weight: 600;
                              color: #1a1a1a;
                            }

                            /* Seções */
                            .section {
                              margin: 20px 0;
                            }
                            
                            .section-title {
                              font-size: 13px;
                              color: #6b7280;
                              margin-bottom: 12px;
                              text-transform: uppercase;
                              font-weight: 500;
                              letter-spacing: 0.05em;
                            }

                            /* Footer limpo */
                            .footer {
                              margin-top: 32px;
                              padding: 16px 0;
                              border-top: 1px solid #f0f0f0;
                            }

                            .company-info {
                              margin-bottom: 12px;
                            }
                            
                            .company-name {
                              font-size: 16px;
                              font-weight: 600;
                              color: #1a1a1a;
                              margin-bottom: 4px;
                            }

                            .company-details {
                              font-size: 13px;
                              color: #6b7280;
                              margin-bottom: 12px;
                            }

                            .transaction-details {
                              margin-bottom: 12px;
                            }
                            
                            .transaction-label {
                              font-size: 13px;
                              color: #6b7280;
                              margin-bottom: 4px;
                            }
                            
                            .transaction-id {
                              font-size: 12px;
                              color: #1a1a1a;
                              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                              background: #f8f9fa;
                              padding: 6px 8px;
                              border-radius: 4px;
                              letter-spacing: 0.02em;
                            }

                            .support-info {
                              font-size: 12px;
                              color: #9ca3af;
                              line-height: 1.5;
                            }
                            
                            .support-link {
                              color: #dc2626;
                              text-decoration: none;
                              font-weight: 500;
                            }
                          </style>
                        </head>
                        <body>
                          <!-- Header -->
                          <div class="header">
                            <div class="logo-container">
                              <img src="/logo.png" alt="NutzPay" class="logo" />
                            </div>
                            <div class="status-indicator"></div>
                          </div>

                          <!-- Título do documento -->
                          <div class="document-title">
                            Comprovante de ${selectedTransaction.type === 'deposit' ? 'depósito' : selectedTransaction.type === 'withdrawal' ? 'saque' : selectedTransaction.type === 'exchange' ? 'câmbio' : 'transferência'}
                          </div>

                          <!-- Data -->
                          <div class="datetime">
                            ${formatDate(selectedTransaction.date)}
                          </div>

                          <!-- Informações principais da transação -->
                          <div class="info-row">
                            <div class="info-label">Valor da operação</div>
                            <div class="info-value amount-value">
                              ${formatCurrency(selectedTransaction.amount, selectedTransaction.wallet)}
                            </div>
                          </div>

                          <div class="info-row">
                            <div class="info-label">Tipo de operação</div>
                            <div class="info-value">${selectedTransaction.type === 'deposit' ? 'Depósito' : selectedTransaction.type === 'withdrawal' ? 'Saque' : selectedTransaction.type === 'exchange' ? 'Câmbio' : 'Transferência'}</div>
                          </div>

                          <div class="info-row">
                            <div class="info-label">Método de pagamento</div>
                            <div class="info-value">${selectedTransaction.method}</div>
                          </div>

                          <div class="info-row">
                            <div class="info-label">Status da transação</div>
                            <div class="info-value" style="color: ${selectedTransaction.status === 'completed' ? '#059669' : selectedTransaction.status === 'pending' ? '#d97706' : '#dc2626'}; font-weight: 600;">
                              ${selectedTransaction.status === 'completed' ? '✓ CONCLUÍDA' : selectedTransaction.status === 'pending' ? '⏳ PENDENTE' : '✗ FALHADA'}
                            </div>
                          </div>

                          ${selectedTransaction.fee > 0 ? `
                          <div class="info-row">
                            <div class="info-label">Taxa de serviço</div>
                            <div class="info-value">${formatCurrency(selectedTransaction.fee)}</div>
                          </div>
                          
                          <div class="info-row">
                            <div class="info-label">Valor líquido</div>
                            <div class="info-value" style="font-weight: 600;">
                              ${formatCurrency(selectedTransaction.type === 'withdrawal' ? selectedTransaction.amount - selectedTransaction.fee : selectedTransaction.amount + selectedTransaction.fee, selectedTransaction.wallet)}
                            </div>
                          </div>
                          ` : ''}

                          <!-- Identificação da transação -->
                          <div class="section">
                            <div class="section-title">Identificação</div>

                            <div class="info-row">
                              <div class="info-label">ID • Referência</div>
                              <div class="info-value" style="font-family: monospace; font-size: 12px;">
                                ${selectedTransaction.id}<br>
                                <span style="color: #6b7280; font-size: 11px;">${selectedTransaction.reference}</span>
                              </div>
                            </div>

                            ${selectedTransaction.network && selectedTransaction.network !== 'PIX' && selectedTransaction.network !== 'INTERNAL' ? `
                            <div class="info-row">
                              <div class="info-label">Rede • Confirmações</div>
                              <div class="info-value">${selectedTransaction.network} • ${selectedTransaction.confirmations}/6</div>
                            </div>
                            ` : ''}
                          </div>

                          <!-- Dados do cliente -->
                          <div class="section">
                            <div class="section-title">
                              ${selectedTransaction.type === 'deposit' ? 'Dados do Remetente' : 'Dados do Beneficiário'}
                            </div>

                            <div class="info-row">
                              <div class="info-label">Nome completo</div>
                              <div class="info-value">${selectedTransaction.customerName.toUpperCase()}</div>
                            </div>

                            <div class="info-row">
                              <div class="info-label">CPF</div>
                              <div class="info-value">${selectedTransaction.cpf}</div>
                            </div>

                            ${selectedTransaction.method === 'PIX' ? `
                            <div class="info-row">
                              <div class="info-label">Chave PIX</div>
                              <div class="info-value">${selectedTransaction.customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com</div>
                            </div>
                            ` : ''}

                            ${selectedTransaction.method === 'USDT' || selectedTransaction.method === 'CRYPTO' ? `
                            <div class="info-row">
                              <div class="info-label">Endereço da wallet</div>
                              <div class="info-value" style="font-family: monospace; font-size: 12px; word-break: break-all;">${selectedTransaction.toAddress || selectedTransaction.fromAddress}</div>
                            </div>
                            ` : ''}
                          </div>

                          <!-- Dados da NutzPay (para contexto institucional) -->
                          ${selectedTransaction.type === 'deposit' ? `
                          <div class="section">
                            <div class="section-title">Destinatário</div>

                            <div class="info-row">
                              <div class="info-label">Instituição • CNPJ</div>
                              <div class="info-value">
                                NUTZPAY S.A.<br>
                                <span style="color: #6b7280; font-size: 13px;">18.236.120/0001-58</span>
                              </div>
                            </div>

                            <div class="info-row">
                              <div class="info-label">Ag • Conta</div>
                              <div class="info-value">0001 • ${selectedTransaction.id.replace('TXN', '')}-7</div>
                            </div>
                          </div>
                          ` : ''}

                          <!-- Footer -->
                          <div class="footer">
                            <div class="company-info">
                              <div class="company-name">NutzPay S.A. - Instituição de Pagamento</div>
                              <div class="company-details">CNPJ 18.236.120/0001-58</div>
                            </div>
                            
                            <div class="transaction-details">
                              <div class="transaction-label">ID da transação</div>
                              <div class="transaction-id">${selectedTransaction.id}${Date.now().toString().slice(-8)}</div>
                            </div>
                            
                            <div class="support-info">
                              Suporte: <a href="mailto:suporte@nutzpay.com.br" class="support-link">suporte@nutzpay.com.br</a> • Ouvidoria: 0800 887 0463
                            </div>
                          </div>
                        </body>
                        </html>
                      `;

                      // Usar html2pdf se disponível, caso contrário fallback para window.print
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(htmlContent);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 500);
                      }
                    } catch (error) {
                      console.error('Erro ao gerar PDF:', error);
                      alert('Erro ao gerar comprovante. Tente novamente.');
                    }
                  };
                  generatePDF();
                }}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Baixar Comprovante</span>
              </button>
            </div>
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Comprovante gerado pela NutzPay • suporte@nutzbeta.com
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      <WithdrawalModal 
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />
    </DashboardLayout>
  );
}