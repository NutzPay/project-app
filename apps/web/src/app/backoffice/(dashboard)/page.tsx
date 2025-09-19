'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, DollarSign, Activity, History, CheckCircle2, Clock, XCircle, AlertTriangle, Shield, UserCheck } from 'lucide-react';

interface BackofficeStats {
  users: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  transactions: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    deposits: number;
    withdrawals: number;
    depositVolume: number;
    withdrawalVolume: number;
  };
  volume: {
    today: number;
    month: number;
  };
  investments: {
    total: number;
    active: number;
    pending: number;
    totalVolume: number;
    activeVolume: number;
  };
  system: {
    status: string;
    uptime: string;
  };
}

interface DateFilter {
  label: string;
  days: number;
}

const dateFilters: DateFilter[] = [
  { label: 'Hoje', days: 0 },
  { label: 'Ontem', days: 1 },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 }
];

export default function BackofficePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<BackofficeStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>(dateFilters[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');

  const loadStats = async () => {
    try {
      let url = `/api/backoffice/stats?days=${selectedFilter.days}`;
      
      // Handle special cases for today, yesterday, and custom dates
      if (selectedFilter.days === 0) {
        url = `/api/backoffice/stats?period=today`;
      } else if (selectedFilter.days === 1) {
        url = `/api/backoffice/stats?period=yesterday`;
      } else if (selectedFilter.days === -1 && startDate && endDate) {
        // Custom date range selected
        const startDateTime = `${startDate}T${startTime}:00`;
        const endDateTime = `${endDate}T${endTime}:59`;
        url = `/api/backoffice/stats?period=range&start=${startDateTime}&end=${endDateTime}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentData = async () => {
    try {
      const [transactionsRes, auditLogsRes, pendingUsersRes] = await Promise.all([
        fetch('/api/backoffice/transactions?limit=5'),
        fetch('/api/backoffice/audit-logs?limit=5'),
        fetch('/api/backoffice/users?status=PENDING&limit=5')
      ]);
      
      const [transactionsData, auditData, pendingUsersData] = await Promise.all([
        transactionsRes.json().catch(() => ({ success: false, transactions: [] })),
        auditLogsRes.json().catch(() => ({ success: false, auditLogs: [] })),
        pendingUsersRes.json().catch(() => ({ success: false, users: [] }))
      ]);
      
      if (transactionsData.success) {
        setRecentTransactions(transactionsData.transactions || []);
      }
      
      if (auditData.success) {
        setRecentAuditLogs(auditData.auditLogs || []);
      }

      if (pendingUsersData.success) {
        setPendingUsers(pendingUsersData.users || []);
      }
    } catch (error) {
      console.error('Error loading recent data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadStats(), loadRecentData()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [selectedFilter]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Content with max width and centered */}
      <div className="max-w-7xl mx-auto">
        {/* Date Filter with Calendar */}
        <div className="flex justify-center items-center mb-8 space-x-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {dateFilters.map((filter) => (
              <button
                key={filter.days}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedFilter.days === filter.days
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Calendar Button */}
          <div className="relative">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className={`p-2 border rounded-lg transition-colors ${
                showCalendar 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Date Range Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-6 z-10 min-w-[400px]">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Selecionar Período</h4>
                
                {/* Start Date and Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data/Hora de Início</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* End Date and Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data/Hora de Fim</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atalhos Rápidos</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const today = now.toISOString().split('T')[0];
                        setStartDate(today);
                        setStartTime('00:00');
                        setEndDate(today);
                        setEndTime('23:59');
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Hoje Completo
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        setStartDate(yesterdayStr);
                        setStartTime('00:00');
                        setEndDate(yesterdayStr);
                        setEndTime('23:59');
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Ontem Completo
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        setStartDate(last24h.toISOString().split('T')[0]);
                        setStartTime(last24h.toTimeString().slice(0,5));
                        setEndDate(now.toISOString().split('T')[0]);
                        setEndTime(now.toTimeString().slice(0,5));
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Últimas 24h
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const last12h = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                        setStartDate(last12h.toISOString().split('T')[0]);
                        setStartTime(last12h.toTimeString().slice(0,5));
                        setEndDate(now.toISOString().split('T')[0]);
                        setEndTime(now.toTimeString().slice(0,5));
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Últimas 12h
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setStartDate(weekAgo.toISOString().split('T')[0]);
                        setStartTime('00:00');
                        setEndDate(now.toISOString().split('T')[0]);
                        setEndTime('23:59');
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Últimos 7 Dias
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setStartDate(monthAgo.toISOString().split('T')[0]);
                        setStartTime('00:00');
                        setEndDate(now.toISOString().split('T')[0]);
                        setEndTime('23:59');
                      }}
                      className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Últimos 30 Dias
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => {
                      setShowCalendar(false);
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (startDate && endDate) {
                        const start = new Date(`${startDate}T${startTime}:00`);
                        const end = new Date(`${endDate}T${endTime}:59`);
                        
                        const formatDate = (date: Date) => {
                          return date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        };

                        const customFilter = {
                          label: `${formatDate(start)} - ${formatDate(end)}`,
                          days: -1 // Special value to indicate custom range
                        };
                        setSelectedFilter(customFilter);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={!startDate || !endDate}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid - 8/4 split like dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-8">
            {/* PIX Transactions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transações PIX</h3>
                  <p className="text-sm text-gray-600">Pagamentos instantâneos</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.transactions?.completed?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.transactions?.pending?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Falhadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.transactions?.failed?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {(stats?.volume?.today || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* USDT Transactions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Compras de USDT</h3>
                  <p className="text-sm text-gray-600">Aquisições de USDT via PIX</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.usdtPurchases?.completed?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.usdtPurchases?.pending || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Falhadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.usdtPurchases?.failed || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {(stats?.usdtPurchases?.brlVolume || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Investment Transactions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Investimentos</h3>
                  <p className="text-sm text-gray-600">Aplicações em USDT</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.investments?.total?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.investments?.active?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.investments?.pending || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    $ {(stats?.investments?.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Todas as Transações Recentes</h2>
                <Link href="/backoffice/transacoes" className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Ver todas
                </Link>
              </div>
              <div className="overflow-x-auto">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Usuário</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 text-sm font-mono text-gray-900">#{txn.id.slice(-6)}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {txn.type === 'DEPOSIT' ? 'Depósito' :
                               txn.type === 'WITHDRAWAL' ? 'Saque' :
                               txn.type === 'INVESTMENT' ? 'Investimento' :
                               txn.type || 'PIX'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">{txn.user?.email || 'N/A'}</td>
                          <td className="py-4 px-4 text-sm font-bold text-gray-900">
                            R$ {(txn.brlAmount || txn.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {txn.status === 'COMPLETED' ? 'Concluída' :
                               txn.status === 'PENDING' ? 'Pendente' : 'Falhada'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(txn.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Approval Queue - Dynamic based on pending users */}
            {stats && stats.users.pending > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    Fila de Aprovação
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {stats.users.pending}
                    </span>
                  </h2>
                  <Link href="/backoffice/usuarios" className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Ver todas
                  </Link>
                </div>
                <div className="space-y-4">
                  {pendingUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Carregando usuários pendentes...</p>
                    </div>
                  ) : (
                    pendingUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {user.accountType === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                              </span>
                              {user.companyName && (
                                <span className="text-xs text-gray-400">• {user.companyName}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Aguardando há {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/backoffice/usuarios?user=${user.id}`}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Revisar
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            {/* System Tools */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Ferramentas do Sistema</h3>
              </div>
              <div className="p-4 space-y-3">
                <Link href="/backoffice/usuarios" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Gerenciar Usuários</p>
                    <p className="text-sm text-gray-600">Aprovar, suspender ou editar usuários</p>
                  </div>
                </Link>
                <Link href="/backoffice/auditoria" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Auditoria</p>
                    <p className="text-sm text-gray-600">Monitorar segurança e operações</p>
                  </div>
                </Link>
                <Link href="/backoffice/investimentos" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Investimentos USDT</p>
                    <p className="text-sm text-gray-600">Monitorar aplicações e rendimentos</p>
                  </div>
                </Link>
                <Link href="/backoffice/comercial" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Time Comercial</p>
                    <p className="text-sm text-gray-600">Gerenciar representantes e comissões</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Advanced Tools */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Ferramentas Avançadas</h3>
              </div>
              <div className="p-4 space-y-3">
                <Link href="/backoffice/transacoes" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Transações</p>
                    <p className="text-sm text-gray-600">Monitorar PIX e transferências</p>
                  </div>
                </Link>
                <Link href="/backoffice/configuracoes" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Configurações</p>
                    <p className="text-sm text-gray-600">Parâmetros do sistema</p>
                  </div>
                </Link>
                <Link href="/backoffice/adquirentes" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Adquirentes</p>
                    <p className="text-sm text-gray-600">Gestão de adquirentes</p>
                  </div>
                </Link>
                <Link href="/backoffice/chaves-api" className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Chaves API</p>
                    <p className="text-sm text-gray-600">Gerenciar autenticação</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo Geral</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total de Usuários</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.users?.total?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Usuários Pendentes</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.users?.pending?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Volume Mensal</span>
                  <span className="text-lg font-bold text-gray-900">
                    R$ {(stats?.volume?.month || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Investimentos</span>
                  <span className="text-lg font-bold text-gray-900">
                    {stats?.investments?.total?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Activity Log */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
              <div className="space-y-3">
                {recentAuditLogs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Nenhuma atividade encontrada</p>
                  </div>
                ) : (
                  recentAuditLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-gray-100">
                        <Activity className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action.replace('_', ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {log.user ? `${log.user.name} (${log.user.email})` : 'Sistema'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}