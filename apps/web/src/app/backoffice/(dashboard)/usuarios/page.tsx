'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, RefreshCw, Calendar, Eye, Check, X, FileText, Users, Building2 } from 'lucide-react';
import { ImpersonateButton } from '@/components/rbac/PermissionBased';
import { ActionButton, ShowForAdmins, ShowForOperations } from '@/components/rbac/PermissionBased';
import { ApprovalModal, RejectModal, RequestChangesModal } from '@/components/backoffice/ApprovalModals';

// Types
interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountType?: string;
  document?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    status: string;
    document: string;
  };
  dealSummary?: {
    totalVolume: number;
    activeDeals: number;
    lastDealDate?: string;
  };
  usdtWallet?: {
    balance: number;
    totalTransacted: number;
  };
}

interface Company {
  id: string;
  name: string;
  document: string;
  email: string;
  phone?: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
  counts: {
    users: number;
    apiKeys: number;
    webhooks: number;
  };
}

interface SellersResponse {
  sellers: Seller[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    blocked: number;
  };
}

interface CompaniesResponse {
  companies: Company[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    blocked: number;
  };
}

type TabType = 'users' | 'companies';

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users state
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    blocked: 0,
  });

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyStats, setCompanyStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    blocked: 0,
  });

  // Common state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal states
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [approvalModal, setApprovalModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [requestChangesModal, setRequestChangesModal] = useState(false);
  const [commonReasonCodes, setCommonReasonCodes] = useState<string[]>([]);
  const [commonChangeTypes, setCommonChangeTypes] = useState<string[]>([]);

  const fetchSellers = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (emailVerifiedFilter) params.append('emailVerified', emailVerifiedFilter);

      const response = await fetch(`/api/backoffice/sellers?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }

      const data: SellersResponse = await response.json();
      setSellers(data.sellers);
      setUserStats(data.stats);
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        hasNextPage: data.pagination.hasNextPage,
        hasPrevPage: data.pagination.hasPrevPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/backoffice/companies?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data: CompaniesResponse = await response.json();
      setCompanies(data.companies);
      setCompanyStats(data.stats);
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        hasNextPage: data.pagination.hasNextPage,
        hasPrevPage: data.pagination.hasPrevPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalData = async () => {
    try {
      const [reasonCodesRes, changeTypesRes] = await Promise.all([
        fetch('/api/backoffice/sellers/seller-001/reject', {
          credentials: 'include'
        }),
        fetch('/api/backoffice/sellers/seller-001/request-changes', {
          credentials: 'include'
        })
      ]);

      if (reasonCodesRes.ok) {
        const reasonData = await reasonCodesRes.json();
        setCommonReasonCodes(reasonData.commonReasonCodes || []);
      }

      if (changeTypesRes.ok) {
        const changeData = await changeTypesRes.json();
        setCommonChangeTypes(changeData.commonChangeTypes || []);
      }
    } catch (error) {
      console.error('Error fetching approval data:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchSellers();
    } else {
      fetchCompanies();
    }
    fetchApprovalData();
  }, [activeTab, searchTerm, statusFilter, roleFilter, emailVerifiedFilter, sortBy, sortOrder, pagination.currentPage]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('');
    setRoleFilter('');
    setEmailVerifiedFilter('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      BLOCKED: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const currentStats = activeTab === 'users' ? userStats : companyStats;

  if (loading && (sellers.length === 0 && companies.length === 0)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie usuários e empresas da plataforma
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Usuários</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Empresas</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {activeTab === 'users' ? (
                  <Users className="w-6 h-6 text-gray-600" />
                ) : (
                  <Building2 className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{currentStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-semibold text-green-600">{currentStats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-semibold text-yellow-600">{currentStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspensos</p>
                <p className="text-2xl font-semibold text-red-600">{currentStats.suspended}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bloqueados</p>
                <p className="text-2xl font-semibold text-gray-600">{currentStats.blocked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : 'empresas'}...`}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Todos os Status</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="PENDING">Pendente</option>
                  <option value="SUSPENDED">Suspenso</option>
                  <option value="BLOCKED">Bloqueado</option>
                </select>

                {activeTab === 'users' && (
                  <>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Todos os Roles</option>
                      <option value="USER">Usuário</option>
                      <option value="SELLER">Vendedor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>

                    <select
                      value={emailVerifiedFilter}
                      onChange={(e) => setEmailVerifiedFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Email Verificado</option>
                      <option value="true">Verificado</option>
                      <option value="false">Não Verificado</option>
                    </select>
                  </>
                )}

                <button
                  onClick={() => activeTab === 'users' ? fetchSellers() : fetchCompanies()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          /* Users Table */
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {seller.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                            <div className="text-sm text-gray-500">{seller.email}</div>
                            {seller.document && (
                              <div className="text-xs text-gray-400">{seller.document}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(seller.status)}`}>
                          {seller.status}
                        </span>
                        {!seller.emailVerified && (
                          <div className="text-xs text-red-500 mt-1">Email não verificado</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {seller.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {seller.lastLoginAt ? formatDate(seller.lastLoginAt) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(seller.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/backoffice/usuarios/${seller.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </Link>
                        <ShowForAdmins>
                          <ImpersonateButton userId={seller.id} />
                        </ShowForAdmins>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sellers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há usuários que correspondem aos filtros aplicados.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Companies Table */
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criada em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            <div className="text-sm text-gray-500">{company.email}</div>
                            <div className="text-xs text-gray-400">{company.document}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>{company.counts.users} usuários</span>
                          <span>{company.counts.apiKeys} API keys</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(company.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/backoffice/empresas/${company.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {companies.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há empresas que correspondem aos filtros aplicados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => activeTab === 'users' ? fetchSellers(pagination.currentPage - 1) : fetchCompanies(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => activeTab === 'users' ? fetchSellers(pagination.currentPage + 1) : fetchCompanies(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span>
                  {' '}até{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{pagination.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => activeTab === 'users' ? fetchSellers(pagination.currentPage - 1) : fetchCompanies(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                    if (pageNum <= pagination.totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => activeTab === 'users' ? fetchSellers(pageNum) : fetchCompanies(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.currentPage
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => activeTab === 'users' ? fetchSellers(pagination.currentPage + 1) : fetchCompanies(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {approvalModal && selectedSeller && (
          <ApprovalModal
            seller={selectedSeller}
            onClose={() => {
              setApprovalModal(false);
              setSelectedSeller(null);
            }}
            onSuccess={() => {
              fetchSellers();
              setApprovalModal(false);
              setSelectedSeller(null);
            }}
          />
        )}

        {rejectModal && selectedSeller && (
          <RejectModal
            seller={selectedSeller}
            onClose={() => {
              setRejectModal(false);
              setSelectedSeller(null);
            }}
            onSuccess={() => {
              fetchSellers();
              setRejectModal(false);
              setSelectedSeller(null);
            }}
            commonReasonCodes={commonReasonCodes}
          />
        )}

        {requestChangesModal && selectedSeller && (
          <RequestChangesModal
            seller={selectedSeller}
            onClose={() => {
              setRequestChangesModal(false);
              setSelectedSeller(null);
            }}
            onSuccess={() => {
              fetchSellers();
              setRequestChangesModal(false);
              setSelectedSeller(null);
            }}
            commonChangeTypes={commonChangeTypes}
          />
        )}

        {error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro</h3>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setError(null)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}