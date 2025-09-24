'use client';

import { useState, useEffect } from 'react';
import { formatBRL, formatCrypto } from '@/lib/currency';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  type: 'FIXED_YIELD' | 'VARIABLE_YIELD' | 'CDI_PEGGED';
  annualYieldRate: number;
  dailyYieldRate: number;
  minimumAmount: number;
  maximumAmount: number | null;
  lockPeriodDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  investorsCount: number;
  totalInvested: number;
  averageInvestment: number;
}

export default function PlanosInvestimentoPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'FIXED_YIELD' as 'FIXED_YIELD' | 'VARIABLE_YIELD' | 'CDI_PEGGED',
    annualYieldRate: '',
    minimumAmount: '',
    maximumAmount: '',
    lockPeriodDays: '',
    isActive: true
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backoffice/investment-plans');
      const result = await response.json();

      if (result.success) {
        setPlans(result.plans);
      } else {
        console.error('Error loading plans:', result.error);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'FIXED_YIELD',
      annualYieldRate: '',
      minimumAmount: '',
      maximumAmount: '',
      lockPeriodDays: '',
      isActive: true
    });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (plan: InvestmentPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      type: plan.type,
      annualYieldRate: (plan.annualYieldRate * 100).toString(),
      minimumAmount: plan.minimumAmount.toString(),
      maximumAmount: plan.maximumAmount?.toString() || '',
      lockPeriodDays: plan.lockPeriodDays?.toString() || '',
      isActive: plan.isActive
    });
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.annualYieldRate || !formData.minimumAmount) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setFormLoading(true);
      const url = editingPlan
        ? `/api/backoffice/investment-plans/${editingPlan.id}`
        : '/api/backoffice/investment-plans';

      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          annualYieldRate: parseFloat(formData.annualYieldRate) / 100, // Convert percentage to decimal
          minimumAmount: parseFloat(formData.minimumAmount),
          maximumAmount: formData.maximumAmount ? parseFloat(formData.maximumAmount) : null,
          lockPeriodDays: formData.lockPeriodDays ? parseInt(formData.lockPeriodDays) : null,
          isActive: formData.isActive
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`Plan ${editingPlan ? 'updated' : 'created'} successfully`);
        setShowCreateModal(false);
        resetForm();
        await loadPlans();
      } else {
        alert(result.error || 'Erro ao salvar plano');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Erro de conexão');
    } finally {
      setFormLoading(false);
    }
  };

  const togglePlanStatus = async (plan: InvestmentPlan) => {
    if (!confirm(`Tem certeza que deseja ${plan.isActive ? 'desativar' : 'ativar'} este plano?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/investment-plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...plan,
          isActive: !plan.isActive
        })
      });

      const result = await response.json();

      if (result.success) {
        await loadPlans();
      } else {
        alert(result.error || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Erro de conexão');
    }
  };

  const deletePlan = async (plan: InvestmentPlan) => {
    if (plan.investorsCount > 0) {
      alert('Não é possível excluir planos que possuem investidores ativos');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/investment-plans/${plan.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadPlans();
      } else {
        alert(result.error || 'Erro ao excluir plano');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Erro de conexão');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'FIXED_YIELD': 'Rendimento Fixo',
      'VARIABLE_YIELD': 'Rendimento Variável',
      'CDI_PEGGED': 'Atrelado ao CDI'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadgeClass = (type: string) => {
    const classes = {
      'FIXED_YIELD': 'bg-green-100 text-green-800',
      'VARIABLE_YIELD': 'bg-blue-100 text-blue-800',
      'CDI_PEGGED': 'bg-purple-100 text-purple-800'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Planos de Investimento</h1>
              <p className="text-gray-600 text-sm mt-1">Gerencie os planos de investimento em USDT disponíveis</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              + Criar Plano
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
                <p className="text-sm text-gray-600">Total de Planos</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-900">
                  {plans.filter(p => p.isActive).length}
                </p>
                <p className="text-sm text-green-600">Planos Ativos</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {plans.reduce((sum, plan) => sum + plan.investorsCount, 0)}
                </p>
                <p className="text-sm text-blue-600">Total Investidores</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">
                  {formatCrypto(plans.reduce((sum, plan) => sum + plan.totalInvested, 0), 'USDT', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-yellow-600">Total Investido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Plano</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Tipo</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">Rendimento</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">Mín/Máx</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Carência</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Investidores</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {plan.description || 'Sem descrição'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(plan.type)}`}>
                        {getTypeLabel(plan.type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {(plan.annualYieldRate * 100).toFixed(2)}% ao ano
                        </p>
                        <p className="text-sm text-gray-600">
                          {(plan.dailyYieldRate * 100).toFixed(4)}% ao dia
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div>
                        <p className="font-mono text-sm">
                          {formatCrypto(plan.minimumAmount, 'USDT', { showSymbol: false })} USDT
                        </p>
                        {plan.maximumAmount && (
                          <p className="font-mono text-xs text-gray-600">
                            max: {formatCrypto(plan.maximumAmount, 'USDT', { showSymbol: false })} USDT
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm">
                        {plan.lockPeriodDays ? `${plan.lockPeriodDays} dias` : 'Sem carência'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div>
                        <p className="font-semibold text-gray-900">{plan.investorsCount}</p>
                        <p className="text-xs text-gray-600">
                          {formatCrypto(plan.totalInvested, 'USDT', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => togglePlanStatus(plan)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 justify-center">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {plan.investorsCount === 0 && (
                          <button
                            onClick={() => deletePlan(plan)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Excluir"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum plano de investimento encontrado</p>
              <button
                onClick={openCreateModal}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Criar primeiro plano →
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Plano *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ex: USDT Premium 300% CDI"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo do Plano *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="FIXED_YIELD">Rendimento Fixo</option>
                      <option value="VARIABLE_YIELD">Rendimento Variável</option>
                      <option value="CDI_PEGGED">Atrelado ao CDI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Descrição detalhada do plano de investimento..."
                  />
                </div>

                {/* Yield Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rendimento Anual (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.annualYieldRate}
                      onChange={(e) => setFormData({...formData, annualYieldRate: e.target.value})}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ex: 38.25"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  {formData.annualYieldRate && (
                    <p className="text-xs text-gray-600 mt-1">
                      Rendimento diário aproximado: {((parseFloat(formData.annualYieldRate) / 365) || 0).toFixed(4)}%
                    </p>
                  )}
                </div>

                {/* Investment Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Investimento Mínimo (USDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.minimumAmount}
                      onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Investimento Máximo (USDT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.maximumAmount}
                      onChange={(e) => setFormData({...formData, maximumAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="10000 (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período de Carência (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lockPeriodDays}
                    onChange={(e) => setFormData({...formData, lockPeriodDays: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="30 (deixe vazio para sem carência)"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Período mínimo que o investimento deve permanecer aplicado
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Plano ativo (disponível para novos investimentos)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={formLoading}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar Plano'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}