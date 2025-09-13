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
  const [exchangeRate, setExchangeRate] = useState('5.85'); // BRL para USDT (exemplo: 1 USDT = 5.85 BRL)
  const [pixPayinRate, setPixPayinRate] = useState('0.5'); // Taxa PIX Pay-in (%)
  const [pixPayoutRate, setPixPayoutRate] = useState('0.8'); // Taxa PIX Pay-out (%)
  const [usdtPurchaseRate, setUsdtPurchaseRate] = useState('1.5'); // Taxa compra USDT (%)
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
          exchangeRate: parseFloat(exchangeRate),
          pixPayinRate: parseFloat(pixPayinRate),
          pixPayoutRate: parseFloat(pixPayoutRate),
          usdtPurchaseRate: parseFloat(usdtPurchaseRate),
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
      setExchangeRate('5.85');
      setPixPayinRate('0.5');
      setPixPayoutRate('0.8');
      setUsdtPurchaseRate('1.5');
    } catch (error) {
      console.error('Approval error:', error);
      alert(`Erro ao aprovar seller: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxa de Câmbio (USDT → BRL) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="exchangeRate"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                step="0.01"
                min="1.00"
                max="20.00"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="5.85"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">BRL</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Exemplo: 5.85 significa 1 USDT = R$ 5,85
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="pixPayinRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxa PIX Pay-in *
            </label>
            <div className="relative">
              <input
                type="number"
                id="pixPayinRate"
                value={pixPayinRate}
                onChange={(e) => setPixPayinRate(e.target.value)}
                step="0.1"
                min="0.0"
                max="10.0"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.5"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taxa cobrada para receber PIX (depósitos)
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="pixPayoutRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxa PIX Pay-out *
            </label>
            <div className="relative">
              <input
                type="number"
                id="pixPayoutRate"
                value={pixPayoutRate}
                onChange={(e) => setPixPayoutRate(e.target.value)}
                step="0.1"
                min="0.0"
                max="10.0"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.8"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taxa cobrada para enviar PIX (saques)
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="usdtPurchaseRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxa Compra USDT *
            </label>
            <div className="relative">
              <input
                type="number"
                id="usdtPurchaseRate"
                value={usdtPurchaseRate}
                onChange={(e) => setUsdtPurchaseRate(e.target.value)}
                step="0.1"
                min="0.0"
                max="10.0"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1.5"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Taxa cobrada para comprar USDT
            </p>
          </div>

          {/* Resumo das Taxas */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
              Resumo das Taxas Configuradas
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-500 dark:text-gray-400">Câmbio USDT:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  R$ {exchangeRate}/USDT
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-500 dark:text-gray-400">PIX Pay-in:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {pixPayinRate}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-500 dark:text-gray-400">PIX Pay-out:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {pixPayoutRate}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-gray-500 dark:text-gray-400">Compra USDT:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {usdtPurchaseRate}%
                </div>
              </div>
            </div>
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