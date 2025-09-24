'use client';

import { useState, useEffect } from 'react';

interface ProfitStats {
  pixProfit: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  usdtProfit: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  totalProfit: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  transactionCount: {
    pix: { today: number; week: number; month: number; };
    usdt: { today: number; week: number; month: number; };
  };
}

export default function MargensPage() {
  const [stats, setStats] = useState<ProfitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadProfitStats();
  }, []);

  const loadProfitStats = async () => {
    setLoading(true);
    try {
      // TODO: Implementar chamada real da API para calcular margens
      // const response = await fetch('/api/backoffice/profit-stats', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     period: selectedPeriod,
      //     startDate,
      //     endDate
      //   })
      // });
      // const data = await response.json();
      // setStats(data);
      
      const emptyStats: ProfitStats = {
        pixProfit: {
          today: 0,
          week: 0,
          month: 0,
          total: 0
        },
        usdtProfit: {
          today: 0,
          week: 0,
          month: 0,
          total: 0
        },
        totalProfit: {
          today: 0,
          week: 0,
          month: 0,
          total: 0
        },
        transactionCount: {
          pix: { today: 0, week: 0, month: 0 },
          usdt: { today: 0, week: 0, month: 0 }
        }
      };
      
      setStats(emptyStats);
    } catch (error) {
      console.error('Error loading profit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const getPeriodData = (type: 'pix' | 'usdt' | 'total') => {
    if (!stats) return 0;
    return stats[`${type}Profit`][selectedPeriod];
  };

  const getTransactionCount = (type: 'pix' | 'usdt') => {
    if (!stats) return 0;
    return stats.transactionCount[type][selectedPeriod];
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Margens de Lucro</h1>
          <p className="mt-2 text-gray-600">
            Analise detalhada dos lucros por tipo de transacao e periodo
          </p>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <nav className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPeriod('today')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'today'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setSelectedPeriod('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'week'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  7 Dias
                </button>
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'month'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  30 Dias
                </button>
                <button
                  onClick={() => setSelectedPeriod('quarter')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'quarter'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  3 Meses
                </button>
                <button
                  onClick={() => setSelectedPeriod('year')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'year'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  1 Ano
                </button>
                <button
                  onClick={() => setSelectedPeriod('custom')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    selectedPeriod === 'custom'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Personalizado
                </button>
              </nav>

              {/* Custom Date Range */}
              {selectedPeriod === 'custom' && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    onClick={() => loadProfitStats()}
                    className="mt-6 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Profit */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600">Lucro Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getPeriodData('total'))}</p>
            </div>
            <div className="text-sm text-gray-500">
              {getTransactionCount('pix') + getTransactionCount('usdt')} transações
            </div>
          </div>

          {/* PIX Profit */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600">Lucro PIX</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getPeriodData('pix'))}</p>
            </div>
            <div className="text-sm text-gray-500">
              {getTransactionCount('pix')} transações PIX
            </div>
          </div>

          {/* USDT Profit */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600">Lucro USDT</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getPeriodData('usdt'), 'USD')}</p>
            </div>
            <div className="text-sm text-gray-500">
              {getTransactionCount('usdt')} transações USDT
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Detalhamento por Período</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Período</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Lucro PIX</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Lucro USDT</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Transações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Hoje</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.pixProfit.today || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.usdtProfit.today || 0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(stats?.totalProfit.today || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {(stats?.transactionCount.pix.today || 0) + (stats?.transactionCount.usdt.today || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">7 Dias</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.pixProfit.week || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.usdtProfit.week || 0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(stats?.totalProfit.week || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {(stats?.transactionCount.pix.week || 0) + (stats?.transactionCount.usdt.week || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">30 Dias</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.pixProfit.month || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(stats?.usdtProfit.month || 0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(stats?.totalProfit.month || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {(stats?.transactionCount.pix.month || 0) + (stats?.transactionCount.usdt.month || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">3 Meses</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      0
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">1 Ano</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">
                      {formatCurrency(0, 'USD')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 font-bold">
                      {formatCurrency(0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      0
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}