'use client';

import { useState, useEffect } from 'react';
import { useAcquirers } from '@/hooks/useAcquirers';

interface FeeConfig {
  payin: {
    type: 'percentage' | 'fixed' | 'percentage_min';
    value: number;
    minValue?: number;
  };
  payout: {
    type: 'percentage' | 'fixed' | 'percentage_min';
    value: number;
    minValue?: number;
  };
}

interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  category: 'MERCHANT' | 'LIQUIDANTE';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING';
  apiKey?: string;
  endpoint?: string;
  webhook?: string;
  lastSync?: string;
  fees?: FeeConfig;
  config: Record<string, any>;
  testMode?: boolean;
  supportsDeposits?: boolean;
  supportsWithdrawals?: boolean;
  supportsWebhooks?: boolean;
  _count?: {
    userAcquirers: number;
    transactions: number;
  };
}

export default function AdquirentesPage() {
  const [activeTab, setActiveTab] = useState<'MERCHANT' | 'LIQUIDANTE'>('LIQUIDANTE');
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const { acquirers, loading, error, refetch, saveAcquirer, testAcquirer } = useAcquirers();

  // Transform acquirers to match the old interface
  const providers: ApiProvider[] = acquirers.map(acq => {
    // Parse fee config if available
    let fees: FeeConfig = {
      payin: { type: 'percentage', value: 0, minValue: 0 },
      payout: { type: 'percentage', value: 0, minValue: 0 }
    };

    if (acq.feeConfig) {
      try {
        const feeData = JSON.parse(acq.feeConfig);
        if (feeData.deposit) {
          fees.payin = {
            type: feeData.deposit.type?.toLowerCase() || 'percentage',
            value: feeData.deposit.value || 0,
            minValue: feeData.deposit.minValue || 0
          };
        }
        if (feeData.withdrawal) {
          fees.payout = {
            type: feeData.withdrawal.type?.toLowerCase() || 'percentage',
            value: feeData.withdrawal.value || 0,
            minValue: feeData.withdrawal.minValue || 0
          };
        }
      } catch (e) {
        console.warn('Failed to parse fee config for', acq.name, e);
      }
    }

    return {
      id: acq.id,
      name: acq.name,
      slug: acq.slug,
      category: acq.type === 'CRYPTO' ? 'MERCHANT' : 'LIQUIDANTE',
      status: acq.status,
      apiKey: acq.apiConfig === '***configured***' ? '***configured***' : undefined,
      endpoint: '',
      webhook: '',
      lastSync: acq.lastTestAt,
      fees,
      config: {},
      testMode: acq.testMode,
      supportsDeposits: acq.supportsDeposits,
      supportsWithdrawals: acq.supportsWithdrawals,
      supportsWebhooks: acq.supportsWebhooks,
      _count: acq._count
    };
  });

  const loadProviders = refetch;

  const saveProvider = async (providerId: string, data: Partial<ApiProvider>) => {
    try {
      // Transform the form data back to the API format
      const apiData = {
        id: providerId,
        name: data.name,
        slug: data.slug || providers.find(p => p.id === providerId)?.slug,
        status: data.status,
        feeConfig: data.fees ? {
          deposit: {
            type: data.fees.payin.type?.toUpperCase(),
            value: data.fees.payin.value,
            minValue: data.fees.payin.minValue
          },
          withdrawal: {
            type: data.fees.payout.type?.toUpperCase(),
            value: data.fees.payout.value,
            minValue: data.fees.payout.minValue
          }
        } : undefined,
        apiConfig: data.apiKey && data.apiKey !== '***configured***' ? {
          apiKey: data.apiKey,
          endpoint: data.endpoint,
          webhook: data.webhook
        } : undefined,
        testMode: data.testMode,
        supportsDeposits: data.supportsDeposits,
        supportsWithdrawals: data.supportsWithdrawals,
        supportsWebhooks: data.supportsWebhooks
      };

      const result = await saveAcquirer(apiData);
      
      if (result.success) {
        setEditingProvider(null);
        console.log('✅ Provider saved successfully');
      } else {
        console.error('❌ Error saving provider:', result.error);
        alert(`Erro ao salvar: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving provider:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const testConnection = async (providerId: string) => {
    try {
      console.log('🧪 Testing connection for provider:', providerId);
      const result = await testAcquirer(providerId);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error testing connection:', error);
      alert(`❌ Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'TESTING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'ERROR': return 'Erro';
      case 'TESTING': return 'Testando';
      default: return 'Inativo';
    }
  };

  const filteredProviders = providers.filter(p => p.category === activeTab);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro ao carregar adquirentes</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadProviders}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Configuracao de APIs</h1>
          <p className="mt-2 text-gray-600">
            Gestao de provedores Merchant (Cripto) e Liquidantes (PIX)
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('LIQUIDANTE')}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === 'LIQUIDANTE'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Liquidantes (PIX)
              </button>
              <button
                onClick={() => setActiveTab('MERCHANT')}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === 'MERCHANT'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Merchant (Cripto)
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'LIQUIDANTE' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    Provedores PIX
                  </h3>
                  <p className="text-gray-600">Configure APIs, taxas e parametros de liquidacao</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isEditing={editingProvider === provider.id}
                      onEdit={() => setEditingProvider(provider.id)}
                      onSave={(data) => saveProvider(provider.id, data)}
                      onCancel={() => setEditingProvider(null)}
                      onTest={() => testConnection(provider.id)}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'MERCHANT' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    Provedores de Criptomoeda
                  </h3>
                  <p className="text-gray-600">Configure APIs, taxas e parametros de merchant</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isEditing={editingProvider === provider.id}
                      onEdit={() => setEditingProvider(provider.id)}
                      onSave={(data) => saveProvider(provider.id, data)}
                      onCancel={() => setEditingProvider(null)}
                      onTest={() => testConnection(provider.id)}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ 
  provider, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onTest, 
  getStatusColor, 
  getStatusLabel 
}: {
  provider: ApiProvider;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<ApiProvider>) => void;
  onCancel: () => void;
  onTest: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) {
  const [formData, setFormData] = useState({
    apiKey: provider.apiKey || '',
    endpoint: provider.endpoint || '',
    webhook: provider.webhook || '',
    fees: {
      payin: {
        type: provider.fees?.payin?.type || 'percentage' as const,
        value: provider.fees?.payin?.value || 0,
        minValue: provider.fees?.payin?.minValue || 0
      },
      payout: {
        type: provider.fees?.payout?.type || 'percentage' as const,
        value: provider.fees?.payout?.value || 0,
        minValue: provider.fees?.payout?.minValue || 0
      }
    }
  });

  const handleSave = () => {
    onSave(formData);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">{provider.name}</h4>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(provider.status)}`}>
            {getStatusLabel(provider.status)}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Digite a API Key..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint
            </label>
            <input
              type="url"
              value={formData.endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://api.exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhook}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="https://webhook.exemplo.com"
            />
          </div>

          {/* Fee Configuration */}
          <div className="border-t pt-6 mt-6">
            <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Configuracao de Taxas
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payin Fees */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Taxa Payin (Entrada)</h6>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select
                      value={formData.fees.payin.type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fees: {
                          ...prev.fees,
                          payin: { ...prev.fees.payin, type: e.target.value as 'percentage' | 'fixed' | 'percentage_min' }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Valor Fixo ({provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})</option>
                      <option value="percentage_min">Percentual + Minimo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fees.payin.value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fees: {
                            ...prev.fees,
                            payin: { ...prev.fees.payin, value: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={formData.fees.payin.type === 'percentage' ? '2.5' : '1.50'}
                      />
                      <span className="absolute right-3 top-2 text-xs text-gray-500">
                        {formData.fees.payin.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD') : '%'}
                      </span>
                    </div>
                  </div>
                  {formData.fees.payin.type === 'percentage_min' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor Minimo</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.fees.payin.minValue || 0}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            fees: {
                              ...prev.fees,
                              payin: { ...prev.fees.payin, minValue: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder={provider.category === 'LIQUIDANTE' ? '5.00' : '1.50'}
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-500">{provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payout Fees */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Taxa Payout (Saida)</h6>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                    <select
                      value={formData.fees.payout.type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fees: {
                          ...prev.fees,
                          payout: { ...prev.fees.payout, type: e.target.value as 'percentage' | 'fixed' | 'percentage_min' }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Valor Fixo ({provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})</option>
                      <option value="percentage_min">Percentual + Minimo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fees.payout.value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fees: {
                            ...prev.fees,
                            payout: { ...prev.fees.payout, value: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={formData.fees.payout.type === 'percentage' ? '2.5' : '1.50'}
                      />
                      <span className="absolute right-3 top-2 text-xs text-gray-500">
                        {formData.fees.payout.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD') : '%'}
                      </span>
                    </div>
                  </div>
                  {formData.fees.payout.type === 'percentage_min' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor Minimo</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.fees.payout.minValue || 0}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            fees: {
                              ...prev.fees,
                              payout: { ...prev.fees.payout, minValue: parseFloat(e.target.value) || 0 }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder={provider.category === 'LIQUIDANTE' ? '5.00' : '1.50'}
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-500">{provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profit Margin Calculation */}
            {(formData.fees.payin.value > 0 || formData.fees.payout.value > 0) && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h6 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Calculo de Margem
                </h6>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Taxa Gateway Payin:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.fees.payin.value}{formData.fees.payin.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? ' BRL' : ' USD') : '%'}
                      {formData.fees.payin.type === 'percentage_min' && formData.fees.payin.minValue ? ` (min ${formData.fees.payin.minValue} ${provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Taxa Gateway Payout:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.fees.payout.value}{formData.fees.payout.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? ' BRL' : ' USD') : '%'}
                      {formData.fees.payout.type === 'percentage_min' && formData.fees.payout.minValue ? ` (min ${formData.fees.payout.minValue} ${provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <strong>Formula:</strong> Taxa Seller - Taxa Gateway = Margem de Lucro
                  </p>
                  <p className="text-xs text-gray-600">
                    Configure suas taxas de venda considerando as taxas do gateway para garantir sua margem de lucro desejada.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
            >
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{provider.name}</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(provider.status)}`}>
          {getStatusLabel(provider.status)}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <span className="text-sm font-medium text-gray-600">API Key:</span>
          <p className="text-sm text-gray-900">
            {provider.apiKey ? '••••••••••••••••' : 'Nao configurado'}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Endpoint:</span>
          <p className="text-sm text-gray-900">
            {provider.endpoint || 'Nao configurado'}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Webhook:</span>
          <p className="text-sm text-gray-900">
            {provider.webhook || 'Nao configurado'}
          </p>
        </div>
        
        {/* Fee Display */}
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-1">Taxa Payin:</span>
              <p className="text-sm text-gray-900 font-medium">
                {provider.fees?.payin ? (
                  <>
                    {provider.fees.payin.value}
                    {provider.fees.payin.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? ' BRL' : ' USD') : '%'}
                    {provider.fees.payin.type === 'percentage_min' && provider.fees.payin.minValue ? ` (min ${provider.fees.payin.minValue} ${provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})` : ''}
                  </>
                ) : 'Nao configurado'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-1">Taxa Payout:</span>
              <p className="text-sm text-gray-900 font-medium">
                {provider.fees?.payout ? (
                  <>
                    {provider.fees.payout.value}
                    {provider.fees.payout.type === 'fixed' ? (provider.category === 'LIQUIDANTE' ? ' BRL' : ' USD') : '%'}
                    {provider.fees.payout.type === 'percentage_min' && provider.fees.payout.minValue ? ` (min ${provider.fees.payout.minValue} ${provider.category === 'LIQUIDANTE' ? 'BRL' : 'USD'})` : ''}
                  </>
                ) : 'Nao configurado'}
              </p>
            </div>
          </div>
        </div>

        {provider.lastSync && (
          <div className="border-t pt-3 mt-3">
            <span className="text-sm font-medium text-gray-600">Ultima sincronizacao:</span>
            <p className="text-sm text-gray-900">
              {new Date(provider.lastSync).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
        >
          Configurar
        </button>
        {provider.apiKey && (
          <button
            onClick={onTest}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
          >
            Testar
          </button>
        )}
      </div>
    </div>
  );
}