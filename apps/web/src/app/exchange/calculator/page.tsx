'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import { priceCalculator } from '@/lib/priceCalculator';
import Link from 'next/link';

interface PriceQuote {
  usdtAmount: number;
  brlAmount: number;
  usdtPrice: number;
  sellerFee: number;
  finalPrice: number;
  pricePerUsdt: number;
  validUntil: Date;
  quoteId: string;
}

export default function ExchangeCalculatorPage() {
  const [inputMode, setInputMode] = useState<'brl' | 'usdt'>('brl');
  const [brlAmount, setBrlAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteTimer, setQuoteTimer] = useState(300); // 5 minutes
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);

  // Timer for quote expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quote && quoteTimer > 0) {
      interval = setInterval(() => {
        setQuoteTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quote, quoteTimer]);

  // Calculate price with debounce
  useEffect(() => {
    const calculatePrice = async () => {
      if (inputMode === 'brl' && brlAmount) {
        const amount = parseFloat(brlAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (amount >= 10) {
          try {
            setLoading(true);
            const calc = await priceCalculator.calculateUSDTAmount(amount);
            const newQuote: PriceQuote = {
              ...calc,
              validUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
              quoteId: `QTE${Date.now()}`
            };
            setQuote(newQuote);
            setUsdtAmount(calc.usdtAmount.toFixed(6));
            setQuoteTimer(300);
          } catch (error) {
            console.error('Error calculating price:', error);
          } finally {
            setLoading(false);
          }
        }
      } else if (inputMode === 'usdt' && usdtAmount) {
        const amount = parseFloat(usdtAmount);
        if (amount >= 1) {
          try {
            setLoading(true);
            const calc = await priceCalculator.calculatePrice(amount);
            const newQuote: PriceQuote = {
              ...calc,
              validUntil: new Date(Date.now() + 5 * 60 * 1000),
              quoteId: `QTE${Date.now()}`
            };
            setQuote(newQuote);
            setBrlAmount(calc.finalPrice.toFixed(2));
            setQuoteTimer(300);
          } catch (error) {
            console.error('Error calculating price:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    const timer = setTimeout(calculatePrice, 800);
    return () => clearTimeout(timer);
  }, [brlAmount, usdtAmount, inputMode]);

  const formatNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout userType="user">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">Calculadora de Câmbio</h1>
            <Link href="/exchange/terms" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-black rounded-full w-4/7"></div>
            </div>
            <span className="text-sm text-gray-500">Etapa 4 de 7</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-black mb-2">Simule sua Operação</h2>
                <p className="text-gray-600">
                  Calcule exatamente quanto você receberá em USDT
                </p>
              </div>

              {/* Input Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                <button
                  onClick={() => setInputMode('brl')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    inputMode === 'brl'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Informar Reais (BRL)
                </button>
                <button
                  onClick={() => setInputMode('usdt')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    inputMode === 'usdt'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Informar USDT
                </button>
              </div>

              {/* Calculator Form */}
              <div className="space-y-6">
                {/* Primary Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {inputMode === 'brl' ? 'Valor em Reais (BRL)' : 'Quantidade USDT'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputMode === 'brl' ? brlAmount : usdtAmount}
                      onChange={(e) => {
                        if (inputMode === 'brl') {
                          setBrlAmount(formatNumber(e.target.value));
                        } else {
                          setUsdtAmount(e.target.value);
                        }
                      }}
                      placeholder={inputMode === 'brl' ? '10.000' : '1000.000000'}
                      className="w-full px-4 py-4 pl-12 pr-16 text-xl border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all"
                    />
                    <span className="absolute left-4 top-4 text-gray-500 text-xl">
                      {inputMode === 'brl' ? 'R$' : '₮'}
                    </span>
                    {loading && (
                      <div className="absolute right-4 top-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {inputMode === 'brl' ? 'Valor mínimo: R$ 10,00' : 'Quantidade mínima: 1 USDT'}
                  </p>
                </div>

                {/* Conversion Arrow */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* Result Display */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {inputMode === 'brl' ? 'Quantidade USDT que você receberá' : 'Valor total a pagar (BRL)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputMode === 'brl' ? usdtAmount : brlAmount}
                      readOnly
                      className="w-full px-4 py-4 pl-12 text-xl bg-gray-50 border border-gray-200 rounded-xl text-gray-700"
                    />
                    <span className="absolute left-4 top-4 text-gray-500 text-xl">
                      {inputMode === 'brl' ? '₮' : 'R$'}
                    </span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Valores rápidos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {inputMode === 'brl' 
                      ? ['1.000', '5.000', '10.000', '25.000'].map(value => (
                          <button
                            key={value}
                            onClick={() => setBrlAmount(value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                          >
                            R$ {value}
                          </button>
                        ))
                      : ['100', '500', '1000', '2500'].map(value => (
                          <button
                            key={value}
                            onClick={() => setUsdtAmount(value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                          >
                            {value} ₮
                          </button>
                        ))
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {quote && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-black">Detalhamento da Operação</h3>
                  <button
                    onClick={() => setShowQuoteDetails(!showQuoteDetails)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showQuoteDetails ? 'Ocultar' : 'Ver'} detalhes
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cotação base USDT:</span>
                      <span className="font-medium">{priceCalculator.formatPrice(quote.usdtPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de câmbio:</span>
                      <span className="font-medium text-orange-600">{quote.sellerFee}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço final por USDT:</span>
                      <span className="font-medium">{priceCalculator.formatPrice(quote.pricePerUsdt)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-black font-semibold">Total a pagar:</span>
                      <span className="font-bold">{priceCalculator.formatPrice(quote.finalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-black font-semibold">Você receberá:</span>
                      <span className="font-bold">{priceCalculator.formatUSDT(quote.usdtAmount)}</span>
                    </div>
                  </div>
                </div>

                {showQuoteDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h4 className="font-semibold text-black mb-3">Informações da Cotação</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID da cotação:</span>
                            <span className="font-mono">{quote.quoteId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Válida até:</span>
                            <span>{quote.validUntil.toLocaleTimeString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fonte de preço:</span>
                            <span>CoinMarketCap Pro</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-black mb-3">Estimativas de Tempo</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confirmação PIX:</span>
                            <span>Instantâneo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processamento:</span>
                            <span>1-4 horas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Crédito USDT:</span>
                            <span>Até 24h úteis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Status */}
            {quote && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${
                    quoteTimer > 60 
                      ? 'bg-green-100 text-green-800'
                      : quoteTimer > 30
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cotação válida: {formatTimer(quoteTimer)}
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">Sua Cotação</h3>
                  <p className="text-sm text-gray-600">
                    Cotação reservada e garantida por 5 minutos
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-black mb-1">
                      {priceCalculator.formatUSDT(quote.usdtAmount)}
                    </div>
                    <div className="text-sm text-gray-600">por</div>
                    <div className="text-xl font-bold text-black">
                      {priceCalculator.formatPrice(quote.finalPrice)}
                    </div>
                  </div>
                </div>

                <Link
                  href="/exchange/operation"
                  className="block w-full bg-black text-white py-3 rounded-xl font-semibold text-center hover:bg-gray-800 transition-all"
                >
                  Aceitar Cotação
                </Link>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Cotação garantida até o pagamento
                </p>
              </div>
            )}

            {/* Market Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-black mb-3">Informações do Mercado</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">USDT/USD:</span>
                  <span className="font-medium text-green-600">$1.0001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USD/BRL:</span>
                  <span className="font-medium">R$ 5.43</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spread:</span>
                  <span className="font-medium">0.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume 24h:</span>
                  <span className="font-medium">$42.3B</span>
                </div>
              </div>
            </div>

            {/* Limits Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Limites Operacionais</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Mínimo:</span>
                  <span>R$ 10,00</span>
                </div>
                <div className="flex justify-between">
                  <span>Máximo diário:</span>
                  <span>R$ 50.000,00</span>
                </div>
                <div className="flex justify-between">
                  <span>Usado hoje:</span>
                  <span>R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}