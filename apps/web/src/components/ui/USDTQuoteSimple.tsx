'use client';

import { useState, useEffect } from 'react';
import { formatBRL, formatCrypto, formatCurrency } from '@/lib/currency';
import { useUSDTData } from '@/hooks/useUSDTData';

export default function USDTQuoteSimple() {
  const [showChart, setShowChart] = useState(false);
  
  // Use real USDT data with 5 minute updates for simple component
  const { 
    data: realUsdtData, 
    historicalData: realHistoricalData, 
    loading, 
    error, 
    isPositive 
  } = useUSDTData({ 
    currency: 'BRL',
    updateInterval: 300000, // 5 minutes
    enableHistorical: true 
  });

  // Fallback data if API fails
  const fallbackData = {
    currentPrice: 5.42,
    change24h: 0.02,
    changePercent24h: 0.37,
    lastUpdate: new Date().toLocaleString('pt-BR')
  };

  const fallbackHistoricalData = [
    { month: 'Janeiro 2024', price: 4.96 },
    { month: 'Fevereiro 2024', price: 5.12 },
    { month: 'Março 2024', price: 5.28 },
    { month: 'Abril 2024', price: 5.35 },
    { month: 'Maio 2024', price: 5.41 },
    { month: 'Junho 2024', price: 5.38 },
    { month: 'Julho 2024', price: 5.45 },
    { month: 'Agosto 2024', price: 5.40 },
    { month: 'Setembro 2024', price: 5.43 },
    { month: 'Outubro 2024', price: 5.39 },
    { month: 'Novembro 2024', price: 5.41 },
    { month: 'Dezembro 2024', price: 5.42 }
  ];

  // Use real data if available, otherwise fallback
  const usdtData = realUsdtData || fallbackData;
  const historicalData = realHistoricalData.length > 0 ? realHistoricalData : fallbackHistoricalData;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  const isPositiveValue = realUsdtData ? isPositive : (usdtData.changePercent24h >= 0);
  const minPrice = Math.min(...historicalData.map(d => d.price));
  const maxPrice = Math.max(...historicalData.map(d => d.price));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">₮</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">USDT/BRL</h3>
            <p className="text-gray-600 text-sm">Tether - Cotação atual</p>
          </div>
        </div>

        {/* Price Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-black">
                {formatBRL(usdtData.currentPrice, { maximumFractionDigits: 3 })}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isPositiveValue 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  <svg className={`w-3 h-3 mr-1 ${isPositiveValue ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 7H7v10" />
                  </svg>
                  {isPositiveValue ? '+' : ''}{usdtData.changePercent24h.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500">
                  {isPositiveValue ? '+' : ''}{formatBRL(usdtData.change24h, { showSymbol: false })} (24h)
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowChart(!showChart)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-gray-700">
                {showChart ? 'Ocultar' : 'Ver'} Gráfico
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Última atualização: {usdtData.lastUpdate}</span>
            <div className="flex items-center space-x-2">
              {realUsdtData && (
                <span className="text-green-600" title="Dados em tempo real via CoinMarketCap">
                  🟢
                </span>
              )}
              {!realUsdtData && (
                <span className="text-amber-600" title="Dados simulados - API indisponível">
                  🟡
                </span>
              )}
              {error && (
                <span className="text-red-500" title={error}>
                  ⚠️
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className="border-t border-gray-100 p-6">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-black mb-2">Histórico dos Últimos 12 Meses</h4>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Mín: {formatBRL(minPrice)}</span>
              <span>Máx: {formatBRL(maxPrice)}</span>
              <span>Variação: {(((maxPrice - minPrice) / minPrice) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Simple Line Chart */}
          <div className="relative h-40 bg-gray-50 rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="25" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="300" height="100" fill="url(#grid)" />
              
              {/* Chart line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={historicalData.map((point, index) => {
                  const x = (index / (historicalData.length - 1)) * 280 + 10;
                  const y = 90 - ((point.price - minPrice) / (maxPrice - minPrice)) * 80;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {historicalData.map((point, index) => {
                const x = (index / (historicalData.length - 1)) * 280 + 10;
                const y = 90 - ((point.price - minPrice) / (maxPrice - minPrice)) * 80;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#10b981"
                    className="hover:r-4 transition-all cursor-pointer"
                  >
                    <title>{point.month}: {formatBRL(point.price, { maximumFractionDigits: 3 })}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          {/* Month labels */}
          <div className="grid grid-cols-6 gap-1 mt-3 text-xs text-gray-500">
            {historicalData.filter((_, index) => index % 2 === 0).map((point) => (
              <div key={point.month} className="text-center">
                {point.month.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-blue-800">Informação</p>
                <p className="text-xs text-blue-700 mt-1">
                  O USDT é uma stablecoin pareada ao dólar americano. A cotação em reais varia conforme a taxa de câmbio USD/BRL.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}