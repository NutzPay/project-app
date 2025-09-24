'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Shield, Mail, Calendar, Globe, DollarSign, TrendingUp, Key, Webhook, Activity, AlertTriangle, Edit, History, Clock, User } from 'lucide-react';
import { ImpersonateButton } from '@/components/rbac/PermissionBased';
import { EditSellerModal } from '@/components/backoffice/EditSellerModal';
import { EditSellerProfileModal } from '@/components/backoffice/EditSellerProfileModal';

interface SellerDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountType?: string;
  document?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  // Fee Configuration
  exchangeRateFeePercent?: number;
  exchangeRateFeeFixed?: number;
  pixPayinFeePercent?: number;
  pixPayinFeeFixed?: number;
  pixPayoutFeePercent?: number;
  pixPayoutFeeFixed?: number;
  manualWithdrawFeePercent?: number;
  manualWithdrawFeeFixed?: number;
  usdtPurchaseFeePercent?: number;
  usdtPurchaseFeeFixed?: number;
  company?: {
    id: string;
    name: string;
    status: string;
    document: string;
    email: string;
    planId?: string;
    subscriptionId?: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    createdAt: string;
  };
  dealSummary: {
    totalVolume: number;
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    cancelledDeals: number;
    lastDealDate?: string;
    averageDealSize: number;
    topCategories: Array<{
      category: string;
      volume: number;
      count: number;
    }>;
  };
  usdtWallet?: {
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalTransacted: number;
    lastTransactionDate?: string;
    walletAddress?: string;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    keyPreview: string;
    status: string;
    lastUsedAt?: string;
    createdAt: string;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    lastTriggeredAt?: string;
    createdAt: string;
  }>;
  activitySummary: {
    totalLogins: number;
    lastLoginDaysAgo: number;
    averageSessionDuration: number;
    mostUsedFeatures: string[];
  };
  riskAnalysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    lastReviewDate: string;
  };
}

export default function SellerDetailPage({ params }: { params: { id: string } }) {
  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const fetchSeller = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/backoffice/sellers/${params.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Seller não encontrado');
        }
        throw new Error('Erro ao carregar dados do seller');
      }
      
      const data = await response.json();
      setSeller(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Error fetching seller:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAuditHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/backoffice/sellers/${params.id}/audit-history?limit=10`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit history');
      }

      const data = await response.json();
      if (data.success) {
        setAuditHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching audit history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSeller();
    fetchAuditHistory();
  }, [params.id]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {status}
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {riskLevel === 'LOW' ? 'Baixo' : riskLevel === 'MEDIUM' ? 'Médio' : 'Alto'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
            <AlertTriangle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Erro ao carregar dados
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-6 space-x-3">
            <button
              onClick={fetchSeller}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </button>
            <Link
              href="/backoffice/usuarios"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/backoffice/usuarios"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {seller.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {seller.email} • {seller.role}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(seller.status)}
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Taxas
            </button>
            <ImpersonateButton
              sellerUserId={seller.id}
              sellerEmail={seller.email}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Fee Configuration - if seller has fee data */}
          {(seller.exchangeRateFeePercent !== undefined || seller.exchangeRateFeeFixed !== undefined || seller.pixPayinFeePercent !== undefined || seller.pixPayoutFeePercent !== undefined) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuração de Taxas
                </h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {seller.exchangeRateFeePercent !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Câmbio - Percentual</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(seller.exchangeRateFeePercent * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {seller.exchangeRateFeeFixed !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Câmbio - Taxa Fixa</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {seller.exchangeRateFeeFixed}</dd>
                    </div>
                  )}
                  {seller.pixPayinFeePercent !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PIX Pay-in - Percentual</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(seller.pixPayinFeePercent * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {seller.pixPayinFeeFixed !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PIX Pay-in - Taxa Fixa</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {seller.pixPayinFeeFixed}</dd>
                    </div>
                  )}
                  {seller.pixPayoutFeePercent !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PIX Pay-out - Percentual</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(seller.pixPayoutFeePercent * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {seller.pixPayoutFeeFixed !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PIX Pay-out - Taxa Fixa</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {seller.pixPayoutFeeFixed}</dd>
                    </div>
                  )}
                  {seller.manualWithdrawFeePercent !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Saque Manual - Percentual</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(seller.manualWithdrawFeePercent * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {seller.manualWithdrawFeeFixed !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Saque Manual - Taxa Fixa</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {seller.manualWithdrawFeeFixed}</dd>
                    </div>
                  )}
                  {seller.usdtPurchaseFeePercent !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Compra USDT - Percentual</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{(seller.usdtPurchaseFeePercent * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {seller.usdtPurchaseFeeFixed !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Compra USDT - Taxa Fixa</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">R$ {seller.usdtPurchaseFeeFixed}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Dados Cadastrais */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dados Cadastrais
              </h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome Completo</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                    <Mail className="w-4 h-4 mr-1" />
                    {seller.email}
                    {seller.emailVerified && <span className="ml-2 text-gray-500 dark:text-gray-400">✓</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.document || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Conta</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.accountType || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Cadastro</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900 dark:text-white">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(seller.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Login</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {seller.lastLoginAt ? formatDate(seller.lastLoginAt) : 'Nunca'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Empresa */}
          {seller.company && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informações da Empresa
                </h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome da Empresa</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.company.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CNPJ</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.company.document}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status da Empresa</dt>
                    <dd className="mt-1">{getStatusBadge(seller.company.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Corporativo</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{seller.company.email}</dd>
                  </div>
                  {seller.company.monthlyLimit && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Limite Mensal</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(seller.company.monthlyLimit)}
                      </dd>
                    </div>
                  )}
                  {seller.company.dailyLimit && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Limite Diário</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(seller.company.dailyLimit)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Resumo de Deals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resumo de Deals
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seller.dealSummary.totalDeals}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seller.dealSummary.activeDeals}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seller.dealSummary.completedDeals}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seller.dealSummary.cancelledDeals}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Cancelados</div>
                </div>
              </div>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume Total</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(seller.dealSummary.totalVolume)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Médio</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(seller.dealSummary.averageDealSize)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Deal</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {seller.dealSummary.lastDealDate ? formatDate(seller.dealSummary.lastDealDate) : 'Nenhum deal'}
                  </dd>
                </div>
              </dl>

              {/* Top Categories */}
              {seller.dealSummary.topCategories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Principais Categorias
                  </h3>
                  <div className="space-y-2">
                    {seller.dealSummary.topCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900 dark:text-white">{category.category}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(category.volume)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {category.count} deals
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* USDT Wallet */}
          {seller.usdtWallet && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Carteira USDT
                </h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Atual</dt>
                    <dd className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      ${seller.usdtWallet.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transacionado</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      ${seller.usdtWallet.totalTransacted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Depositado</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      ${seller.usdtWallet.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sacado</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      ${seller.usdtWallet.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                    </dd>
                  </div>
                  {seller.usdtWallet.walletAddress && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Endereço da Carteira</dt>
                      <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                        {seller.usdtWallet.walletAddress}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Análise de Risco */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Análise de Risco
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nível de Risco</span>
                  {getRiskBadge(seller.riskAnalysis.riskLevel)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Última revisão: {formatDate(seller.riskAnalysis.lastReviewDate)}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Fatores</h3>
                <ul className="space-y-1">
                  {seller.riskAnalysis.factors.map((factor, index) => (
                    <li key={index} className="text-sm text-gray-900 dark:text-white flex items-start">
                      <span className="text-gray-500 dark:text-gray-400 mr-2">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Resumo de Atividade */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Atividade
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Logins</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {seller.activitySummary.totalLogins}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Atividade</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {seller.activitySummary.lastLoginDaysAgo === 0 ? 'Hoje' : 
                   `${seller.activitySummary.lastLoginDaysAgo} dias atrás`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duração Média da Sessão</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {seller.activitySummary.averageSessionDuration} minutos
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Features Mais Usadas</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-1">
                    {seller.activitySummary.mostUsedFeatures.map((feature, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Chaves API ({seller.apiKeys.length})
              </h2>
            </div>
            <div className="p-6">
              {seller.apiKeys.length > 0 ? (
                <div className="space-y-3">
                  {seller.apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {apiKey.name}
                        </div>
                        {getStatusBadge(apiKey.status)}
                      </div>
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                        {apiKey.keyPreview}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Última utilização: {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Nunca'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma chave API configurada</p>
                </div>
              )}
            </div>
          </div>

          {/* Webhooks */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Webhooks ({seller.webhooks.length})
              </h2>
            </div>
            <div className="p-6">
              {seller.webhooks.length > 0 ? (
                <div className="space-y-3">
                  {seller.webhooks.map((webhook) => (
                    <div key={webhook.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-xs text-gray-900 dark:text-white break-all">
                          {webhook.url}
                        </div>
                        {getStatusBadge(webhook.status)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Eventos: {webhook.events.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Último trigger: {webhook.lastTriggeredAt ? formatDate(webhook.lastTriggeredAt) : 'Nunca'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum webhook configurado</p>
                </div>
              )}
            </div>
          </div>

          {/* Audit History Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2" />
                Histórico de Alterações
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Registro de todas as modificações feitas nos dados do seller
              </p>
            </div>
            <div className="p-6">
              {loadingHistory ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Carregando histórico...</p>
                </div>
              ) : auditHistory.length > 0 ? (
                <div className="space-y-4">
                  {auditHistory.map((log) => (
                    <div key={log.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.adminUser?.name || log.adminUser?.email || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {log.adminUser?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {log.description}
                      </p>

                      {log.changes && log.changes.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                            Alterações realizadas:
                          </p>
                          <div className="space-y-1">
                            {log.changes.map((change: any, index: number) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {change.field}:
                                </span>
                                <span className="text-red-600 dark:text-red-400 ml-1">
                                  {change.oldValue}
                                </span>
                                <span className="text-gray-500 mx-1">→</span>
                                <span className="text-green-600 dark:text-green-400">
                                  {change.newValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-400">
                        IP: {log.ipAddress}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma alteração registrada ainda
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    As mudanças feitas nos dados do seller aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      {showEditModal && (
        <EditSellerModal
          seller={seller}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchSeller();
            fetchAuditHistory();
          }}
        />
      )}

      {showEditProfileModal && (
        <EditSellerProfileModal
          seller={seller}
          onClose={() => setShowEditProfileModal(false)}
          onSuccess={() => {
            fetchSeller();
            fetchAuditHistory();
          }}
        />
      )}
    </div>
  );
}