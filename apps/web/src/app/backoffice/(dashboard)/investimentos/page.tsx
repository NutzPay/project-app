'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  duration: number;
  annualReturn: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  createdAt: string;
  investorsCount: number;
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface Investor {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  planId: string;
  planName: string;
  amount: number;
  startDate: string;
  endDate: string;
  minimumWithdrawDate: string;
  currentValue: number;
  totalReturns: number;
  lastCalculation: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  withdrawalRequests: number;
  paymentMethod: string;
  referralCode?: string;
}

interface InvestmentStats {
  totalPlans: number;
  activePlans: number;
  totalInvestors: number;
  activeInvestors: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  pendingWithdrawals: number;
  withdrawalRequests: number;
  avgReturnRate: number;
  monthlyGrowth: number;
  topPerformingPlan: string;
}

interface WithdrawalRequest {
  id: string;
  investorId: string;
  investorName: string;
  amount: number;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNotes?: string;
}

export default function InvestimentosPage() {
  const [stats, setStats] = useState<InvestmentStats | null>(null);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'last30' | 'last90' | 'thisyear'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'returns' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ) },
    { id: 'plans', label: 'Planos', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ) },
    { id: 'investors', label: 'Investidores', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ) },
    { id: 'withdrawals', label: 'Saques', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ) },
    { id: 'analytics', label: 'Análises', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ) },
  ];

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/backoffice/investments?period=${selectedPeriod}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match component interface
        const apiStats = data.stats;
        const transformedStats: InvestmentStats = {
          totalPlans: apiStats.plansAvailable,
          activePlans: apiStats.plansAvailable,
          totalInvestors: apiStats.investorsCount,
          activeInvestors: apiStats.activeInvestments,
          totalInvested: apiStats.totalInvested,
          totalCurrentValue: apiStats.totalCurrentValue || (apiStats.totalInvested + apiStats.totalYield),
          totalReturns: apiStats.totalYield,
          pendingWithdrawals: apiStats.withdrawalRequests || 0,
          withdrawalRequests: apiStats.withdrawalRequests || 0,
          avgReturnRate: apiStats.monthlyReturn,
          monthlyGrowth: apiStats.monthlyReturn,
          topPerformingPlan: data.plans.length > 0 ? data.plans[0].name : 'N/A'
        };
        
        // Transform plans data
        const transformedPlans: InvestmentPlan[] = data.plans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          minAmount: plan.minAmount,
          maxAmount: plan.maxAmount,
          duration: plan.durationDays,
          annualReturn: plan.dailyYieldRate * 365, // Convert daily to annual
          status: 'ACTIVE' as const,
          createdAt: new Date().toISOString(),
          investorsCount: plan.investorsCount,
          totalInvested: plan.totalInvested,
          currentValue: plan.totalInvested, // Simplified
          totalReturns: 0, // Would need more detailed calculation
          riskLevel: 'MEDIUM' as const
        }));

        setStats(transformedStats);
        setPlans(transformedPlans);
        
        // For now, keep investors and withdrawal requests empty since they're not in the API yet
        setInvestors([]);
        setWithdrawalRequests([]);
        
        console.log('✅ Backoffice data loaded successfully:', {
          stats: transformedStats,
          plansCount: transformedPlans.length
        });
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('❌ Error loading backoffice investment data:', error);
      // Fallback to empty data
      const emptyStats: InvestmentStats = {
        totalPlans: 0,
        activePlans: 0,
        totalInvestors: 0,
        activeInvestors: 0,
        totalInvested: 0,
        totalCurrentValue: 0,
        totalReturns: 0,
        pendingWithdrawals: 0,
        withdrawalRequests: 0,
        avgReturnRate: 0,
        monthlyGrowth: 0,
        topPerformingPlan: 'N/A'
      };
      
      setStats(emptyStats);
      setPlans([]);
      setInvestors([]);
      setWithdrawalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'DRAFT': return 'Rascunho';
      case 'WITHDRAWN': return 'Sacado';
      case 'PENDING': return 'Pendente';
      case 'EXPIRED': return 'Expirado';
      case 'CANCELLED': return 'Cancelado';
      case 'APPROVED': return 'Aprovado';
      case 'REJECTED': return 'Rejeitado';
      case 'COMPLETED': return 'Concluído';
      default: return status;
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelLabel = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Baixo';
      case 'MEDIUM': return 'Médio';
      case 'HIGH': return 'Alto';
      default: return risk;
    }
  };

  const calculateDaysUntilWithdraw = (withdrawDate: string) => {
    const today = new Date();
    const withdrawalDate = new Date(withdrawDate);
    const diffTime = withdrawalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getDateFilter = (date: string) => {
    const investmentDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - investmentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (filterDateRange) {
      case 'last30': return diffDays <= 30;
      case 'last90': return diffDays <= 90;
      case 'thisyear': return investmentDate.getFullYear() === now.getFullYear();
      case 'all': return true;
      default: return true;
    }
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.userPhone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || investor.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || investor.planName === filterPlan;
    const matchesDateRange = getDateFilter(investor.startDate);
    
    return matchesSearch && matchesStatus && matchesPlan && matchesDateRange;
  });

  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.userName.localeCompare(b.userName);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'returns':
        comparison = a.totalReturns - b.totalReturns;
        break;
      case 'date':
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || plan.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'amount':
        comparison = a.totalInvested - b.totalInvested;
        break;
      case 'returns':
        comparison = a.annualReturn - b.annualReturn;
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (checked: boolean, type: 'investors' | 'plans') => {
    if (checked) {
      if (type === 'investors') {
        setSelectedItems(sortedInvestors.map(item => item.id));
      } else {
        setSelectedItems(sortedPlans.map(item => item.id));
      }
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on items:`, selectedItems);
    // TODO: Implementar ações em massa
    setSelectedItems([]);
    setShowBulkActions(false);
  };

  const exportToCSV = (data: any[], filename: string) => {
    // TODO: Implementar exportação real
    console.log(`Exporting ${data.length} items to ${filename}.csv`);
    alert(`Exportação iniciada: ${filename}.csv (${data.length} registros)`);
  };

  const exportToPDF = (data: any[], filename: string) => {
    // TODO: Implementar exportação real
    console.log(`Exporting ${data.length} items to ${filename}.pdf`);
    alert(`Exportação iniciada: ${filename}.pdf (${data.length} registros)`);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão Completa de Investimentos</h1>
              <p className="mt-2 text-gray-600">
                Controle total de planos, investidores, saques e análises USDT
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="today">Hoje</option>
                <option value="week">7 Dias</option>
                <option value="month">30 Dias</option>
                <option value="quarter">3 Meses</option>
                <option value="year">1 Ano</option>
              </select>
              <button
                onClick={() => router.push('/backoffice/planos-investimento')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Novo Plano
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investido</p>
                <p className="text-2xl font-bold text-gray-900">{formatUSD(stats?.totalInvested || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Valor atual: {formatUSD(stats?.totalCurrentValue || 0)}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Investidores Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeInvestors || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {stats?.totalInvestors || 0} investidores
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Retorno Médio</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.avgReturnRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Crescimento mensal: {stats?.monthlyGrowth || 0}%
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Saques Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.withdrawalRequests || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Valor: {formatUSD(stats?.pendingWithdrawals || 0)}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'dashboard' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Quick Stats */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Executivo</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total de Retornos Gerados:</span>
                        <span className="font-semibold text-gray-900">{formatUSD(stats?.totalReturns || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Plano de Melhor Performance:</span>
                        <span className="font-semibold text-gray-900">{stats?.topPerformingPlan || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Planos Ativos:</span>
                        <span className="font-semibold text-gray-900">{stats?.activePlans || 0}/{stats?.totalPlans || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                    <div className="space-y-3">
                      <div className="text-center text-gray-500 text-sm py-8">
                        Nenhuma atividade recente
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance dos Investimentos</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">Gráfico de performance será exibido aqui</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Planos de Investimento</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar planos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-auto"
                      />
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>Filtros</span>
                      <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>Exportar</span>
                        <span className={`transform transition-transform ${showBulkActions ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      
                      {showBulkActions && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => exportToCSV(sortedPlans, 'planos-investimento')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Exportar como CSV
                            </button>
                            <button
                              onClick={() => exportToPDF(sortedPlans, 'planos-investimento')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Exportar como PDF
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => exportToCSV(sortedPlans.filter(p => p.status === 'ACTIVE'), 'planos-ativos')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Apenas Planos Ativos
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => router.push('/backoffice/planos-investimento')}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                    >
                      Novo Plano
                    </button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Todos</option>
                          <option value="ACTIVE">Ativos</option>
                          <option value="INACTIVE">Inativos</option>
                          <option value="DRAFT">Rascunhos</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nível de Risco</label>
                        <select
                          value={filterRisk}
                          onChange={(e) => setFilterRisk(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Todos</option>
                          <option value="LOW">Baixo</option>
                          <option value="MEDIUM">Médio</option>
                          <option value="HIGH">Alto</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ordenar por</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="name">Nome</option>
                          <option value="amount">Valor Investido</option>
                          <option value="returns">Retorno</option>
                          <option value="date">Data</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="desc">Decrescente</option>
                          <option value="asc">Crescente</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 gap-2">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                          setFilterRisk('all');
                          setSortBy('date');
                          setSortOrder('desc');
                        }}
                        className="px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
                      >
                        Limpar
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {sortedPlans.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-gray-500 text-sm mb-4">Nenhum plano de investimento cadastrado.</p>
                    <button
                      onClick={() => router.push('/backoffice/planos-investimento')}
                      className="px-4 py-2 text-gray-900 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                    >
                      Criar Primeiro Plano
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedPlans.map((plan) => (
                      <div key={plan.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                                {getStatusLabel(plan.status)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(plan.riskLevel)}`}>
                                Risco {getRiskLevelLabel(plan.riskLevel)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600">Investimento</p>
                            <p className="text-sm font-semibold">{formatUSD(plan.minAmount)} - {formatUSD(plan.maxAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Duração</p>
                            <p className="text-sm font-semibold">{plan.duration} dias</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Retorno Anual</p>
                            <p className="text-sm font-semibold">{plan.annualReturn}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Investidores</p>
                            <p className="text-sm font-semibold">{plan.investorsCount}</p>
                          </div>
                        </div>

                        <div className="border-t pt-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600">Total Investido</p>
                              <p className="text-sm font-semibold">{formatUSD(plan.totalInvested)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Valor Atual</p>
                              <p className="text-sm font-semibold">{formatUSD(plan.currentValue)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                            Editar
                          </button>
                          <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'investors' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Investidores</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por nome, email, telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-80"
                      />
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>Filtros Avançados</span>
                      <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>Exportar</span>
                        <span className={`transform transition-transform ${showBulkActions ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      
                      {showBulkActions && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => exportToCSV(sortedInvestors, 'investidores-completo')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              📄 Exportar Todos (CSV)
                            </button>
                            <button
                              onClick={() => exportToPDF(sortedInvestors, 'investidores-relatorio')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              📊 Relatório Completo (PDF)
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => exportToCSV(sortedInvestors.filter(i => i.status === 'ACTIVE'), 'investidores-ativos')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              ✅ Apenas Ativos
                            </button>
                            <button
                              onClick={() => exportToCSV(sortedInvestors.filter(i => i.withdrawalRequests > 0), 'pendentes-saque')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              💸 Com Saques Pendentes
                            </button>
                            {selectedItems.length > 0 && (
                              <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => exportToCSV(sortedInvestors.filter(i => selectedItems.includes(i.id)), 'investidores-selecionados')}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                >
                                  🎯 Selecionados ({selectedItems.length})
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advanced Filters for Investors */}
                {showAdvancedFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Todos</option>
                          <option value="ACTIVE">Ativos</option>
                          <option value="PENDING">Pendentes</option>
                          <option value="WITHDRAWN">Sacados</option>
                          <option value="EXPIRED">Expirados</option>
                          <option value="CANCELLED">Cancelados</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Plano</label>
                        <select
                          value={filterPlan}
                          onChange={(e) => setFilterPlan(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Todos os Planos</option>
                          <option value="Premium USDT">Premium USDT</option>
                          <option value="Standard USDT">Standard USDT</option>
                          <option value="Basic USDT">Basic USDT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
                        <select
                          value={filterDateRange}
                          onChange={(e) => setFilterDateRange(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Todo período</option>
                          <option value="last30">Últimos 30 dias</option>
                          <option value="last90">Últimos 90 dias</option>
                          <option value="thisyear">Este ano</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ordenar por</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="name">Nome</option>
                          <option value="amount">Valor Investido</option>
                          <option value="returns">Retorno</option>
                          <option value="date">Data de Início</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="desc">Decrescente</option>
                          <option value="asc">Crescente</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600">
                        {filteredInvestors.length} resultado{filteredInvestors.length !== 1 ? 's' : ''} encontrado{filteredInvestors.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                            setFilterPlan('all');
                            setFilterDateRange('all');
                            setSortBy('date');
                            setSortOrder('desc');
                          }}
                          className="px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
                        >
                          Limpar
                        </button>
                        <button
                          onClick={() => setShowAdvancedFilters(false)}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {filteredInvestors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Nenhum investidor encontrado.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {selectedItems.length > 0 && (
                      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-700">
                            {selectedItems.length} investidor{selectedItems.length !== 1 ? 'es' : ''} selecionado{selectedItems.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBulkAction('export')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Exportar Selecionados
                            </button>
                            <button
                              onClick={() => handleBulkAction('notify')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Notificar
                            </button>
                            <button
                              onClick={() => setSelectedItems([])}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              <input
                                type="checkbox"
                                checked={selectedItems.length === sortedInvestors.length && sortedInvestors.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked, 'investors')}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Investidor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Plano & Progresso
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Investimento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Retorno
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Datas
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedInvestors.map((investor) => (
                            <tr key={investor.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(investor.id)}
                                  onChange={(e) => handleSelectItem(investor.id, e.target.checked)}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{investor.userName}</div>
                                  <div className="text-sm text-gray-500">{investor.userEmail}</div>
                                  {investor.userPhone && (
                                    <div className="text-sm text-gray-500">{investor.userPhone}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{investor.planName}</div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                      className="bg-red-600 h-2 rounded-full"
                                      style={{ width: `${calculateProgress(investor.startDate, investor.endDate)}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {Math.round(calculateProgress(investor.startDate, investor.endDate))}% concluído
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{formatUSD(investor.amount)}</div>
                                  <div className="text-sm text-gray-500">Valor atual: {formatUSD(investor.currentValue)}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{formatUSD(investor.totalReturns)}</div>
                                  <div className="text-sm text-gray-500">
                                    {((investor.currentValue - investor.amount) / investor.amount * 100).toFixed(2)}%
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm text-gray-900">Início: {formatDate(investor.startDate)}</div>
                                  <div className="text-sm text-gray-500">Fim: {formatDate(investor.endDate)}</div>
                                  <div className="text-xs text-gray-500">
                                    Saque: {formatDate(investor.minimumWithdrawDate)}
                                  </div>
                                  {calculateDaysUntilWithdraw(investor.minimumWithdrawDate) > 0 && (
                                    <div className="text-xs text-blue-600">
                                      {calculateDaysUntilWithdraw(investor.minimumWithdrawDate)} dias restantes
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(investor.status)}`}>
                                  {getStatusLabel(investor.status)}
                                </span>
                                {investor.withdrawalRequests > 0 && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    {investor.withdrawalRequests} saque(s) pendente(s)
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-1">
                                  <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                    Ver
                                  </button>
                                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                    Editar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Solicitações de Saque</h3>
                  <div className="flex gap-3">
                    <button className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      Filtros
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>Exportar</span>
                        <span className={`transform transition-transform ${showBulkActions ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      
                      {showBulkActions && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => exportToCSV(withdrawalRequests, 'solicitacoes-saque')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              📄 Todas Solicitações (CSV)
                            </button>
                            <button
                              onClick={() => exportToPDF(withdrawalRequests, 'relatorio-saques')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              📊 Relatório de Saques (PDF)
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => exportToCSV(withdrawalRequests.filter(r => r.status === 'PENDING'), 'saques-pendentes')}
                              className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                            >
                              ⏳ Apenas Pendentes
                            </button>
                            <button
                              onClick={() => exportToCSV(withdrawalRequests.filter(r => r.status === 'APPROVED'), 'saques-aprovados')}
                              className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              ✅ Apenas Aprovados
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {withdrawalRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Nenhuma solicitação de saque pendente.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Investidor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data Solicitação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {withdrawalRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{request.investorName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{formatUSD(request.amount)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDateTime(request.requestDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                  {getStatusLabel(request.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-1">
                                  <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                                    Aprovar
                                  </button>
                                  <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                                    Rejeitar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Análises Avançadas</h3>
                  <div className="flex gap-3">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Últimos 30 dias</option>
                      <option>Últimos 90 dias</option>
                      <option>Último ano</option>
                      <option>Desde o início</option>
                    </select>
                    <button className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      Exportar Relatório
                    </button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">ROI Médio</p>
                        <p className="text-2xl font-bold text-gray-900">12.5%</p>
                        <p className="text-sm text-gray-500">+2.1% vs mês anterior</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Taxa de Retenção</p>
                        <p className="text-2xl font-bold text-gray-900">87.3%</p>
                        <p className="text-sm text-gray-500">+5.2% vs mês anterior</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                        <p className="text-2xl font-bold text-gray-900">180 dias</p>
                        <p className="text-sm text-gray-500">Duração dos investimentos</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Investment Growth Chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Crescimento dos Investimentos</h4>
                      <div className="flex space-x-2">
                        <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Valor</button>
                        <button className="px-2 py-1 text-xs text-gray-500 rounded hover:bg-gray-100">Volume</button>
                      </div>
                    </div>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      {/* Simulated Line Chart */}
                      <svg className="w-full h-full absolute inset-0 p-4" viewBox="0 0 400 200">
                        <polyline
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="3"
                          points="20,150 60,140 100,120 140,110 180,100 220,85 260,70 300,60 340,45 380,35"
                          className="drop-shadow-sm"
                        />
                        <circle cx="20" cy="150" r="4" fill="#DC2626" />
                        <circle cx="380" cy="35" r="4" fill="#DC2626" />
                        
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        +85% este mês
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Distribution Chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-4">Distribuição por Risco</h4>
                    <div className="h-64 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        {/* Simulated Donut Chart */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="60" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
                          <circle cx="100" cy="100" r="60" fill="none" stroke="#10B981" strokeWidth="20"
                                  strokeDasharray="157 314" strokeDashoffset="0"/>
                          <circle cx="100" cy="100" r="60" fill="none" stroke="#F59E0B" strokeWidth="20"
                                  strokeDasharray="94 314" strokeDashoffset="-157"/>
                          <circle cx="100" cy="100" r="60" fill="none" stroke="#EF4444" strokeWidth="20"
                                  strokeDasharray="63 314" strokeDashoffset="-251"/>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">100%</p>
                            <p className="text-sm text-gray-500">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Baixo Risco</span>
                        </div>
                        <span className="text-sm font-medium">50%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Médio Risco</span>
                        </div>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Alto Risco</span>
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold mb-4">Performance por Plano</h4>
                      <div className="space-y-4">
                        {/* Plan Performance Bars */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Plano Premium USDT</span>
                              <span className="text-sm text-green-600 font-semibold">+15.2%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatUSD(125000)} investido</span>
                              <span>85% performance</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Plano Standard USDT</span>
                              <span className="text-sm text-green-600 font-semibold">+12.8%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{width: '76%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatUSD(89000)} investido</span>
                              <span>76% performance</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Plano Basic USDT</span>
                              <span className="text-sm text-green-600 font-semibold">+8.5%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full" style={{width: '62%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatUSD(45000)} investido</span>
                              <span>62% performance</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold mb-4">Top Métricas</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Melhor Plano</p>
                              <p className="text-xs text-gray-600">Premium USDT</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-green-600">15.2%</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Maior Volume</p>
                              <p className="text-xs text-gray-600">Premium USDT</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{formatUSD(125000)}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Mais Popular</p>
                              <p className="text-xs text-gray-600">Standard USDT</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-purple-600">45 investidores</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trends and Insights */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Insights e Tendências</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <h5 className="font-medium text-gray-900">Crescimento Acelerado</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Os investimentos cresceram 85% no último mês, superando a meta de 60%.</p>
                      <div className="text-xs text-gray-600 font-medium">Tendência positiva</div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h5 className="font-medium text-gray-900">Alta Retenção</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">87% dos investidores renovaram seus planos, indicando alta satisfação.</p>
                      <div className="text-xs text-gray-600 font-medium">Excelente performance</div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h5 className="font-medium text-gray-900">Diversificação</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Considere aumentar opções de médio risco para balancear o portfólio.</p>
                      <div className="text-xs text-gray-600 font-medium">Recomendação</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}