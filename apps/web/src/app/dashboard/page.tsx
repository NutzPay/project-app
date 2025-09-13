'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import Preloader from '@/components/ui/Preloader';
import USDTInvestmentCard from '@/components/ui/USDTInvestmentCard';
import WithdrawalModal from '@/components/modals/WithdrawalModal';
import DepositModal from '@/components/modals/DepositModal';
import ExchangeModal from '@/components/modals/ExchangeModal';
import { formatBRL, formatCrypto, formatCompactCurrency } from '@/lib/currency';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  usdtBalance: number;
  pixBalance: number;
  brlEquivalent: number;
  conversionRate: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showUSDTBalance, setShowUSDTBalance] = useState(false);
  const [showInvestment, setShowInvestment] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    volume24h: 0
  });
  const [banners, setBanners] = useState([
    {
      id: '1',
      title: 'Nova API de Pagamentos',
      subtitle: 'Conheça a integração mais rápida para sellers',
      ctaText: 'Acessar',
      imagePath: 'luxa.png',
      targetUrl: 'https://nutzpay.com/api',
      audience: 'SELLER',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: '2',
      title: 'Taxas Especiais no Pix',
      subtitle: 'Condições diferenciadas para aumentar suas vendas',
      ctaText: 'Ver mais',
      imagePath: 'newyork.png',
      targetUrl: 'https://nutzpay.com/pix-especial',
      audience: 'SELLER',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: '3',
      title: 'Gaming Experience',
      subtitle: 'Plataforma otimizada para gamers e influenciadores',
      ctaText: 'Explorar',
      imagePath: 'gamer.png',
      targetUrl: 'https://nutzpay.com/gamer',
      audience: 'ALL',
      sortOrder: 3,
      isActive: true,
    },
  ]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const result = await response.json();

        if (result.success) {
          setUserProfile(result.profile);
        } else {
          console.error('Error loading profile:', result.error);
          // If not authenticated, redirect to login
          if (result.code === 'UNAUTHORIZED') {
            window.location.href = '/auth/login';
            return;
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadRecentTransactions = async () => {
      try {
        const response = await fetch('/api/transactions/recent');
        const result = await response.json();
        
        if (result.success) {
          setRecentTransactions(result.transactions);
        }
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
        setRecentTransactions([]);
      }
    };

    const loadDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        
        if (result.success) {
          setDashboardStats(result.stats);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    loadUserProfile();
    loadRecentTransactions();
    loadDashboardStats();
  }, []);

  useEffect(() => {
    // Load banners from localStorage (admin integration)
    const loadBanners = () => {
      const savedOffers = localStorage.getItem('nutzpay-banners');
      if (savedOffers) {
        const parsedOffers = JSON.parse(savedOffers);
        const activeBanners = parsedOffers
          .filter((banner: any) => banner.isActive)
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
        setBanners(activeBanners.length > 0 ? activeBanners : banners);
      }
    };
    
    loadBanners();
    
    // Listen for admin updates
    window.addEventListener('storage', loadBanners);
    window.addEventListener('bannersUpdated', loadBanners);
    
    return () => {
      window.removeEventListener('storage', loadBanners);
      window.removeEventListener('bannersUpdated', loadBanners);
    };
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const bannerInterval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
        setImageLoaded(false); // Reset image loaded state when banner changes
      }, 8000);
      return () => clearInterval(bannerInterval);
    }
  }, [banners.length]);

  // Função para reformatar descrições de transações XGate
  const formatTransactionDescription = (description: string) => {
    if (description?.includes('XGate payment:')) {
      // Regex para capturar valores no formato "R$ 5.97 → 1.043212 USDT"
      const match = description.match(/XGate payment: R\$ ([\d.]+) → ([\d.]+) USDT/);
      if (match) {
        const brlValue = parseFloat(match[1]);
        const usdtValue = parseFloat(match[2]);
        return `XGate payment: ${formatBRL(brlValue)} → ${formatCrypto(usdtValue, 'USDT', { maximumFractionDigits: 2 })}`;
      }
    }
    return description;
  };

  if (isLoading) {
    return <Preloader />;
  }

  const currentBannerData = banners[currentBanner];

  return (
    <DashboardLayout 
      userType="standard" // Não usado mais, configuração única
      onWithdrawClick={() => {
        console.log('Dashboard: Opening withdrawal modal');
        setShowWithdrawalModal(true);
      }}
    >
      {/* Saldo Principal - Primeiro Item */}
      <div className={`relative rounded-2xl p-4 mb-6 overflow-hidden transition-all duration-700 ${
        showUSDTBalance 
          ? 'bg-gradient-to-br from-blue-700 via-red-700 to-slate-800' 
          : 'bg-gradient-to-br from-red-600 via-red-700 to-red-800'
      }`}>
        
        {/* Background Effects - Brazilian vs USA theme */}
        {!showUSDTBalance ? (
          // Brazilian theme effects
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
          </>
        ) : (
          // USA theme effects (subtle)
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-400/15 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
            {/* Subtle stars pattern */}
            <div className="absolute top-3 left-4 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-6 left-8 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-4 right-6 w-1 h-1 bg-white/25 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-8 right-12 w-1 h-1 bg-white/15 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </>
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">Saldo Disponível</h3>
              <p className="text-red-100 text-xs">
                {showUSDTBalance ? 'Fundos disponíveis em cripto' : 'Fundos para operações PIX'}
              </p>
            </div>
            <button
              onClick={() => setShowUSDTBalance(!showUSDTBalance)}
              className={`text-xs backdrop-blur-sm text-white border px-2 py-1.5 rounded-lg transition-all duration-500 flex items-center space-x-1 ${
                showUSDTBalance 
                  ? 'bg-blue-800/40 hover:bg-blue-700/50 border-blue-400/40 hover:border-blue-300/50' 
                  : 'bg-white/20 hover:bg-white/30 border-white/30'
              }`}
            >
              <span>{showUSDTBalance ? '🇧🇷 PIX' : '🇺🇸 USDT'}</span>
            </button>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-white mb-1">
              {showUSDTBalance 
                ? formatCrypto(userProfile?.usdtBalance || 0, 'USDT', { maximumFractionDigits: 2 })
                : formatBRL(userProfile?.pixBalance || 0)
              }
            </div>
            <p className="text-red-100 text-xs">
              {showUSDTBalance 
                ? `≈ ${formatBRL(userProfile?.brlEquivalent || 0)} • USD Wallet`
                : userProfile?.name ? `Olá, ${userProfile.name.split(' ')[0]}! • Carteira PIX` : ''
              }
            </p>
          </div>

          {/* Action Buttons - Compactos no mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => {
                console.log('Dashboard button: Opening withdrawal modal');
                setShowWithdrawalModal(true);
              }}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg text-white text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs sm:text-sm">Sacar</span>
            </button>
            
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg text-white text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs sm:text-sm">Depositar</span>
            </button>

            <button
              onClick={() => setShowExchangeModal(true)}
              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg text-white text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-xs sm:text-sm">Trocar</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIX Stats Compacto */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-black mb-4">Estatísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Concluídas</p>
            <p className="text-xl font-bold text-black">{dashboardStats.completed.toLocaleString('pt-BR')}</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Pendentes</p>
            <p className="text-xl font-bold text-black">{dashboardStats.pending.toLocaleString('pt-BR')}</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Falhas</p>
            <p className="text-xl font-bold text-black">{dashboardStats.failed.toLocaleString('pt-BR')}</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Volume (24h)</p>
            <p className="text-xl font-bold text-black">{formatCompactCurrency(dashboardStats.volume24h, 'BRL')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Banner Promocional com Background */}
          {currentBannerData && (
            <div 
              className="relative h-48 md:h-56 overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-all duration-1000 hover:shadow-xl group"
              onClick={() => window.open(currentBannerData.targetUrl, '_blank')}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={currentBannerData.imagePath.startsWith('http') 
                    ? currentBannerData.imagePath 
                    : `/banners/${currentBannerData.imagePath}`
                  }
                  alt={currentBannerData.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 object-center md:object-[center_30%]"
                  onLoad={(e) => {
                    console.log('Image loaded successfully:', currentBannerData.imagePath);
                    setImageLoaded(true);
                    // Hide fallback gradient when image loads
                    const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-gradient');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'none';
                    }
                  }}
                  onError={(e) => {
                    console.log('Image failed to load:', currentBannerData.imagePath);
                    // Show fallback gradient when image fails
                    const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-gradient');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'block';
                    }
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {/* Fallback Gradient */}
                <div className="fallback-gradient absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800" style={{display: 'none'}}></div>
              </div>

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
              
              {/* Diagonal Pattern Overlay */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,0 L100,0 L80,100 L0,100 Z" fill="white" />
                </svg>
              </div>
              
              <div className="relative h-full p-6 md:p-8 flex flex-col justify-between">
                {/* Header with Dots */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      DESTAQUE
                    </span>
                  </div>
                  
                  {/* Navigation Dots */}
                  <div className="flex items-center space-x-2">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentBanner(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentBanner ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                    {currentBannerData.title}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base mb-4 max-w-md leading-relaxed">
                    {currentBannerData.subtitle}
                  </p>
                  
                  <div className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 group-hover:scale-105">
                    <span>{currentBannerData.ctaText}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}

          {/* USDT Investment + Quote Integrated Card */}
          <USDTInvestmentCard 
            userBalance={userProfile?.usdtBalance || 0}
            onInvestmentSuccess={() => {
              loadUserProfile();
              loadDashboardStats();
            }}
          />

          {/* Transações Recentes */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl font-bold text-black">Transações Recentes</h3>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                Ver todas
              </button>
            </div>

            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhuma transação encontrada</p>
                </div>
              ) : (
                recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-start justify-between py-3 px-2 sm:px-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-black text-sm leading-relaxed">
                        {txn.type === 'INVESTMENT' 
                          ? `Aplicação em ${txn.planName || 'USDT'}`
                          : formatTransactionDescription(txn.description) || 'Transação PIX'
                        }
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          txn.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {txn.status === 'COMPLETED' ? 'Concluída' :
                           txn.status === 'PENDING' ? 'Pendente' : 'Falhou'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-black text-sm whitespace-nowrap">
                      {txn.type === 'INVESTMENT' 
                        ? formatCrypto(Number(txn.amount), 'USDT')
                        : formatBRL(txn.brlAmount ? Number(txn.brlAmount) : Number(txn.amount))
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(txn.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informativos */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-bold text-black text-sm">Informativos</h4>
            </div>
            <div className="space-y-1">
              <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-red-500">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Nova API de Pagamentos</h5>
                    <p className="text-xs text-gray-600 mt-1">Integração mais rápida para sellers</p>
                    <span className="text-xs text-red-600 font-medium">Ver mais →</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-black">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Taxas Especiais PIX</h5>
                    <p className="text-xs text-gray-600 mt-1">Condições diferenciadas este mês</p>
                    <span className="text-xs text-gray-800 font-medium">Ver detalhes →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-bold text-black text-sm">Ferramentas do Desenvolvedor</h4>
            </div>
            <div className="space-y-1">
              <a 
                href="/docs"
                className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-red-600"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Documentação da API</h5>
                    <p className="text-xs text-gray-600 mt-1">Guia completo de integração e webhooks</p>
                  </div>
                </div>
              </a>
              <a 
                href="/dashboard/api-keys"
                className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-black"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Chaves API</h5>
                    <p className="text-xs text-gray-600 mt-1">Gerencie suas chaves de integração</p>
                    <span className="text-xs text-black font-medium">Configurar →</span>
                  </div>
                </div>
              </a>
              
              <a 
                href="/dashboard/webhooks"
                className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-gray-400"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Webhooks</h5>
                    <p className="text-xs text-gray-600 mt-1">Configure notificações automáticas</p>
                    <span className="text-xs text-gray-800 font-medium">Ver webhooks →</span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* System Tools */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-bold text-black text-sm">Sistema</h4>
            </div>
            <div>
              <a 
                href="/dashboard/audit"
                className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-red-500"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black text-sm">Logs & Auditoria</h5>
                    <p className="text-xs text-gray-600 mt-1">Monitore atividades e eventos</p>
                    <span className="text-xs text-red-600 font-medium">Ver logs →</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal 
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
      {/* Exchange Modal */}
      <ExchangeModal 
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={() => {
          // Atualizar saldo após câmbio bem-sucedido
          loadUserProfile();
          loadDashboardStats();
        }}
      />
    </DashboardLayout>
  );
}