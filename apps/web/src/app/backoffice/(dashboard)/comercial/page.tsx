'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Target, Plus, Edit, Trash2, Eye } from 'lucide-react';
import CreateSalesRepModal from '@/components/modals/CreateSalesRepModal';

interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  startDate: string;
  monthlyTarget?: number;
  territoryArea?: string;
  assignedSellers: number;
  monthlyEarnings: number;
  totalEarnings: number;
  avatar?: string;
}

interface CommissionCycle {
  id: string;
  cycleType: 'WEEKLY' | 'MONTHLY';
  status: 'ACTIVE' | 'PROCESSING' | 'COMPLETED' | 'PAID';
  startDate: string;
  endDate: string;
  processingDate?: string;
  completedDate?: string;
  paidDate?: string;
}

interface PeriodEarning {
  id: string;
  cycleId: string;
  salesRepName: string;
  sellerName: string;
  sellerCompanyName?: string;
  pixPayinVolume: number;
  pixPayoutVolume: number;
  usdtPurchaseVolume: number;
  usdtInvestmentVolume: number;
  pixPayinCommission: number;
  pixPayoutCommission: number;
  usdtPurchaseCommission: number;
  usdtInvestmentCommission: number;
  totalVolume: number;
  totalCommission: number;
  isPaid: boolean;
  paidAt?: string;
  paymentReference?: string;
  cycleType: string;
  cycleStatus: string;
  cycleStartDate: string;
  cycleEndDate: string;
}

export default function ComercialPage() {
  const [activeTab, setActiveTab] = useState<'reps' | 'commissions' | 'performance'>('reps');
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [periodEarnings, setPeriodEarnings] = useState<PeriodEarning[]>([]);
  const [activeCycles, setActiveCycles] = useState<CommissionCycle[]>([]);
  const [commissionStats, setCommissionStats] = useState({
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    totalVolume: 0,
    totalRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar sales reps
      const repsResponse = await fetch('/api/backoffice/sales-reps');
      if (repsResponse.ok) {
        const repsData = await repsResponse.json();
        setSalesReps(repsData.salesReps);
      } else {
        console.error('Failed to fetch sales reps');
        setSalesReps([]);
      }

      // Buscar ciclos ativos
      const cyclesResponse = await fetch('/api/backoffice/commission-cycles?action=active');
      if (cyclesResponse.ok) {
        const cyclesData = await cyclesResponse.json();
        setActiveCycles(cyclesData.cycles || []);
      } else {
        console.error('Failed to fetch active cycles');
        setActiveCycles([]);
      }

      // Buscar estatísticas gerais de comissões
      const statsResponse = await fetch('/api/backoffice/commission-cycles?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCommissionStats(statsData.stats || {});
      } else {
        console.error('Failed to fetch commission stats');
      }

      // Buscar period earnings (comissões por período)
      // TODO: Implementar endpoint específico para period earnings
      setPeriodEarnings([]);

    } catch (error) {
      console.error('Error fetching commercial data:', error);
      setSalesReps([]);
      setPeriodEarnings([]);
      setActiveCycles([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados reais da API
  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'PIX_PAYIN':
        return 'PIX Recebido';
      case 'PIX_PAYOUT':
        return 'PIX Enviado';
      case 'USDT_PURCHASE':
        return 'Compra USDT';
      case 'USDT_INVESTMENT':
        return 'Investimento';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Time Comercial</h1>
          <p className="text-gray-500 mt-2">
            Gerencie representantes de vendas e acompanhe performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Representante
        </button>
      </div>

      {/* Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Key Metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Métricas Principais</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{salesReps.length}</p>
                <p className="text-sm text-gray-500">Representantes</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {salesReps.reduce((acc, rep) => acc + rep.assignedSellers, 0)}
                </p>
                <p className="text-sm text-gray-500">Sellers Ativos</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(commissionStats.totalEarnings)}
                </p>
                <p className="text-sm text-gray-500">Comissões Totais</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(commissionStats.totalVolume)}
                </p>
                <p className="text-sm text-gray-500">Volume Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa Conversão</span>
              <span className="text-sm font-semibold text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ticket Médio</span>
              <span className="text-sm font-semibold text-gray-900">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Volume Total</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(commissionStats.totalVolume)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Comissões Pendentes</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(commissionStats.pendingEarnings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'reps', label: 'Representantes', icon: Users },
              { key: 'commissions', label: 'Períodos & Comissões', icon: DollarSign },
              { key: 'performance', label: 'Análise Detalhada', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'reps' && (
            <div className="space-y-6">
              {salesReps.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum representante cadastrado</h3>
                  <p className="text-gray-500 mb-6">Comece adicionando seu primeiro representante de vendas</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Representante
                  </button>
                </div>
              ) : (
                salesReps.map((rep) => (
                  <div key={rep.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-700">
                            {rep.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{rep.name}</h3>
                          <p className="text-gray-600 text-sm">{rep.email}</p>
                          {rep.territoryArea && (
                            <p className="text-sm text-gray-500 mt-1">{rep.territoryArea}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                          {rep.status}
                        </span>
                        <div className="flex space-x-1">
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sellers Atribuídos</p>
                        <p className="text-xl font-semibold text-gray-900">{rep.assignedSellers}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Meta Mensal</p>
                        <p className="text-xl font-semibold text-gray-900">{rep.monthlyTarget ? formatCurrency(rep.monthlyTarget) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Comissões Mês</p>
                        <p className="text-xl font-semibold text-gray-900">{formatCurrency(rep.monthlyEarnings)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Acumulado</p>
                        <p className="text-xl font-semibold text-gray-900">{formatCurrency(rep.totalEarnings)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="space-y-6">
              {/* Active Cycles */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ciclos de Comissão Ativos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCycles.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">Nenhum ciclo ativo encontrado</p>
                    </div>
                  ) : (
                    activeCycles.map((cycle) => (
                      <div key={cycle.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            Ciclo {cycle.cycleType === 'WEEKLY' ? 'Semanal' : 'Mensal'}
                          </h4>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            cycle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            cycle.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                            cycle.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {cycle.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Início:</strong> {new Date(cycle.startDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Fim:</strong> {new Date(cycle.endDate).toLocaleDateString('pt-BR')}</p>
                          {cycle.processingDate && (
                            <p><strong>Processado:</strong> {new Date(cycle.processingDate).toLocaleDateString('pt-BR')}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Period Earnings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comissões por Período</h3>
                {periodEarnings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma comissão de período registrada</h3>
                    <p className="text-gray-500">As comissões por período aparecerão aqui quando os ciclos forem processados</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Representante
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Seller
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Período
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Volume Total
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Comissão Total
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {periodEarnings.map((earning) => (
                            <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {earning.salesRepName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                <div>
                                  <p className="font-medium">{earning.sellerName}</p>
                                  {earning.sellerCompanyName && (
                                    <p className="text-xs text-gray-500">{earning.sellerCompanyName}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                <div>
                                  <p className="font-medium">{earning.cycleType === 'WEEKLY' ? 'Semanal' : 'Mensal'}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(earning.cycleStartDate).toLocaleDateString('pt-BR')} - {new Date(earning.cycleEndDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {formatCurrency(earning.totalVolume)}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {formatCurrency(earning.totalCommission)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                  earning.isPaid
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {earning.isPaid ? 'Pago' : 'Pendente'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {!earning.isPaid && (
                                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    Marcar como Pago
                                  </button>
                                )}
                                {earning.isPaid && earning.paidAt && (
                                  <p className="text-xs text-gray-500">
                                    Pago em {new Date(earning.paidAt).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Analysis */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Análise de Revenue</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Volume Total Mês</p>
                        <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">vs. mês anterior</p>
                        <p className="text-sm font-medium text-gray-400">--</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Comissões Geradas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(commissionStats.totalEarnings)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Taxa média</p>
                        <p className="text-sm font-medium text-gray-700">0.75%</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                        <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Transações</p>
                        <p className="text-sm font-medium text-gray-700">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Performance */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance do Time</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Representantes Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">{salesReps.filter(rep => rep.status === 'ACTIVE').length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-sm font-medium text-gray-700">{salesReps.length}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sellers Gerenciados</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {salesReps.reduce((acc, rep) => acc + rep.assignedSellers, 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Média por rep</p>
                        <p className="text-sm font-medium text-gray-700">
                          {salesReps.length > 0 ? Math.round(salesReps.reduce((acc, rep) => acc + rep.assignedSellers, 0) / salesReps.length) : 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Meta Coletiva</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(salesReps.reduce((acc, rep) => acc + (rep.monthlyTarget || 0), 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Atingimento</p>
                        <p className="text-sm font-medium text-gray-400">--</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Performance */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Individual</h3>
                <div className="space-y-4">
                  {salesReps.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhum representante para análise</p>
                    </div>
                  ) : (
                    salesReps.map((rep) => (
                      <div key={rep.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-700">
                                {rep.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{rep.name}</h4>
                              <p className="text-sm text-gray-600">{rep.territoryArea || 'Sem território definido'}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                            {rep.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{rep.assignedSellers}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Sellers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {rep.monthlyTarget ? formatCurrency(rep.monthlyTarget) : '--'}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Meta</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Volume</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(rep.monthlyEarnings)}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Comissão</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">--</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Conversão</p>
                          </div>
                        </div>

                        {/* Progress bar for target achievement */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Atingimento da Meta</span>
                            <span>--</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Commission Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Breakdown por Tipo de Transação</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
                    <p className="text-sm text-gray-600">PIX Payin</p>
                    <p className="text-xs text-gray-500 mt-1">Taxa: 1.0%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
                    <p className="text-sm text-gray-600">PIX Payout</p>
                    <p className="text-xs text-gray-500 mt-1">Taxa: 0.5%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
                    <p className="text-sm text-gray-600">Compra USDT</p>
                    <p className="text-xs text-gray-500 mt-1">Taxa: 0.5%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">R$ 0,00</p>
                    <p className="text-sm text-gray-600">Investimento</p>
                    <p className="text-xs text-gray-500 mt-1">Taxa: 0.5%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Sales Rep Modal */}
      <CreateSalesRepModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchData(); // Recarregar dados após criação
        }}
      />
    </div>
  );
}