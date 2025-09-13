'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Mini gráfico SVG simples
function MiniChart({ data, color = '#6b7280', positive = true }: { data: number[], color?: string, positive?: boolean }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="60" height="20" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        className="opacity-80"
      />
    </svg>
  );
}

// Componente para mostrar dados financeiros em tempo real
function CryptoPriceCards() {
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [brlHistory, setBrlHistory] = useState<number[]>([4.03, 5.16, 5.58, 5.22, 4.98, 5.45]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number, symbol = 'R$', decimals = 2) => {
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
  };

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch('/api/crypto/coinmarketcap?convert=BRL');
        const result = await response.json();
        if (result.success) {
          setCryptoData(result.data);
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="lg:pt-16 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pt-16 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Bitcoin */}
          {cryptoData?.BTC && (
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">Bitcoin</span>
                  <span className="text-xs text-gray-500">BTC</span>
                </div>
                <span className="text-xs text-gray-400">
                  {cryptoData.BTC.change24h >= 0 ? '+' : ''}{cryptoData.BTC.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(cryptoData.BTC.currentPrice, 'R$', 0)}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Vol: {formatLargeNumber(cryptoData.BTC.volume24h)}</span>
                <span>Cap: {formatLargeNumber(cryptoData.BTC.marketCap)}</span>
              </div>
              <div className="mt-2">
                <MiniChart 
                  data={[
                    cryptoData.BTC.currentPrice * 0.95, 
                    cryptoData.BTC.currentPrice * 0.98, 
                    cryptoData.BTC.currentPrice * 1.02, 
                    cryptoData.BTC.currentPrice, 
                    cryptoData.BTC.currentPrice * 1.01, 
                    cryptoData.BTC.currentPrice
                  ]} 
                  color="#6b7280"
                />
              </div>
            </div>
          )}

          {/* USDT */}
          {cryptoData?.USDT && (
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">Tether</span>
                  <span className="text-xs text-gray-500">USDT</span>
                </div>
                <span className="text-xs text-gray-400">
                  {cryptoData.USDT.change24h >= 0 ? '+' : ''}{cryptoData.USDT.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(cryptoData.USDT.currentPrice)}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Vol: {formatLargeNumber(cryptoData.USDT.volume24h)}</span>
                <span>Cap: {formatLargeNumber(cryptoData.USDT.marketCap)}</span>
              </div>
              <div className="mt-2">
                <MiniChart 
                  data={[
                    cryptoData.USDT.currentPrice * 0.999, 
                    cryptoData.USDT.currentPrice * 1.001, 
                    cryptoData.USDT.currentPrice * 0.998, 
                    cryptoData.USDT.currentPrice, 
                    cryptoData.USDT.currentPrice * 1.002, 
                    cryptoData.USDT.currentPrice
                  ]} 
                  color="#6b7280"
                />
              </div>
            </div>
          )}

          {/* Ethereum */}
          {cryptoData?.ETH && (
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">Ethereum</span>
                  <span className="text-xs text-gray-500">ETH</span>
                </div>
                <span className="text-xs text-gray-400">
                  {cryptoData.ETH.change24h >= 0 ? '+' : ''}{cryptoData.ETH.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(cryptoData.ETH.currentPrice, 'R$', 0)}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Vol: {formatLargeNumber(cryptoData.ETH.volume24h)}</span>
                <span>Cap: {formatLargeNumber(cryptoData.ETH.marketCap)}</span>
              </div>
              <div className="mt-2">
                <MiniChart 
                  data={[
                    cryptoData.ETH.currentPrice * 0.96, 
                    cryptoData.ETH.currentPrice * 0.99, 
                    cryptoData.ETH.currentPrice * 1.01, 
                    cryptoData.ETH.currentPrice, 
                    cryptoData.ETH.currentPrice * 1.03, 
                    cryptoData.ETH.currentPrice
                  ]} 
                  color="#6b7280"
                />
              </div>
            </div>
          )}

          {/* Real Brasileiro */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">Real Brasileiro</span>
                <span className="text-xs text-gray-500">BRL</span>
              </div>
              <span className="text-xs text-gray-400">-7.8%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              $0.18
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>vs USD</span>
              <span>Anual: -7.8%</span>
            </div>
            <div className="mt-2">
              <MiniChart 
                data={brlHistory} 
                color="#6b7280"
                positive={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">190+</div>
            <div className="text-xs text-gray-500 mt-1">Países</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">50+</div>
            <div className="text-xs text-gray-500 mt-1">Moedas</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">&lt;1s</div>
            <div className="text-xs text-gray-500 mt-1">Transações</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">24/7</div>
            <div className="text-xs text-gray-500 mt-1">Disponível</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <span className="text-xs text-gray-400">
            Dados atualizados automaticamente • Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate cards with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCard(prev => prev === 0 ? 1 : 0);
        setIsAnimating(false);
      }, 200);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const cardData = [
    {
      title: "Pagamentos Rápidos",
      description: "Processe pagamentos instantâneos com total segurança e agilidade. Seus clientes pagam facilmente, você recebe na hora.",
      buttonText: "Começar a receber",
      color: "rgb(220, 38, 38)", // red-600
      features: [
        "Interface simples para seus clientes",
        "Processamento instantâneo 24/7", 
        "Integração via API completa"
      ]
    },
    {
      title: "Conversão Global",
      description: "Acesse mercados globais convertendo seus reais para moedas estáveis como USDT. Preserve valor e amplie oportunidades.",
      buttonText: "Ver taxas de conversão",
      color: "rgb(55, 65, 81)", // gray-700
      features: [
        "Receba em reais, converta quando precisar",
        "Taxas transparentes e competitivas",
        "Suporte para moedas digitais estáveis"
      ]
    }
  ];

  return (
    <div className="bg-white font-sans antialiased relative">
      {/* Navigation */}
      <nav className="hidden lg:flex justify-center fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl py-3 border-b border-gray-100">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <Image
                src="/banners/logo.png"
                alt="NutzPay Logo"
                width={74}
                height={34}
                className="rounded-lg"
              />
            </Link>
            <ul className="flex gap-5">
              <li>
                <Link href="/" className="text-sm text-gray-700 hover:text-primary-400">
                  Início
                </Link>
              </li>
              <li>
                <Link href="#payments" className="text-sm text-gray-700 hover:text-primary-400">
                  Pagamentos
                </Link>
              </li>
              <li>
                <Link href="#conversion" className="text-sm text-gray-700 hover:text-primary-400">
                  Conversão
                </Link>
              </li>
              <li>
                <Link href="#contato" className="text-sm text-gray-700 hover:text-primary-400">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 text-gray-700 h-8 px-3 text-xs">
              Português
            </button>
            <Link href="/auth/login">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 text-gray-700 h-8 px-3 text-xs">
                Login
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 hover:bg-gray-800 text-white h-8 px-3 text-xs">
                <span className="md:block hidden">Abrir conta</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="flex lg:hidden border-b border-gray-100 justify-center fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl py-3">
        <div className="container flex items-center justify-between">
          <Link href="/">
            <Image
              src="/banners/logo.png"
              alt="NutzPay Logo"
              width={40}
              height={20}
            />
          </Link>
          <div className="flex items-center gap-1">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 text-gray-700 h-8 px-3 text-xs">
              Português
            </button>
            <Link href="/auth/register">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 bg-primary-400/10 text-primary-400 shadow-sm hover:bg-primary-400/[15%] h-8 px-3 text-xs">
                Abrir conta
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[180vh] flex-col justify-end overflow-hidden flex pb-20">
        {/* Background Layer */}
        <div className="absolute inset-0 w-full h-full">
          <div className="relative w-full h-full">
            <Image
              src="/banners/newyork.png"
              alt="Background New York"
              width={1200}
              height={655}
              className="object-cover w-full h-full opacity-80"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
          </div>
        </div>
        
        {/* Content grouped together at bottom */}
        <div className="relative z-10 space-y-12">
          {/* Hero Title - Lower and closer to card */}
          <div className="container mx-auto max-w-7xl px-4">
            <div className="space-y-4 flex justify-center items-center flex-col text-center">
              <div className="space-y-2">
                <h1 className="animate-in text-center fade-in duration-700 w-full flex-nowrap tracking-tight text-balance font-black lg:leading-[0.85] text-gray-900 leading-[1.05] text-3xl md:text-5xl lg:text-6xl max-w-5xl mx-auto">
                  <span className="block font-black text-gray-900 mb-1">Pagamentos</span>
                  <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 inline-block text-transparent bg-clip-text font-black tracking-tighter animate-shiny-text bg-[length:200%_100%]">sem fronteiras</span>
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-primary-400 to-primary-600 mx-auto rounded-full mt-4"></div>
              </div>
              
              <div className="space-y-3 max-w-2xl mx-auto">
                <p className="text-center text-lg md:text-xl text-gray-700 font-medium !text-balance">
                  Receba, envie e converta dinheiro globalmente
                </p>
                <p className="text-center text-base text-gray-500 !text-balance max-w-xl mx-auto">
                  A solução completa para seus pagamentos internacionais
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Auto-Rotating Card - Close to text but at very bottom */}
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex justify-center max-w-5xl mx-auto">
              <div className="relative w-full max-w-4xl">
                <div className="relative transition-all duration-1000 ease-out transform-gpu">
                  {/* Main Card Container */}
                  <Link href="/dashboard" className="cursor-pointer block h-full">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 relative transition-all duration-700 hover:shadow-2xl overflow-hidden">
                      
                      {/* Card Content Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                        
                        {/* Left Side - Dynamic Content */}
                        <div className="order-2 lg:order-1">
                          {/* Dynamic Icon */}
                          <div 
                            className={`flex justify-start items-center size-12 rounded-xl mb-4 transition-all duration-700 ease-in-out ${isAnimating ? 'scale-110 opacity-70' : 'scale-100 opacity-100'}`}
                            style={{ backgroundColor: cardData[currentCard].color }}
                          >
                            <svg 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="text-white transition-all duration-700 ml-3"
                            >
                              {currentCard === 0 ? (
                                // Payment icon
                                <>
                                  <path d="M5 12h14"/>
                                  <path d="m12 5 7 7-7 7"/>
                                </>
                              ) : (
                                // Conversion icon
                                <>
                                  <path d="M7 16a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1"/>
                                  <path d="M17 8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4v-1"/>
                                </>
                              )}
                            </svg>
                          </div>
                          
                          {/* Dynamic Content */}
                          <div className="text-left space-y-4">
                            {/* Title */}
                            <h3 className={`text-2xl md:text-3xl font-bold text-gray-900 transition-all duration-700 ${isAnimating ? 'opacity-30 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
                              {cardData[currentCard].title}
                            </h3>
                            
                            {/* Description */}
                            <p className={`text-gray-600 text-base leading-relaxed transition-all duration-700 ${isAnimating ? 'opacity-30 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
                              {cardData[currentCard].description}
                            </p>
                            
                            {/* CTA Button */}
                            <div className="pt-4">
                              <button 
                                className={`inline-flex items-center justify-center rounded-full text-sm font-medium text-white transition-all duration-700 h-11 px-6 py-2 shadow-lg hover:shadow-xl hover:scale-105 ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}
                                style={{ backgroundColor: cardData[currentCard].color }}
                              >
                                {cardData[currentCard].buttonText}
                              </button>
                            </div>

                            {/* Features */}
                            <div className="space-y-2 pt-4">
                              {cardData[currentCard].features.map((feature, index) => (
                                <div key={index} className={`flex items-center gap-2 text-sm text-gray-600 transition-all duration-700 ${isAnimating ? 'opacity-30 transform translate-x-2' : 'opacity-100 transform translate-x-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full transition-all duration-700 flex-shrink-0"
                                    style={{ backgroundColor: cardData[currentCard].color }}
                                  ></span>
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            {/* Auto-progress indicator */}
                            <div className="flex gap-2 pt-3">
                              {[0, 1].map((index) => (
                                <div
                                  key={index}
                                  className={`h-1 rounded-full transition-all duration-700 ${
                                    currentCard === index ? 'bg-current w-6' : 'bg-gray-300 w-2'
                                  }`}
                                  style={{ color: cardData[currentCard].color }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Dynamic Image */}
                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                          <div 
                            className={`relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden transition-all duration-700 shadow-xl ${isAnimating ? 'scale-95 rotate-1' : 'scale-100 rotate-0'}`}
                          >
                            <Image
                              src="/assets/leao.png"
                              alt={cardData[currentCard].title}
                              width={300}
                              height={300}
                              className="object-cover w-full h-full transition-all duration-700"
                              style={{
                                filter: currentCard === 0 
                                  ? 'sepia(20%) hue-rotate(340deg) brightness(1.05) contrast(1.05)'
                                  : 'sepia(10%) hue-rotate(200deg) brightness(1.1) contrast(1.1)'
                              }}
                            />
                            
                            {/* Dynamic Overlay */}
                            <div 
                              className="absolute inset-0 transition-all duration-700"
                              style={{
                                background: `linear-gradient(135deg, 
                                  ${cardData[currentCard].color}20 0%, 
                                  ${cardData[currentCard].color}10 100%)`
                              }}
                            />
                            
                            {/* Timer indicator */}
                            <div className="absolute bottom-3 right-3">
                              <div 
                                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-700"
                                style={{
                                  borderColor: cardData[currentCard].color,
                                  backgroundColor: `${cardData[currentCard].color}20`
                                }}
                              >
                                <div 
                                  className="text-xs font-bold"
                                  style={{ color: cardData[currentCard].color }}
                                >
                                  {currentCard + 1}/2
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pt-32">
        {/* Payment Solutions Section */}
        <section className="pb-24" id="payments">
          <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row justify-between items-center gap-8 px-6">
            <div className="flex flex-col gap-4 lg:w-1/2">
              <div className="w-full text-center lg:text-left">
                <span className="text-primary-400 text-base font-medium">Soluções de Pagamento</span>
                <h2 className="bg-gradient-to-r from-10% text-transparent from-gray-900 via-gray-600 to-gray-500 bg-clip-text text-3xl text-left tracking-tighter font-bold leading-tight md:text-6xl font-semibold">
                  Receba pagamentos sem complicação
                </h2>
              </div>
              <p className="max-w-2xl mx-auto text-balance text-base md:text-lg leading-8 text-gray-600 text-center lg:text-left">
                Sua solução completa para processar pagamentos. Seus clientes pagam facilmente, você recebe na hora.
              </p>
            </div>
            <Link href="/dashboard" className="block md:w-auto w-full">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-100/20 disabled:pointer-events-none disabled:opacity-50 bg-primary-400 hover:bg-primary-500 text-white transition-all ease-linear duration-500 h-12 px-8 text-base">
                Começar a receber
              </button>
            </Link>
          </div>

          {/* Live Crypto Prices */}
          <CryptoPriceCards />
        </section>

        {/* Benefits Section */}
        <section>
          <div className="flex flex-col justify-start items-start">
            <div className="container mx-auto max-w-6xl text-center px-6">
              <span className="text-primary-400 text-base">Recursos Completos</span>
              <h2 className="bg-gradient-to-r from-10% text-transparent from-gray-900 via-gray-600 to-gray-500 bg-clip-text text-3xl text-left tracking-tighter font-bold leading-tight md:text-6xl font-semibold">
                Tudo para facilitar seus pagamentos.
              </h2>
            </div>
            
            {/* Benefits Cards */}
            <div className="w-full h-full py-20">
              <div className="relative w-full">
                <div className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-20">
                  <div className="flex flex-row justify-start gap-6 pl-6 scroll-smooth will-change-transform mx-auto max-w-7xl">
                    {[
                      {
                        category: 'Transferências',
                        title: 'Pagamentos instantâneos sem fronteiras.',
                        image: 'https://www.tecnicon.com.br/images/large/tudo-sobre-o-pix-novo-sistema-de-pagamento-instantaneo.png'
                      },
                      {
                        category: 'Proteja seu Capital',
                        title: 'Preserve valor contra a inflação monetária.',
                        image: 'https://dkro.com.br/wp-content/uploads/2020/06/relatorios-digitais-dkro-e1592832307260.jpg'
                      },
                      {
                        category: 'Liberdade',
                        title: 'Acesse mercados globais sem limitações.',
                        image: 'https://lets.events/blog/wp-content/uploads/2023/02/notificacoes-push.jpg'
                      },
                      {
                        category: 'Segurança',
                        title: 'Proteção total dos seus dados e dinheiro.',
                        image: 'https://natpay.com/blog/wp-content/uploads/2022/07/2fa_244604815e2002163172e999d25d58a2_2000.jpg'
                      },
                      {
                        category: 'Integrações',
                        title: 'Conecte com as ferramentas que você usa.',
                        image: 'https://www.verx.com.br/wp-content/uploads/2024/09/Imagem6.jpg'
                      },
                      {
                        category: 'Moedas Digitais',
                        title: 'Acesso fácil ao mercado cripto.',
                        image: 'https://investidor10.com.br/storage/news/655be71980a33.jpg'
                      }
                    ].map((benefit, index) => (
                      <div key={index} className="last:pr-[5%] md:last:pr-[33%]">
                        <button className="relative z-10 flex h-80 hover:scale-102 rounded-xl transition-transform ease-linear w-56 flex-col items-start justify-start overflow-hidden md:rounded-3xl bg-gray-100 md:h-160 md:w-96">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-black/60 z-30"></div>
                          <div className="absolute inset-0 opacity-20 z-20">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <path d="M0,0 L100,0 L90,100 L0,100 Z" fill="url(#whiteGradient)" />
                            </svg>
                          </div>
                          <svg width="0" height="0">
                            <defs>
                              <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:0.6}} />
                                <stop offset="100%" style={{stopColor:'#f8fafc', stopOpacity:0.2}} />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="relative z-40 p-6 md:p-8">
                            <p className="text-left font-sans text-sm font-medium text-white md:text-base">{benefit.category}</p>
                            <p className="mt-2 md:mt-5 max-w-xs text-left tracking-tighter font-bold text-lg font-semibold leading-snug text-white md:text-2xl">
                              {benefit.title}
                            </p>
                          </div>
                          <Image
                            className={`h-full w-full transition duration-300 absolute inset-0 z-10 object-cover blur-[1px] ${
                              benefit.category === 'Notificações' 
                                ? 'object-[right_center]' 
                                : benefit.category === 'Segurança Avançada'
                                ? 'object-[center_right]'
                                : 'object-center'
                            }`}
                            src={benefit.image}
                            alt={benefit.title}
                            width={400}
                            height={300}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-800 py-12">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image
                src="/assets/leao.png"
                alt="NutzPay"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <span className="text-lg font-bold text-gray-900">nutzpay</span>
                <div className="text-xs text-red-500 font-medium uppercase tracking-wide">smart wins</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 NutzPay. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}