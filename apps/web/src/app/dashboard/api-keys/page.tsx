'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface AuthorizedIP {
  id: string;
  ipAddress: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    prefix: 'ntz_live_',
    scopes: ['payments:read', 'payments:write', 'webhooks:read'],
    status: 'ACTIVE',
    lastUsedAt: '2025-08-20T10:30:00Z',
    createdAt: '2025-07-15T14:20:00Z',
  }
];

export default function ApiKeysPage() {
  const [activeTab, setActiveTab] = useState('keys');
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  
  // Authorized IPs state
  const [authorizedIPs, setAuthorizedIPs] = useState<AuthorizedIP[]>([]);
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAddingIP, setIsAddingIP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadApiKeys(),
      fetchAuthorizedIPs()
    ]);
    setLoading(false);
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const result = await response.json();
      
      if (result.success) {
        setApiKeys(result.keys);
      } else {
        setApiKeys(mockApiKeys);
      }
    } catch (error) {
      console.error('Erro ao carregar chaves API:', error);
      setApiKeys(mockApiKeys);
    }
  };

  const fetchAuthorizedIPs = async () => {
    try {
      const response = await fetch('/api/admin/authorized-ips');
      if (response.ok) {
        const data = await response.json();
        setAuthorizedIPs(data.ips || []);
      }
    } catch (error) {
      console.error('Error fetching authorized IPs:', error);
    }
  };

  const addAuthorizedIP = async () => {
    if (!newIP.trim()) return;

    setIsAddingIP(true);
    try {
      const response = await fetch('/api/admin/authorized-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipAddress: newIP,
          description: newDescription,
        }),
      });

      if (response.ok) {
        setNewIP('');
        setNewDescription('');
        fetchAuthorizedIPs();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding IP:', error);
      alert('Erro ao adicionar IP');
    } finally {
      setIsAddingIP(false);
    }
  };

  const toggleIPStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/authorized-ips/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchAuthorizedIPs();
      }
    } catch (error) {
      console.error('Error toggling IP status:', error);
    }
  };

  const removeIP = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este IP?')) return;

    try {
      const response = await fetch(`/api/admin/authorized-ips/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAuthorizedIPs();
      }
    } catch (error) {
      console.error('Error removing IP:', error);
    }
  };

  const validateIP = (ip: string) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'REVOKED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Configure chaves de API e IPs autorizados para operações seguras. Monitore entregas, falhas e configure retry automático.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('keys')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'keys'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chaves API
            </button>
            <button
              onClick={() => setActiveTab('ips')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ips'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              IPs Autorizados
            </button>
          </nav>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Chaves API</h2>
                <p className="text-gray-600">Gerencie suas chaves de API para integração</p>
              </div>
              <button
                onClick={() => setShowCreateKeyModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + Nova Chave
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma chave API</h3>
                  <p className="text-gray-500">Comece criando uma nova chave API para integração.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-gray-900 font-medium">{apiKey.name}</h3>
                              <p className="text-gray-500 font-mono text-sm">
                                {apiKey.prefix}••••••••••••••••
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {apiKey.scopes.map((scope, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Criada em {formatDate(apiKey.createdAt)}
                            {apiKey.lastUsedAt && (
                              <span className="ml-4">
                                Último uso: {formatDate(apiKey.lastUsedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              apiKey.status
                            )}`}
                          >
                            {apiKey.status}
                          </span>
                          <div className="flex space-x-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              Rotacionar
                            </button>
                            <button className="text-red-400 hover:text-red-600">
                              Revogar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* IPs Autorizados Tab */}
        {activeTab === 'ips' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">IPs Autorizados</h2>
              <p className="text-gray-600">Configure IPs autorizados para operações de payout via API</p>
            </div>

            {/* Add IP Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Novo IP</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço IP
                  </label>
                  <input
                    type="text"
                    id="ip"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Escritório principal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={addAuthorizedIP}
                  disabled={!newIP.trim() || !validateIP(newIP) || isAddingIP}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {isAddingIP ? 'Adicionando...' : 'Adicionar IP'}
                </button>
                {newIP && !validateIP(newIP) && (
                  <p className="mt-2 text-sm text-red-600">Formato de IP inválido</p>
                )}
              </div>
            </div>

            {/* IPs List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {authorizedIPs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum IP autorizado</h3>
                  <p className="text-gray-500">Adicione IPs autorizados para operações de payout seguras.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {authorizedIPs.map((ip) => (
                    <div key={ip.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-gray-900 font-medium font-mono">{ip.ipAddress}</h3>
                              <p className="text-gray-500 text-sm">{ip.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Criado em {formatDate(ip.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ip.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ip.isActive ? 'ATIVO' : 'INATIVO'}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleIPStatus(ip.id, ip.isActive)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {ip.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => removeIP(ip.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}