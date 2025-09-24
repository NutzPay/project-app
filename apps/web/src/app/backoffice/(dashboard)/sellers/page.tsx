'use client';

import { useState, useEffect } from 'react';

interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  exchangeRate?: number;
  pixPayinFeePercent?: number;
  pixPayinFeeFixed?: number;
  pixPayoutFeePercent?: number;
  pixPayoutFeeFixed?: number;
  manualWithdrawFeePercent?: number;
  manualWithdrawFeeFixed?: number;
  usdtPurchaseFeePercent?: number;
  usdtPurchaseFeeFixed?: number;
  company?: {
    name: string;
  };
}

interface FeeModalData {
  sellerId: string;
  sellerName: string;
  fees: {
    exchangeRate?: number;
    pixPayinFeePercent?: number;
    pixPayinFeeFixed?: number;
    pixPayoutFeePercent?: number;
    pixPayoutFeeFixed?: number;
    manualWithdrawFeePercent?: number;
    manualWithdrawFeeFixed?: number;
    usdtPurchaseFeePercent?: number;
    usdtPurchaseFeeFixed?: number;
  };
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeModalData, setFeeModalData] = useState<FeeModalData | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backoffice/sellers', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      } else {
        setError('Erro ao carregar sellers');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Error loading sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFeeModal = (seller: Seller) => {
    setFeeModalData({
      sellerId: seller.id,
      sellerName: seller.name,
      fees: {
        exchangeRate: seller.exchangeRate || 0,
        pixPayinFeePercent: seller.pixPayinFeePercent || 0,
        pixPayinFeeFixed: seller.pixPayinFeeFixed || 0,
        pixPayoutFeePercent: seller.pixPayoutFeePercent || 0,
        pixPayoutFeeFixed: seller.pixPayoutFeeFixed || 0,
        manualWithdrawFeePercent: seller.manualWithdrawFeePercent || 0,
        manualWithdrawFeeFixed: seller.manualWithdrawFeeFixed || 0,
        usdtPurchaseFeePercent: seller.usdtPurchaseFeePercent || 0,
        usdtPurchaseFeeFixed: seller.usdtPurchaseFeeFixed || 0,
      }
    });
    setShowFeeModal(true);
  };

  const updateFees = async () => {
    if (!feeModalData) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/backoffice/sellers/${feeModalData.sellerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(feeModalData.fees),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSellers(prev => prev.map(seller =>
          seller.id === feeModalData.sellerId
            ? { ...seller, ...feeModalData.fees }
            : seller
        ));
        setShowFeeModal(false);
        setFeeModalData(null);
      } else {
        alert(result.error || 'Erro ao atualizar taxas');
      }
    } catch (err) {
      console.error('Error updating fees:', err);
      alert('Erro de conexão');
    } finally {
      setUpdating(false);
    }
  };

  const formatPercent = (value?: number) => {
    if (!value) return '0%';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sellers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSellers}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Sellers
        </h1>
        <p className="text-gray-600 mt-2">
          Gerenciamento de sellers e configuração de taxas
        </p>
      </div>

      {/* Sellers List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Sellers ({sellers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Câmbio USDT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa PIX In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa PIX Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                      <div className="text-sm text-gray-500">{seller.email}</div>
                      {seller.company && (
                        <div className="text-xs text-gray-400">{seller.company.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      seller.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : seller.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.exchangeRate ? `R$ ${seller.exchangeRate.toFixed(2)}` : 'Não configurado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{formatPercent(seller.pixPayinFeePercent)}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(seller.pixPayinFeeFixed)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{formatPercent(seller.pixPayoutFeePercent)}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(seller.pixPayoutFeeFixed)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openFeeModal(seller)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Configurar Taxas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Configuration Modal */}
      {showFeeModal && feeModalData && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Configurar Taxas - {feeModalData.sellerName}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Rules Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Resumo das Regras de Aplicação das Taxas</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• <strong>PIX (entrada)</strong> → Taxa descontada do valor recebido</div>
                  <div>• <strong>PIX (saída)</strong> → Taxa descontada do valor que sai</div>
                  <div>• <strong>Saque painel</strong> → Taxa descontada do saque manual</div>
                  <div>• <strong>Compra USDT</strong> → Taxa acrescentada ao valor final</div>
                  <div className="mt-2 text-blue-600">
                    <strong>Exemplos de configuração:</strong> Somente %: "1%", Somente fixa: "R$ 0,20", Ambas: "1% + R$ 0,20"
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exchange Rate */}
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  💱 Taxa de Câmbio / Troca
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={feeModalData.fees.exchangeRate || ''}
                  onChange={(e) => setFeeModalData(prev => prev ? {
                    ...prev,
                    fees: { ...prev.fees, exchangeRate: parseFloat(e.target.value) || undefined }
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 5.85"
                />
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Valor fixo:</strong> Ex.: 5.85 significa 1 USDT = R$ 5,85
                </p>
              </div>

              {/* PIX Pay-in */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">📥 Taxa PIX Pay-in (Depósitos via PIX)</h4>
                <p className="text-xs text-green-600 mb-3">
                  <strong>Regra:</strong> Taxa descontada do valor recebido
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentual (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={(feeModalData.fees.pixPayinFeePercent || 0) * 100}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, pixPayinFeePercent: (parseFloat(e.target.value) || 0) / 100 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ex: 0 ou 1.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aceita 0% quando houver apenas taxa fixa</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Taxa Fixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={feeModalData.fees.pixPayinFeeFixed || 0}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, pixPayinFeeFixed: parseFloat(e.target.value) || 0 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="0.20"
                    />
                  </div>
                </div>
              </div>

              {/* PIX Pay-out */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">📤 Taxa PIX Pay-out (Saques via PIX - API)</h4>
                <p className="text-xs text-red-600 mb-3">
                  <strong>Regra:</strong> Taxa descontada do valor que sai do sistema
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentual (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={(feeModalData.fees.pixPayoutFeePercent || 0) * 100}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, pixPayoutFeePercent: (parseFloat(e.target.value) || 0) / 100 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ex: 0 ou 1.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aceita 0% quando houver apenas taxa fixa</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Taxa Fixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={feeModalData.fees.pixPayoutFeeFixed || 0}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, pixPayoutFeeFixed: parseFloat(e.target.value) || 0 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="0.50"
                    />
                  </div>
                </div>
              </div>

              {/* Manual Withdrawal */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">🏧 Taxa de Saque (Retirada manual via painel)</h4>
                <p className="text-xs text-orange-600 mb-3">
                  <strong>Regra:</strong> Taxa descontada quando saque solicitado pelo painel (independente da API)
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentual (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={(feeModalData.fees.manualWithdrawFeePercent || 0) * 100}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, manualWithdrawFeePercent: (parseFloat(e.target.value) || 0) / 100 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ex: 0 ou 2.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aceita 0% quando houver apenas taxa fixa</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Taxa Fixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={feeModalData.fees.manualWithdrawFeeFixed || 0}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, manualWithdrawFeeFixed: parseFloat(e.target.value) || 0 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="1.00"
                    />
                  </div>
                </div>
              </div>

              {/* USDT Purchase */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">💰 Taxa de Compra de USDT</h4>
                <p className="text-xs text-purple-600 mb-3">
                  <strong>Regra:</strong> Taxa acrescentada ao valor final da compra (Ex: câmbio R$ 5,85 + 1,5% = R$ 5,94)
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Percentual (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={(feeModalData.fees.usdtPurchaseFeePercent || 0) * 100}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, usdtPurchaseFeePercent: (parseFloat(e.target.value) || 0) / 100 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ex: 0 ou 1.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aceita 0% quando houver apenas taxa fixa</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Taxa Fixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={feeModalData.fees.usdtPurchaseFeeFixed || 0}
                      onChange={(e) => setFeeModalData(prev => prev ? {
                        ...prev,
                        fees: { ...prev.fees, usdtPurchaseFeeFixed: parseFloat(e.target.value) || 0 }
                      } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="0.30"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFeeModal(false);
                  setFeeModalData(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                onClick={updateFees}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={updating}
              >
                {updating ? 'Salvando...' : 'Salvar Taxas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}