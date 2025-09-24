'use client';

import { useState } from 'react';
import { Edit, X } from 'lucide-react';

interface SellerDetail {
  id: string;
  name: string;
  email: string;
  exchangeRate?: number;
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
}

interface EditSellerModalProps {
  seller: SellerDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSellerModal({ seller, onClose, onSuccess }: EditSellerModalProps) {
  // Fee Configuration State
  const [exchangeRateFeePercent, setExchangeRateFeePercent] = useState(seller.exchangeRateFeePercent ? (seller.exchangeRateFeePercent * 100).toString() : '2.0');
  const [exchangeRateFeeFixed, setExchangeRateFeeFixed] = useState(seller.exchangeRateFeeFixed?.toString() || '0.10');
  const [pixPayinFeePercent, setPixPayinFeePercent] = useState(seller.pixPayinFeePercent ? (seller.pixPayinFeePercent * 100).toString() : '1.0');
  const [pixPayinFeeFixed, setPixPayinFeeFixed] = useState(seller.pixPayinFeeFixed?.toString() || '0.20');
  const [pixPayoutFeePercent, setPixPayoutFeePercent] = useState(seller.pixPayoutFeePercent ? (seller.pixPayoutFeePercent * 100).toString() : '1.5');
  const [pixPayoutFeeFixed, setPixPayoutFeeFixed] = useState(seller.pixPayoutFeeFixed?.toString() || '0.50');
  const [manualWithdrawFeePercent, setManualWithdrawFeePercent] = useState(seller.manualWithdrawFeePercent ? (seller.manualWithdrawFeePercent * 100).toString() : '2.0');
  const [manualWithdrawFeeFixed, setManualWithdrawFeeFixed] = useState(seller.manualWithdrawFeeFixed?.toString() || '1.00');
  const [usdtPurchaseFeePercent, setUsdtPurchaseFeePercent] = useState(seller.usdtPurchaseFeePercent ? (seller.usdtPurchaseFeePercent * 100).toString() : '1.5');
  const [usdtPurchaseFeeFixed, setUsdtPurchaseFeeFixed] = useState(seller.usdtPurchaseFeeFixed?.toString() || '0.30');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/backoffice/sellers/${seller.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchangeRateFeePercent: parseFloat(exchangeRateFeePercent) / 100,
          exchangeRateFeeFixed: parseFloat(exchangeRateFeeFixed),
          pixPayinFeePercent: parseFloat(pixPayinFeePercent) / 100,
          pixPayinFeeFixed: parseFloat(pixPayinFeeFixed),
          pixPayoutFeePercent: parseFloat(pixPayoutFeePercent) / 100,
          pixPayoutFeeFixed: parseFloat(pixPayoutFeeFixed),
          manualWithdrawFeePercent: parseFloat(manualWithdrawFeePercent) / 100,
          manualWithdrawFeeFixed: parseFloat(manualWithdrawFeeFixed),
          usdtPurchaseFeePercent: parseFloat(usdtPurchaseFeePercent) / 100,
          usdtPurchaseFeeFixed: parseFloat(usdtPurchaseFeeFixed),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update seller');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert(`Erro ao atualizar seller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
            <Edit className="w-4 h-4 text-gray-600 mr-2" />
            Editar Configurações
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Editando configurações para:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
            <p className="font-medium text-sm text-gray-900 dark:text-white">{seller.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{seller.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Taxa de Câmbio */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxa de Câmbio (Margem sobre cotação) *</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="exchangeRatePercent" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  id="exchangeRatePercent"
                  value={exchangeRateFeePercent}
                  onChange={(e) => setExchangeRateFeePercent(e.target.value)}
                  step="0.1"
                  min="0.0"
                  max="50.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 0 ou 2.0"
                />
              </div>
              <div>
                <label htmlFor="exchangeRateFixed" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa Fixa (R$)</label>
                <input
                  type="number"
                  id="exchangeRateFixed"
                  value={exchangeRateFeeFixed}
                  onChange={(e) => setExchangeRateFeeFixed(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Margem aplicada sobre a cotação atual da API (ex: cotação + 2% + R$ 0,10)
            </p>
          </div>

          {/* PIX Pay-in */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxa PIX Pay-in *</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pixPayinPercent" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  id="pixPayinPercent"
                  value={pixPayinFeePercent}
                  onChange={(e) => setPixPayinFeePercent(e.target.value)}
                  step="0.1"
                  min="0.0"
                  max="100.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 0 ou 1.0"
                />
              </div>
              <div>
                <label htmlFor="pixPayinFixed" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa Fixa (R$)</label>
                <input
                  type="number"
                  id="pixPayinFixed"
                  value={pixPayinFeeFixed}
                  onChange={(e) => setPixPayinFeeFixed(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.20"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Taxa descontada do valor recebido</p>
          </div>

          {/* PIX Pay-out */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxa PIX Pay-out *</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pixPayoutPercent" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  id="pixPayoutPercent"
                  value={pixPayoutFeePercent}
                  onChange={(e) => setPixPayoutFeePercent(e.target.value)}
                  step="0.1"
                  min="0.0"
                  max="100.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 0 ou 1.5"
                />
              </div>
              <div>
                <label htmlFor="pixPayoutFixed" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa Fixa (R$)</label>
                <input
                  type="number"
                  id="pixPayoutFixed"
                  value={pixPayoutFeeFixed}
                  onChange={(e) => setPixPayoutFeeFixed(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.50"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Taxa descontada do valor que sai do sistema</p>
          </div>

          {/* Saque Manual */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxa de Saque Manual *</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="manualWithdrawPercent" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  id="manualWithdrawPercent"
                  value={manualWithdrawFeePercent}
                  onChange={(e) => setManualWithdrawFeePercent(e.target.value)}
                  step="0.1"
                  min="0.0"
                  max="100.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 0 ou 2.0"
                />
              </div>
              <div>
                <label htmlFor="manualWithdrawFixed" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa Fixa (R$)</label>
                <input
                  type="number"
                  id="manualWithdrawFixed"
                  value={manualWithdrawFeeFixed}
                  onChange={(e) => setManualWithdrawFeeFixed(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1.00"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Taxa descontada quando saque solicitado pelo painel</p>
          </div>

          {/* Compra USDT */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxa de Compra USDT *</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="usdtPurchasePercent" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Percentual (%)</label>
                <input
                  type="number"
                  id="usdtPurchasePercent"
                  value={usdtPurchaseFeePercent}
                  onChange={(e) => setUsdtPurchaseFeePercent(e.target.value)}
                  step="0.1"
                  min="0.0"
                  max="100.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 0 ou 1.5"
                />
              </div>
              <div>
                <label htmlFor="usdtPurchaseFixed" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Taxa Fixa (R$)</label>
                <input
                  type="number"
                  id="usdtPurchaseFixed"
                  value={usdtPurchaseFeeFixed}
                  onChange={(e) => setUsdtPurchaseFeeFixed(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.30"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Taxa acrescentada ao valor final da compra</p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}