'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, RefreshCw, Calendar, Eye, Check, X, FileText } from 'lucide-react';
import { ImpersonateButton } from '@/components/rbac/PermissionBased';
import { ActionButton, ShowForAdmins, ShowForOperations } from '@/components/rbac/PermissionBased';
import { ApprovalModal, RejectModal, RequestChangesModal } from '@/components/backoffice/ApprovalModals';

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
    totalSellers: number;
    activeSellers: number;
    pendingSellers: number;
    suspendedSellers: number;
  };
}

interface ReasonCode {
  code: string;
  description: string;
}

export default function UsuariosPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState({
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    suspendedSellers: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Controle de filtros
  const [showFilters, setShowFilters] = useState(false);
  
  // Modais de aprovação
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; seller?: Seller }>({ isOpen: false });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; seller?: Seller }>({ isOpen: false });
  const [requestChangesModal, setRequestChangesModal] = useState<{ isOpen: boolean; seller?: Seller }>({ isOpen: false });
  
  // Dados dos modais
  const [reasonCodes, setReasonCodes] = useState<ReasonCode[]>([]);
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
      setStats(data.stats);
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        hasNextPage: data.pagination.hasNextPage,
        hasPrevPage: data.pagination.hasPrevPage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sellers');
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalData = async () => {
    try {
      const [reasonCodesRes, changeTypesRes] = await Promise.all([
        fetch('/api/backoffice/sellers/seller-001/reject', { 
          method: 'GET',
          credentials: 'include' 
        }),
        fetch('/api/backoffice/sellers/seller-001/request-changes', { 
          method: 'GET',
          credentials: 'include' 
        })
      ]);

      if (reasonCodesRes.ok) {
        const { reasonCodes } = await reasonCodesRes.json();
        setReasonCodes(reasonCodes);
      }

      if (changeTypesRes.ok) {
        const { commonChangeTypes } = await changeTypesRes.json();
        setCommonChangeTypes(commonChangeTypes);
      }
    } catch (err) {
      console.error('Error fetching approval data:', err);
    }
  };
  
  useEffect(() => {
    fetchSellers();
    fetchApprovalData();
  }, [searchTerm, statusFilter, roleFilter, emailVerifiedFilter, sortBy, sortOrder]);
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const handleApprovalSuccess = () => {
    fetchSellers(pagination.currentPage);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <RefreshCw className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Erro ao carregar dados
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={() => fetchSellers()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Usuários
        </h1>
        <p className="text-gray-600 mt-2">
          Gestão de sellers e aprovações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Suspensos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspendedSellers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, empresa..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="PENDING">Pendente</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="NEEDS_INFO">Precisa de Info</option>
            </select>
            
            <button
              onClick={() => fetchSellers()}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de Sellers
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? 'Carregando...' : `${pagination.total} sellers encontrados`}
              </p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Carregando sellers...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum seller encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('name')}
                  >
                    Seller
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('company.name')}
                  >
                    Empresa
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('createdAt')}
                  >
                    Cadastrado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {seller.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {seller.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {seller.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {seller.company?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(seller.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(seller.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <Link
                          href={`/backoffice/usuarios/${seller.id}`}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {seller.status === 'PENDING' && (
                          <ShowForOperations>
                            <>
                              <button
                                onClick={() => setApprovalModal({ isOpen: true, seller })}
                                className="text-red-600 hover:text-red-700"
                                title="Aprovar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => setRejectModal({ isOpen: true, seller })}
                                className="text-red-600 hover:text-red-700"
                                title="Reprovar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => setRequestChangesModal({ isOpen: true, seller })}
                                className="text-red-600 hover:text-red-700"
                                title="Solicitar ajustes"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          </ShowForOperations>
                        )}
                        
                        <ImpersonateButton
                          sellerUserId={seller.id}
                          sellerEmail={seller.email}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)} de{' '}
              {pagination.total} sellers
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchSellers(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchSellers(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modals */}
      {approvalModal.seller && (
        <ApprovalModal
          isOpen={approvalModal.isOpen}
          onClose={() => setApprovalModal({ isOpen: false })}
          sellerId={approvalModal.seller.id}
          sellerName={approvalModal.seller.name}
          sellerEmail={approvalModal.seller.email}
          onSuccess={handleApprovalSuccess}
        />
      )}

      {rejectModal.seller && (
        <RejectModal
          isOpen={rejectModal.isOpen}
          onClose={() => setRejectModal({ isOpen: false })}
          sellerId={rejectModal.seller.id}
          sellerName={rejectModal.seller.name}
          sellerEmail={rejectModal.seller.email}
          onSuccess={handleApprovalSuccess}
          reasonCodes={reasonCodes}
        />
      )}

      {requestChangesModal.seller && (
        <RequestChangesModal
          isOpen={requestChangesModal.isOpen}
          onClose={() => setRequestChangesModal({ isOpen: false })}
          sellerId={requestChangesModal.seller.id}
          sellerName={requestChangesModal.seller.name}
          sellerEmail={requestChangesModal.seller.email}
          onSuccess={handleApprovalSuccess}
          commonChangeTypes={commonChangeTypes}
        />
      )}
      </div>
    </div>
  );
}