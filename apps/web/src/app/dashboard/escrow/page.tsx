'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

interface EscrowContract {
  id: string;
  name: string;
  url?: string;
  uploadedAt: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
  size: number;
}

interface EscrowYieldConfig {
  enabled: boolean;
  rate: number; // Annual percentage rate
  compounding: 'daily' | 'monthly' | 'quarterly';
  minimumAmount: number;
  autoReinvest: boolean;
}

interface EscrowTransaction {
  id: string;
  type: 'buyer' | 'seller' | 'mediator';
  role: 'created' | 'participating';
  amount: number;
  status: 'created' | 'funded' | 'disputed' | 'completed' | 'cancelled' | 'refunded';
  title: string;
  description: string;
  counterparty: string;
  counterpartyEmail: string;
  createdAt: string;
  dueDate?: string;
  releasedAt?: string;
  conditions: string[];
  mediator?: string;
  contracts: EscrowContract[];
  yieldConfig?: EscrowYieldConfig;
  currentYield?: number;
  categories: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
    amount?: number;
  }[];
  legalJurisdiction: string;
  currency: 'BRL' | 'USD' | 'EUR';
  fees: {
    transactionFee: number;
    mediationFee?: number;
    withdrawalFee: number;
  };
}

interface EscrowBalance {
  totalHeld: number;
  totalReleased: number;
  totalReceived: number;
  availableBalance: number;
  yieldEarned: number;
  pendingYield: number;
}

interface EscrowStatistics {
  completedTransactions: number;
  activeTransactions: number;
  disputedTransactions: number;
  totalVolume30Days: number;
  averageTransactionValue: number;
  successRate: number;
  averageCompletionTime: number; // in days
}

export default function EscrowPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history' | 'create'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [balance] = useState<EscrowBalance>({
    totalHeld: 15750.80,
    totalReleased: 98450.25,
    totalReceived: 45230.60,
    availableBalance: 8500.40,
    yieldEarned: 1234.56,
    pendingYield: 89.23
  });

  const [statistics] = useState<EscrowStatistics>({
    completedTransactions: 47,
    activeTransactions: 8,
    disputedTransactions: 2,
    totalVolume30Days: 32750.90,
    averageTransactionValue: 3245.67,
    successRate: 94.2,
    averageCompletionTime: 5.8
  });

  const [transactions] = useState<EscrowTransaction[]>([
    {
      id: '1',
      type: 'seller',
      role: 'created',
      amount: 5500.00,
      status: 'funded',
      title: 'Venda de Equipamento Tech',
      description: 'Notebook Dell XPS 13 + Acessórios',
      counterparty: 'João Comprador',
      counterpartyEmail: 'joao@exemplo.com',
      createdAt: '2024-01-15T10:30:00Z',
      dueDate: '2024-01-22T23:59:59Z',
      conditions: ['Entrega confirmada', 'Produto testado por 48h', 'Sem defeitos'],
      contracts: [
        { id: '1', name: 'Contrato_Venda_Dell.pdf', uploadedAt: '2024-01-15T10:30:00Z', type: 'pdf', size: 2458000 },
        { id: '2', name: 'Especificacoes_Tecnicas.pdf', uploadedAt: '2024-01-15T10:32:00Z', type: 'pdf', size: 1234000 }
      ],
      yieldConfig: {
        enabled: true,
        rate: 12.5,
        compounding: 'monthly',
        minimumAmount: 1000,
        autoReinvest: false
      },
      currentYield: 45.83,
      categories: ['Tecnologia', 'Equipamentos'],
      priority: 'medium',
      milestones: [
        { id: '1', title: 'Pagamento inicial (30%)', completed: true, completedAt: '2024-01-15T10:30:00Z', amount: 1650.00 },
        { id: '2', title: 'Entrega do produto', completed: false, amount: 3850.00 }
      ],
      legalJurisdiction: 'Brasil - São Paulo',
      currency: 'BRL',
      fees: {
        transactionFee: 55.00,
        mediationFee: 110.00,
        withdrawalFee: 15.00
      }
    },
    {
      id: '2',
      type: 'buyer',
      role: 'participating',
      amount: 2800.50,
      status: 'completed',
      title: 'Compra de Software',
      description: 'Licença perpétua Adobe Creative Suite',
      counterparty: 'TechSoft Ltda',
      counterpartyEmail: 'contato@techsoft.com',
      createdAt: '2024-01-10T14:20:00Z',
      releasedAt: '2024-01-12T16:45:00Z',
      conditions: ['Licença válida', 'Transferência confirmada'],
      contracts: [
        { id: '3', name: 'Licenca_Adobe_CS.pdf', uploadedAt: '2024-01-10T14:20:00Z', type: 'pdf', size: 890000 }
      ],
      yieldConfig: {
        enabled: false,
        rate: 0,
        compounding: 'monthly',
        minimumAmount: 1000,
        autoReinvest: false
      },
      currentYield: 23.45,
      categories: ['Software', 'Licenças'],
      priority: 'low',
      milestones: [
        { id: '3', title: 'Transferência de licença', completed: true, completedAt: '2024-01-12T16:45:00Z', amount: 2800.50 }
      ],
      legalJurisdiction: 'Brasil - São Paulo',
      currency: 'BRL',
      fees: {
        transactionFee: 28.00,
        withdrawalFee: 10.00
      }
    },
    {
      id: '3',
      type: 'seller',
      role: 'created',
      amount: 12500.00,
      status: 'disputed',
      title: 'Desenvolvimento de Website',
      description: 'Site institucional + E-commerce',
      counterparty: 'Cliente Empresa SA',
      counterpartyEmail: 'projetos@empresa.com.br',
      createdAt: '2024-01-08T09:15:00Z',
      conditions: ['Projeto finalizado', 'Deploy realizado', 'Aprovação do cliente'],
      mediator: 'Dr. Carlos Medeiros - OAB/SP 123456',
      contracts: [
        { id: '4', name: 'Proposta_Comercial.pdf', uploadedAt: '2024-01-08T09:15:00Z', type: 'pdf', size: 3456000 },
        { id: '5', name: 'Especificacoes_Funcionais.docx', uploadedAt: '2024-01-08T09:18:00Z', type: 'doc', size: 2100000 },
        { id: '6', name: 'Layout_Aprovado.png', uploadedAt: '2024-01-08T09:20:00Z', type: 'image', size: 5600000 }
      ],
      yieldConfig: {
        enabled: true,
        rate: 15.0,
        compounding: 'quarterly',
        minimumAmount: 5000,
        autoReinvest: true
      },
      currentYield: 187.50,
      categories: ['Desenvolvimento', 'Web', 'E-commerce'],
      priority: 'high',
      milestones: [
        { id: '7', title: 'Wireframes aprovados', completed: true, completedAt: '2024-01-08T09:15:00Z', amount: 2500.00 },
        { id: '8', title: 'Design aprovado', completed: true, completedAt: '2024-01-10T14:30:00Z', amount: 3750.00 },
        { id: '9', title: 'Desenvolvimento backend', completed: false, amount: 3750.00 },
        { id: '10', title: 'Deploy e aprovação final', completed: false, amount: 2500.00 }
      ],
      legalJurisdiction: 'Brasil - São Paulo',
      currency: 'BRL',
      fees: {
        transactionFee: 125.00,
        mediationFee: 625.00,
        withdrawalFee: 25.00
      }
    }
  ]);

  useEffect(() => {
    loadEscrowData();
  }, []);

  const loadEscrowData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulating API calls - replace with actual API endpoints
      setTimeout(() => {
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error loading escrow data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados escrow');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'funded': return 'text-blue-700 bg-blue-100';
      case 'disputed': return 'text-yellow-700 bg-yellow-100';
      case 'cancelled': return 'text-red-700 bg-red-100';
      case 'created': return 'text-gray-700 bg-gray-100';
      case 'refunded': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'created': 'Criada',
      'funded': 'Financiada',
      'disputed': 'Em Disputa',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
      'refunded': 'Reembolsada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Erro ao carregar dados</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadEscrowData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Conta Escrow</h1>
            <p className="text-gray-600 mt-1">Gerencie transações seguras com custódia de valores</p>
          </div>
        </div>

        {/* Escrow Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Saldo em Custódia</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {formatCurrency(balance.totalHeld)}
            </div>
            <p className="text-sm text-gray-500">Valores retidos em {statistics.activeTransactions} transações ativas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Rendimentos Acumulados</h2>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(balance.yieldEarned)}
            </div>
            <p className="text-sm text-gray-500">+ {formatCurrency(balance.pendingYield)} pendentes</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Taxa de Sucesso</h2>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {statistics.successRate}%
            </div>
            <p className="text-sm text-gray-500">Média de {statistics.averageCompletionTime} dias por transação</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Visão Geral' },
              { key: 'active', label: 'Transações Ativas' },
              { key: 'history', label: 'Histórico' },
              { key: 'create', label: 'Nova Transação' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Transações Ativas</p>
                    <p className="text-xl font-bold text-black">{statistics.activeTransactions}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Concluídas</p>
                    <p className="text-xl font-bold text-black">{statistics.completedTransactions}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Em Disputa</p>
                    <p className="text-xl font-bold text-black">{statistics.disputedTransactions}</p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Volume (30 dias)</p>
                    <p className="text-xl font-bold text-black">{formatCurrency(statistics.totalVolume30Days)}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Management */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-black flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Gestão de Contratos</span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {transactions.filter(t => t.contracts.length > 0).slice(0, 3).map((transaction) => (
                      <div key={transaction.id}>
                        <p className="text-sm font-medium text-black">{transaction.title}</p>
                        <div className="mt-1 space-y-1">
                          {transaction.contracts.slice(0, 2).map((contract) => (
                            <div key={contract.id} className="flex items-center text-xs text-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {contract.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                    Ver todos os contratos →
                  </button>
                </div>
              </div>

              {/* Yield Configuration */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-black flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Rendimentos Ativos</span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {transactions.filter(t => t.yieldConfig?.enabled).slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">{transaction.title}</p>
                          <p className="text-xs text-gray-600">
                            {transaction.yieldConfig?.rate}% a.a. • {transaction.yieldConfig?.compounding}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            +{formatCurrency(transaction.currentYield || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-sm text-green-600 hover:text-green-800">
                    Configurar rendimentos →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Transações Ativas</h2>
                <div className="text-sm text-gray-500">
                  {statistics.activeTransactions} transações em andamento
                </div>
              </div>
            </div>

            {transactions.filter(t => ['funded', 'disputed', 'created'].includes(t.status)).map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">{transaction.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{transaction.description}</p>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{transaction.counterparty}</span> •
                      <span className="ml-1 capitalize">
                        {transaction.type === 'buyer' ? 'Comprador' : transaction.type === 'seller' ? 'Vendedor' : 'Mediador'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black mb-1">
                      {formatCurrency(transaction.amount)}
                    </div>
                    {transaction.dueDate && (
                      <div className="text-xs text-gray-500">
                        Vence: {formatDate(transaction.dueDate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Condições para Liberação:</h4>
                  <ul className="space-y-1">
                    {transaction.conditions.map((condition, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Ver Detalhes</span>
                  </button>
                  {transaction.status === 'funded' && transaction.type === 'seller' && (
                    <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Solicitar Liberação
                    </button>
                  )}
                  {transaction.status === 'funded' && transaction.type === 'buyer' && (
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Confirmar Recebimento
                    </button>
                  )}
                  {transaction.status === 'disputed' && (
                    <button className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                      Acompanhar Disputa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <h2 className="text-lg font-semibold text-black">Histórico de Transações</h2>
                <div className="flex space-x-3">
                  <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:border-black">
                    <option>Todas</option>
                    <option>Concluídas</option>
                    <option>Canceladas</option>
                    <option>Reembolsadas</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:border-black">
                    <option>Últimos 30 dias</option>
                    <option>Últimos 90 dias</option>
                    <option>Este ano</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-black">{transaction.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusText(transaction.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>{transaction.counterparty}</span>
                            </span>
                            <span>Criada: {formatDate(transaction.createdAt)}</span>
                            {transaction.releasedAt && (
                              <span>Liberada: {formatDate(transaction.releasedAt)}</span>
                            )}
                            <span className="capitalize">
                              {transaction.type === 'buyer' ? 'Comprador' : transaction.type === 'seller' ? 'Vendedor' : 'Mediador'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-semibold text-black">
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-black mb-2">Nova Transação Escrow Profissional</h2>
                <p className="text-gray-600">Crie uma nova transação com custódia segura, contratos anexados e configuração de rendimentos.</p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Saldo disponível:</strong> {formatCurrency(balance.availableBalance)}
                  </p>
                </div>
              </div>

              <form className="space-y-8">
                {/* Informações Básicas */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Título da Transação *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="Ex: Desenvolvimento de Sistema E-commerce"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Categoria</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors">
                        <option value="">Selecione a categoria</option>
                        <option value="desenvolvimento">Desenvolvimento</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="consultoria">Consultoria</option>
                        <option value="vendas">Vendas</option>
                        <option value="servicos">Serviços</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Valor Total *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Moeda</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors">
                        <option value="BRL">BRL - Real</option>
                        <option value="USD">USD - Dólar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Prioridade</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors">
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-black mb-2">Descrição Detalhada *</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors resize-none"
                      rows={4}
                      placeholder="Descreva detalhadamente o que está sendo negociado, incluindo objetivos, entregas esperadas e critérios de qualidade..."
                    />
                  </div>
                </div>

                {/* Contratos e Documentos */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Contratos e Documentos</span>
                  </h3>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-black">
                          Anexar contratos, propostas, especificações
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PDF, DOC, DOCX, PNG, JPG até 10MB cada
                        </span>
                      </label>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                    </div>
                    <p className="mt-2">
                      <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                        Escolher arquivos
                      </button>
                      <span className="text-gray-500"> ou arraste e solte aqui</span>
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-black mb-2">Jurisdição Legal</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors">
                      <option value="">Selecione a jurisdição</option>
                      <option value="brasil-sp">Brasil - São Paulo</option>
                      <option value="brasil-rj">Brasil - Rio de Janeiro</option>
                      <option value="brasil-mg">Brasil - Minas Gerais</option>
                      <option value="brasil-rs">Brasil - Rio Grande do Sul</option>
                      <option value="brasil-pr">Brasil - Paraná</option>
                      <option value="internacional">Internacional</option>
                    </select>
                  </div>
                </div>

                {/* Configuração de Rendimentos */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Configuração de Rendimentos</span>
                  </h3>

                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="enableYield"
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="enableYield" className="text-sm font-medium text-black">
                      Ativar rendimentos sobre o valor em custódia
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Taxa Anual (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="12.50"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Capitalização</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors" disabled>
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="daily">Diária</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Valor Mínimo</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="1000.00"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="mt-4 opacity-50">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoReinvest"
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled
                      />
                      <label htmlFor="autoReinvest" className="text-sm font-medium text-black">
                        Reinvestir rendimentos automaticamente
                      </label>
                    </div>
                  </div>
                </div>

                {/* Partes Envolvidas e Prazos */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Partes Envolvidas e Prazos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Email da Contraparte *</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="contraparte@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Nome/Empresa da Contraparte</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="Nome ou Empresa Ltda"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Data de Início</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Prazo para Conclusão *</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Marcos e Condições */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Marcos e Condições para Liberação</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="Ex: Entrega do wireframe aprovado"
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="% valor"
                      />
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="Ex: Desenvolvimento backend concluído"
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                        placeholder="% valor"
                      />
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Adicionar marco</span>
                    </button>
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-black mb-4">Configurações Avançadas</h3>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="mediator"
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <label htmlFor="mediator" className="text-sm font-medium text-black">
                        Solicitar mediador profissional para possíveis disputas
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notifications"
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        defaultChecked
                      />
                      <label htmlFor="notifications" className="text-sm font-medium text-black">
                        Enviar notificações por email sobre atualizações da transação
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autorelease"
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <label htmlFor="autorelease" className="text-sm font-medium text-black">
                        Liberação automática após prazo sem disputas (7 dias após conclusão)
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800">Taxas Estimadas</h4>
                        <ul className="mt-1 text-xs text-yellow-700 space-y-1">
                          <li>• Taxa de transação: 1% do valor</li>
                          <li>• Taxa de mediação (se solicitada): 5% do valor</li>
                          <li>• Taxa de saque: R$ 25,00</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Salvar como Rascunho
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Criar Transação Escrow Profissional
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}