'use client';

import { useState, useEffect } from 'react';

interface Investment {
  id: string;
  planName: string;
  planDescription: string;
  principalAmount: number;
  currentValue: number;
  totalYieldEarned: number;
  yieldPercentage: number;
  status: string;
  createdAt: string;
  daysSinceApplication: number;
  isLocked: boolean;
  daysUntilUnlock: number;
  canWithdrawEarly: boolean;
  earlyWithdrawFee: number | null;
  dailyYieldRate: number;
  annualYieldRate: number;
  recentYields: Array<{
    date: string;
    amount: number;
    type: string;
  }>;
}

interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  totalYields: number;
  totalReturn: number;
  activeInvestments: number;
  pendingInvestments: number;
}

export default function InvestmentPortfolio() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalInvested: 0,
    currentValue: 0,
    totalYields: 0,
    totalReturn: 0,
    activeInvestments: 0,
    pendingInvestments: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      const response = await fetch('/api/investments/user-investments');
      const result = await response.json();
      
      if (result.success) {
        setInvestments(result.investments);
        setPortfolioStats(result.portfolioStats);
      } else {
        console.error('Error loading investments:', result.error);
      }
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', text: 'Ativo' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      'COMPLETED': { color: 'bg-blue-100 text-blue-800', text: 'Concluído' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', text: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-black mb-4">Resumo do Portfólio</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor Investido</p>
            <p className="text-lg font-bold text-black">{formatCurrency(portfolioStats.totalInvested)} USDT</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor Atual</p>
            <p className="text-lg font-bold text-black">{formatCurrency(portfolioStats.currentValue)} USDT</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Rendimentos</p>
            <p className="text-lg font-bold text-green-600">+{formatCurrency(portfolioStats.totalYields)} USDT</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Rentabilidade</p>
            <p className={`text-lg font-bold ${portfolioStats.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioStats.totalReturn >= 0 ? '+' : ''}{portfolioStats.totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>

        {portfolioStats.activeInvestments > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {portfolioStats.activeInvestments} investimento{portfolioStats.activeInvestments > 1 ? 's' : ''} ativo{portfolioStats.activeInvestments > 1 ? 's' : ''}
              </span>
              {portfolioStats.pendingInvestments > 0 && (
                <span className="text-yellow-600">
                  {portfolioStats.pendingInvestments} pendente{portfolioStats.pendingInvestments > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Investment List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-black mb-4">Meus Investimentos</h2>
        
        {investments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-gray-500">Você ainda não possui investimentos</p>
            <p className="text-sm text-gray-400 mt-1">Comece investindo em USDT com rendimentos atrativos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => setSelectedInvestment(investment)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-black">{investment.planName}</h3>
                    <p className="text-sm text-gray-600">{investment.planDescription}</p>
                  </div>
                  {getStatusBadge(investment.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Valor Investido</p>
                    <p className="font-medium">{formatCurrency(investment.principalAmount)} USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor Atual</p>
                    <p className="font-medium">{formatCurrency(investment.currentValue)} USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rendimento</p>
                    <p className="font-medium text-green-600">+{formatCurrency(investment.totalYieldEarned)} USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rentabilidade</p>
                    <p className={`font-medium ${investment.yieldPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      +{investment.yieldPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <span>{investment.daysSinceApplication} dias de aplicação</span>
                  <span>
                    {investment.isLocked ? (
                      `Bloqueado por mais ${investment.daysUntilUnlock} dias`
                    ) : (
                      'Disponível para saque'
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investment Detail Modal */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedInvestment(null)}></div>
            
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-black">Detalhes do Investimento</h3>
                <button
                  onClick={() => setSelectedInvestment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-black mb-3">{selectedInvestment.planName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Valor Investido</p>
                      <p className="font-medium text-lg">{formatCurrency(selectedInvestment.principalAmount)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor Atual</p>
                      <p className="font-medium text-lg">{formatCurrency(selectedInvestment.currentValue)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rendimento Total</p>
                      <p className="font-medium text-lg text-green-600">+{formatCurrency(selectedInvestment.totalYieldEarned)} USDT</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rentabilidade</p>
                      <p className="font-medium text-lg text-green-600">+{selectedInvestment.yieldPercentage.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                {/* Yield Information */}
                <div>
                  <h4 className="font-semibold text-black mb-3">Informações de Rendimento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-800 font-medium">Taxa Diária</p>
                      <p className="text-blue-900 text-lg">{(selectedInvestment.dailyYieldRate * 100).toFixed(4)}%</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-green-800 font-medium">Taxa Anual</p>
                      <p className="text-green-900 text-lg">{(selectedInvestment.annualYieldRate * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                {/* Recent Yields */}
                {selectedInvestment.recentYields.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-black mb-3">Rendimentos Recentes</h4>
                    <div className="space-y-2">
                      {selectedInvestment.recentYields.map((yield_, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">
                            {new Date(yield_.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            +{formatCurrency(yield_.amount)} USDT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {getStatusBadge(selectedInvestment.status)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {selectedInvestment.isLocked ? (
                          <>Disponível em {selectedInvestment.daysUntilUnlock} dias</>
                        ) : (
                          'Disponível para saque'
                        )}
                      </p>
                      {selectedInvestment.canWithdrawEarly && selectedInvestment.isLocked && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Saque antecipado: taxa de {(selectedInvestment.earlyWithdrawFee! * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}