'use client';

import { useState } from 'react';

export default function InvestmentOffer() {
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const handleInvest = () => {
    setShowInvestModal(true);
  };

  const handleSimulation = () => {
    setShowSimulationModal(true);
  };

  const handleConfirmInvestment = () => {
    // Here we would integrate with the investment logic
    console.log('Investment confirmed:', investmentAmount);
    setShowInvestModal(false);
    setInvestmentAmount('');
  };

  return (
    <>
      {/* Investment Offer Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-2xl border border-green-700/50 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-32 -translate-x-32"></div>
        
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Oportunidade de Investimento</h3>
              <p className="text-green-200 text-sm">USDT forte. Cripto em alta. Invista com referência clara.</p>
            </div>
          </div>

          {/* Investment Details */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 border border-green-600/30">
            <div className="text-center space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">300% do CDI</h4>
                <p className="text-green-200 text-sm">com piso 0% ao mês</p>
              </div>
              
              <div className="flex justify-center items-center space-x-2 text-xs text-green-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Aplicável apenas quando CDI for positivo</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-600/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-200">Limite disponível:</span>
                <span className="text-white font-semibold">10.000 USDT</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleInvest}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25"
            >
              Aplicar Agora
            </button>
            
            <button
              onClick={handleSimulation}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl border border-green-600/50 hover:border-green-500 transition-all duration-300 backdrop-blur-sm"
            >
              Ver Simulação
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-green-300/70 text-xs text-center mt-4">
            Simulações meramente ilustrativas. Rentabilidade passada não garante resultados futuros.
          </p>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Fazer Investimento</h2>
              <p className="text-gray-600 mt-1">300% do CDI com piso 0% ao mês</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Investimento (USDT)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Ex: 1000"
                  max="10000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Limite máximo: 10.000 USDT</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Resumo do Investimento</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Valor:</span>
                    <span className="font-medium">{investmentAmount || '0'} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Rendimento:</span>
                    <span className="font-medium">300% do CDI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Piso mínimo:</span>
                    <span className="font-medium">0% ao mês</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowInvestModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmInvestment}
                disabled={!investmentAmount || parseFloat(investmentAmount) <= 0 || parseFloat(investmentAmount) > 10000}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Investimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Simulação de Investimento</h2>
                <button
                  onClick={() => setShowSimulationModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">CDI Real vs 300% CDI</h3>
                  <div className="space-y-2">
                    {[
                      { month: 'Jan 2024', cdi: '0.42%', investment: '1.26%' },
                      { month: 'Fev 2024', cdi: '-0.12%', investment: '0.00%' },
                      { month: 'Mar 2024', cdi: '0.83%', investment: '2.49%' },
                      { month: 'Abr 2024', cdi: '0.57%', investment: '1.71%' },
                      { month: 'Mai 2024', cdi: '0.25%', investment: '0.75%' },
                      { month: 'Jun 2024', cdi: '-0.08%', investment: '0.00%' },
                    ].map((data, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{data.month}</span>
                        <div className="flex space-x-4">
                          <span className="text-sm">{data.cdi}</span>
                          <span className={`text-sm font-medium ${parseFloat(data.investment) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {data.investment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Projeção para 10.000 USDT</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor inicial:</span>
                        <span className="font-medium">10.000 USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rendimento acumulado (6m):</span>
                        <span className="font-medium text-green-600">+621 USDT</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total projetado:</span>
                        <span className="font-bold text-green-600">10.621 USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Gráfico de Performance (Mock)</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Esta simulação é meramente ilustrativa e baseada em dados históricos. 
                  O rendimento real pode variar conforme as oscilações do CDI. Quando negativo, o rendimento será 0%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}