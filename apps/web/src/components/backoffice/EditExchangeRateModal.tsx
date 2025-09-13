'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';

interface EditExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  currentRate?: number;
  onSuccess: () => void;
}

export function EditExchangeRateModal({ 
  isOpen, 
  onClose, 
  sellerId, 
  sellerName, 
  sellerEmail, 
  currentRate,
  onSuccess 
}: EditExchangeRateModalProps) {
  const [exchangeRate, setExchangeRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen && currentRate) {
      setExchangeRate(currentRate.toString());
    }
  }, [isOpen, currentRate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rate = parseFloat(exchangeRate);
    if (!rate || rate <= 0 || rate > 1) {
      alert('Taxa deve estar entre 0.001 e 1.000');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/backoffice/sellers/${sellerId}/exchange-rate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchangeRate: rate,
          note: note.trim() || undefined
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update exchange rate');
      }

      alert(`✅ Taxa de câmbio atualizada!\n\nSeller: ${sellerName}\nNova taxa: ${rate} USDT/BRL`);
      onSuccess();
      onClose();
      setExchangeRate('');
      setNote('');
    } catch (error) {
      console.error('Exchange rate update error:', error);
      alert(`Erro ao atualizar taxa: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateExample = (brl: number) => {
    const rate = parseFloat(exchangeRate);
    if (!rate || rate <= 0) return '0';
    return (brl * rate).toFixed(3);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            Editar Taxa de Câmbio
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
            Atualizar taxa de câmbio para:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-gray-900 dark:text-white">{sellerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{sellerEmail}</p>
            {currentRate && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Taxa atual: {currentRate} USDT/BRL
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nova Taxa de Câmbio (BRL → USDT) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="exchangeRate"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                step="0.001"
                min="0.001"
                max="1.000"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.170"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">USDT/BRL</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Exemplo: 0.170 significa R$ 1,00 = 0.170 USDT
            </p>
          </div>

          {/* Preview */}
          {exchangeRate && parseFloat(exchangeRate) > 0 && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                📊 Simulação:
              </h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-blue-700 dark:text-blue-300">R$ 10,00</div>
                  <div className="text-blue-600 dark:text-blue-400">{calculateExample(10)} USDT</div>
                </div>
                <div>
                  <div className="text-blue-700 dark:text-blue-300">R$ 50,00</div>
                  <div className="text-blue-600 dark:text-blue-400">{calculateExample(50)} USDT</div>
                </div>
                <div>
                  <div className="text-blue-700 dark:text-blue-300">R$ 100,00</div>
                  <div className="text-blue-600 dark:text-blue-400">{calculateExample(100)} USDT</div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo da alteração (opcional)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descreva o motivo da alteração da taxa..."
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
              {loading ? 'Atualizando...' : 'Atualizar Taxa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}