'use client';

import { useState, useEffect } from 'react';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  isUp: boolean;
  logoUrl: string;
}

const mockCryptoData: CryptoData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 113171.86,
    change24h: -0.60,
    change7d: 2.43,
    isUp: false,
    logoUrl: 'https://4p.finance/assets/btc_logo.svg',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 4281.94,
    change24h: 1.56,
    change7d: 8.23,
    isUp: true,
    logoUrl: 'https://4p.finance/assets/ethereum_logo.svg',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    price: 1.00,
    change24h: 0.01,
    change7d: 0.02,
    isUp: true,
    logoUrl: 'https://4p.finance/assets/usdt_logo.svg',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    price: 762.45,
    change24h: 2.34,
    change7d: 12.56,
    isUp: true,
    logoUrl: 'https://4p.finance/assets/bnb_logo.svg',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 184.25,
    change24h: 1.58,
    change7d: 15.23,
    isUp: true,
    logoUrl: 'https://4p.finance/assets/solana_logo.svg',
  },
];

interface CryptoCardProps {
  crypto: CryptoData;
  onClick: (crypto: CryptoData) => void;
}

function CryptoCard({ crypto, onClick }: CryptoCardProps) {
  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)}`;
  };

  return (
    <div 
      className={`group relative flex flex-col border rounded-lg min-w-[270px] lg:min-w-max py-5 px-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
        crypto.isUp 
          ? 'border-emerald-400/10 bg-emerald-500/5 hover:bg-emerald-500/10' 
          : 'border-rose-400/10 bg-rose-500/5 hover:bg-rose-500/10'
      }`}
      onClick={() => onClick(crypto)}
    >
      {/* Background Effects */}
      <div className={`pointer-events-none absolute inset-0 rounded-[inherit] duration-300 opacity-0 group-hover:opacity-100 ${
        crypto.isUp 
          ? 'bg-gradient-radial from-emerald-600/10 via-transparent to-emerald-900/5'
          : 'bg-gradient-radial from-rose-600/10 via-transparent to-rose-900/5'
      }`}></div>
      
      <div className="absolute inset-px rounded-[inherit] bg-neutral-950"></div>
      
      <div className="relative w-full space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <img 
              src={crypto.logoUrl} 
              alt={`${crypto.name} logo`} 
              width="20" 
              height="20" 
              className="size-5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>`;
              }}
            />
            <span className="text-sm text-neutral-50 font-medium">{crypto.symbol}</span>
          </div>
          <span className="text-sm text-neutral-400">{formatPrice(crypto.price)}</span>
        </div>

        {/* Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {crypto.isUp ? (
              <svg className="size-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            ) : (
              <svg className="size-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                <polyline points="16 17 22 17 22 11"></polyline>
              </svg>
            )}
          </div>
          <span className={`text-sm ${crypto.isUp ? 'text-green-400' : 'text-rose-500'}`}>
            {crypto.change24h > 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
          </span>
        </div>

        {/* 7d Performance */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-neutral-500">7d</span>
          <span className={crypto.change7d >= 0 ? 'text-green-400' : 'text-rose-500'}>
            {crypto.change7d > 0 ? '+' : ''}{crypto.change7d.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CryptoCarousel() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  const handleCryptoClick = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    setShowPerformanceModal(true);
  };

  return (
    <>
      {/* Carousel Container */}
      <div className="overflow-hidden w-full rounded-md antialiased relative">
        {/* Fade gradients */}
        <div className="pointer-events-none absolute inset-y-0 z-10 left-0 w-1/4 bg-gradient-to-r from-gray-50 to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 z-10 right-0 w-1/4 bg-gradient-to-l from-gray-50 to-transparent"></div>
        
        {/* Scrolling content */}
        <div className="group flex overflow-hidden p-2 gap-4">
          <div className="flex shrink-0 justify-around gap-4 animate-marquee">
            {mockCryptoData.map((crypto) => (
              <CryptoCard key={crypto.symbol} crypto={crypto} onClick={handleCryptoClick} />
            ))}
          </div>
          <div className="flex shrink-0 justify-around gap-4 animate-marquee">
            {mockCryptoData.map((crypto) => (
              <CryptoCard key={`${crypto.symbol}-2`} crypto={crypto} onClick={handleCryptoClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Performance Modal */}
      {showPerformanceModal && selectedCrypto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedCrypto.logoUrl} 
                    alt={`${selectedCrypto.name} logo`} 
                    className="w-8 h-8"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCrypto.name}</h2>
                    <p className="text-gray-600">{selectedCrypto.symbol}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">7 dias</p>
                  <p className={`text-lg font-bold ${selectedCrypto.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedCrypto.change7d > 0 ? '+' : ''}{selectedCrypto.change7d.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">30 dias</p>
                  <p className="text-lg font-bold text-green-600">+12.34%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">YTD</p>
                  <p className="text-lg font-bold text-green-600">+145.67%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">1 ano</p>
                  <p className="text-lg font-bold text-green-600">+234.89%</p>
                </div>
              </div>

              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Gráfico de Performance (Mock)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}