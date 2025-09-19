'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

interface CommissionRule {
  transactionType: 'PIX_PAYIN' | 'PIX_PAYOUT' | 'USDT_PURCHASE' | 'USDT_INVESTMENT';
  percentage: number;
}

interface CreateSalesRepData {
  name: string;
  email: string;
  phone?: string;
  territoryArea?: string;
  monthlyTarget?: number;
  commissionRules: CommissionRule[];
}

interface CreateSalesRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSalesRepModal({ isOpen, onClose, onSuccess }: CreateSalesRepModalProps) {
  const [formData, setFormData] = useState<CreateSalesRepData>({
    name: '',
    email: '',
    phone: '',
    territoryArea: '',
    monthlyTarget: undefined,
    commissionRules: [
      { transactionType: 'PIX_PAYIN', percentage: 1.0 },
      { transactionType: 'PIX_PAYOUT', percentage: 0.5 },
      { transactionType: 'USDT_PURCHASE', percentage: 0.5 },
      { transactionType: 'USDT_INVESTMENT', percentage: 0.5 }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transactionTypeLabels: Record<CommissionRule['transactionType'], string> = {
    'PIX_PAYIN': 'PIX Recebido',
    'PIX_PAYOUT': 'PIX Enviado',
    'USDT_PURCHASE': 'Compra USDT',
    'USDT_INVESTMENT': 'Investimento USDT'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/backoffice/sales-reps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          commissionRules: formData.commissionRules.map(rule => ({
            ...rule,
            percentage: rule.percentage / 100 // Converter percentual para decimal
          }))
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar representante');
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        territoryArea: '',
        monthlyTarget: undefined,
        commissionRules: [
          { transactionType: 'PIX_PAYIN', percentage: 1.0 },
          { transactionType: 'PIX_PAYOUT', percentage: 0.5 },
          { transactionType: 'USDT_PURCHASE', percentage: 0.5 },
          { transactionType: 'USDT_INVESTMENT', percentage: 0.5 }
        ]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCommissionRule = (index: number, field: 'percentage', value: number) => {
    const updatedRules = [...formData.commissionRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setFormData({ ...formData, commissionRules: updatedRules });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Novo Representante de Vendas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área/Território
              </label>
              <input
                type="text"
                value={formData.territoryArea}
                onChange={(e) => setFormData({ ...formData, territoryArea: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Mensal (R$)
            </label>
            <input
              type="number"
              value={formData.monthlyTarget || ''}
              onChange={(e) => setFormData({
                ...formData,
                monthlyTarget: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              min="0"
              step="0.01"
              disabled={isLoading}
            />
          </div>

          {/* Regras de Comissão */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Regras de Comissão
            </h4>
            <div className="space-y-3">
              {formData.commissionRules.map((rule, index) => (
                <div key={rule.transactionType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {transactionTypeLabels[rule.transactionType]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={rule.percentage}
                      onChange={(e) => updateCommissionRule(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Percentuais de comissão aplicados sobre o valor total das transações
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Representante
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}