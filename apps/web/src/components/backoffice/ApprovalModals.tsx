'use client';

import { useState } from 'react';
import { X, Check, AlertTriangle, FileText } from 'lucide-react';
// Generate a simple UUID for client-side use
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  onSuccess: () => void;
}

interface RejectModalProps extends ApprovalModalProps {
  reasonCodes: Array<{ code: string; description: string }>;
}

interface RequestChangesModalProps extends ApprovalModalProps {
  commonChangeTypes: string[];
}

export function ApprovalModal({ isOpen, onClose, sellerId, sellerName, sellerEmail, onSuccess }: ApprovalModalProps) {
  const [note, setNote] = useState('');

  // Taxa de Câmbio (Margem)
  const [exchangeRateFeePercent, setExchangeRateFeePercent] = useState('2.0'); // %
  const [exchangeRateFeeFixed, setExchangeRateFeeFixed] = useState('0.10'); // R$

  // PIX Pay-in (Depósitos)
  const [pixPayinFeePercent, setPixPayinFeePercent] = useState('1.0'); // %
  const [pixPayinFeeFixed, setPixPayinFeeFixed] = useState('0.20'); // R$

  // PIX Pay-out (Saques)
  const [pixPayoutFeePercent, setPixPayoutFeePercent] = useState('1.5'); // %
  const [pixPayoutFeeFixed, setPixPayoutFeeFixed] = useState('0.50'); // R$

  // Saque Manual
  const [manualWithdrawFeePercent, setManualWithdrawFeePercent] = useState('2.0'); // %
  const [manualWithdrawFeeFixed, setManualWithdrawFeeFixed] = useState('1.00'); // R$

  // Compra USDT
  const [usdtPurchaseFeePercent, setUsdtPurchaseFeePercent] = useState('1.5'); // %
  const [usdtPurchaseFeeFixed, setUsdtPurchaseFeeFixed] = useState('0.30'); // R$

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/backoffice/sellers/${sellerId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note.trim() || undefined,
          exchangeRateFeePercent: parseFloat(exchangeRateFeePercent) / 100, // Convert % to decimal
          exchangeRateFeeFixed: parseFloat(exchangeRateFeeFixed),
          pixPayinFeePercent: parseFloat(pixPayinFeePercent) / 100, // Convert % to decimal
          pixPayinFeeFixed: parseFloat(pixPayinFeeFixed),
          pixPayoutFeePercent: parseFloat(pixPayoutFeePercent) / 100, // Convert % to decimal
          pixPayoutFeeFixed: parseFloat(pixPayoutFeeFixed),
          manualWithdrawFeePercent: parseFloat(manualWithdrawFeePercent) / 100, // Convert % to decimal
          manualWithdrawFeeFixed: parseFloat(manualWithdrawFeeFixed),
          usdtPurchaseFeePercent: parseFloat(usdtPurchaseFeePercent) / 100, // Convert % to decimal
          usdtPurchaseFeeFixed: parseFloat(usdtPurchaseFeeFixed),
          idempotencyKey: generateUUID(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve seller');
      }

      onSuccess();
      onClose();
      setNote('');
      setExchangeRateFeePercent('2.0');
      setExchangeRateFeeFixed('0.10');
      setPixPayinFeePercent('1.0');
      setPixPayinFeeFixed('0.20');
      setPixPayoutFeePercent('1.5');
      setPixPayoutFeeFixed('0.50');
      setManualWithdrawFeePercent('2.0');
      setManualWithdrawFeeFixed('1.00');
      setUsdtPurchaseFeePercent('1.5');
      setUsdtPurchaseFeeFixed('0.30');
    } catch (error) {
      console.error('Approval error:', error);
      alert(`Erro ao aprovar seller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            Aprovar Seller & Configurar Taxas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Confirmar aprovação do seller:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-gray-900 dark:text-white">{sellerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{sellerEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Taxa de Câmbio */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taxa de Câmbio (Margem sobre cotação) *</h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Margem aplicada sobre a cotação atual da API (ex: cotação + 2% + R$ 0,10)
            </p>
          </div>

          {/* PIX Pay-in */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taxa PIX Pay-in *</h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.20"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Taxa descontada do valor recebido</p>
          </div>

          {/* PIX Pay-out */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taxa PIX Pay-out *</h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.50"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Taxa descontada do valor que sai do sistema</p>
          </div>

          {/* Saque Manual */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taxa de Saque Manual *</h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1.00"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Taxa descontada quando saque solicitado pelo painel</p>
          </div>

          {/* Compra USDT */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taxa de Compra USDT *</h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.30"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Taxa acrescentada ao valor final da compra</p>
          </div>

          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota (opcional)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Observações sobre a aprovação..."
            />
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Aprovando...' : 'Aprovar & Configurar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RejectModal({ 
  isOpen, 
  onClose, 
  sellerId, 
  sellerName, 
  sellerEmail, 
  onSuccess,
  reasonCodes 
}: RejectModalProps) {
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reasonCode) {
      alert('Selecione um motivo para a rejeição');
      return;
    }
    
    if (reasonText.trim().length < 10) {
      alert('A justificativa deve ter pelo menos 10 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/backoffice/sellers/${sellerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reasonCode,
          reasonText: reasonText.trim(),
          idempotencyKey: generateUUID(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject seller');
      }

      onSuccess();
      onClose();
      setReasonCode('');
      setReasonText('');
    } catch (error) {
      console.error('Rejection error:', error);
      alert(`Erro ao reprovar seller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Reprovar Seller
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Confirmar reprovação do seller:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-gray-900 dark:text-white">{sellerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{sellerEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reasonCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo *
            </label>
            <select
              id="reasonCode"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Selecione um motivo</option>
              {reasonCodes.map(({ code, description }) => (
                <option key={code} value={code}>
                  {description}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="reasonText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Justificativa detalhada *
            </label>
            <textarea
              id="reasonText"
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descreva detalhadamente os motivos da reprovação... (mínimo 10 caracteres)"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reasonText.length}/10 caracteres mínimos
            </p>
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Reprovando...' : 'Reprovar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RequestChangesModal({ 
  isOpen, 
  onClose, 
  sellerId, 
  sellerName, 
  sellerEmail, 
  onSuccess,
  commonChangeTypes 
}: RequestChangesModalProps) {
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [customChange, setCustomChange] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChangeToggle = (change: string) => {
    setSelectedChanges(prev => 
      prev.includes(change) 
        ? prev.filter(c => c !== change)
        : [...prev, change]
    );
  };

  const handleAddCustomChange = () => {
    if (customChange.trim() && customChange.trim().length >= 5) {
      setSelectedChanges(prev => [...prev, customChange.trim()]);
      setCustomChange('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allChanges = [...selectedChanges];
    if (customChange.trim() && customChange.trim().length >= 5) {
      allChanges.push(customChange.trim());
    }
    
    if (allChanges.length === 0) {
      alert('Selecione pelo menos um ajuste necessário');
      return;
    }
    
    if (reasonText.trim().length < 10) {
      alert('A justificativa deve ter pelo menos 10 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/backoffice/sellers/${sellerId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiredChanges: allChanges,
          reasonText: reasonText.trim(),
          idempotencyKey: generateUUID(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request changes');
      }

      onSuccess();
      onClose();
      setSelectedChanges([]);
      setCustomChange('');
      setReasonText('');
    } catch (error) {
      console.error('Request changes error:', error);
      alert(`Erro ao solicitar ajustes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 text-orange-600 mr-2" />
            Solicitar Ajustes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Solicitar ajustes para o seller:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-gray-900 dark:text-white">{sellerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{sellerEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ajustes necessários *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
              {commonChangeTypes.map((change) => (
                <label key={change} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedChanges.includes(change)}
                    onChange={() => handleChangeToggle(change)}
                    className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {change}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="customChange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ajuste personalizado
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="customChange"
                value={customChange}
                onChange={(e) => setCustomChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite um ajuste específico (mín. 5 caracteres)"
              />
              <button
                type="button"
                onClick={handleAddCustomChange}
                disabled={!customChange.trim() || customChange.trim().length < 5}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>

          {selectedChanges.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ajustes selecionados ({selectedChanges.length}):
              </p>
              <div className="space-y-1">
                {selectedChanges.map((change, index) => (
                  <div key={index} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{change}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedChanges(prev => prev.filter(c => c !== change))}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="reasonText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Justificativa detalhada *
            </label>
            <textarea
              id="reasonText"
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Explique detalhadamente os motivos dos ajustes solicitados... (mínimo 10 caracteres)"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reasonText.length}/10 caracteres mínimos
            </p>
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Solicitar Ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}