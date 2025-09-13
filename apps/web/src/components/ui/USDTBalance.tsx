'use client';

import { useState, useEffect } from 'react';
import { formatBRL, formatCrypto, formatCurrency } from '@/lib/currency';

export default function USDTBalance() {
  const [balance, setBalance] = useState(15420.50); // Mock balance
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load balance from localStorage or API
    const savedBalance = localStorage.getItem('usdt-balance');
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };


  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/50 shadow-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">₮</span>
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold text-lg">Saldo USDT</h3>
              <p className="text-gray-600 text-sm">Disponível para operações</p>
            </div>
          </div>
          
          <button
            onClick={toggleVisibility}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-white/50"
          >
            {isVisible ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            )}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {isVisible ? formatCrypto(balance, 'USDT', { showSymbol: false, maximumFractionDigits: 6 }) : '••••••'}
            </span>
            <span className="text-lg text-gray-600 font-medium">USDT</span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              ≈ {isVisible ? formatCurrency(balance * 1.00, 'USD') : '••••••'}
            </p>
            
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-700 text-xs font-medium transition-colors"
              >
                Prova de Fundos
              </a>
              
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Limit Banner */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium">Limite de Investimento</p>
              <p className="text-gray-600 text-xs">Disponível: 10.000 USDT</p>
            </div>
            <button className="text-amber-700 hover:text-amber-800 text-xs font-medium px-3 py-1 border border-amber-300 rounded-lg hover:bg-amber-100 transition-all">
              Pedir Aumento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}