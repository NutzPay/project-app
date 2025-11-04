'use client';

import { useState, useEffect } from 'react';

export default function MoneyActions() {
  const [showPixModal, setShowPixModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [pixAmount, setPixAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payoutData, setPayoutData] = useState({
    network: 'TRC20',
    address: '',
    amount: '',
  });

  // Calcular preço em tempo real
  const calculatePrice = async (usdt?: string, brl?: string) => {
    if ((!usdt || parseFloat(usdt) <= 0) && (!brl || parseFloat(brl) <= 0)) {
      setPriceCalculation(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (usdt) params.append('usdt', usdt);
      if (brl) params.append('brl', brl);

      const response = await fetch(`/api/usdt/calculate-price?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPriceCalculation(data);
      } else {
        console.error('Error calculating price:', data.error);
        setPriceCalculation(null);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setPriceCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  // Calcular quando USDT amount mudar
  useEffect(() => {
    if (usdtAmount && parseFloat(usdtAmount) > 0) {
      const timeoutId = setTimeout(() => {
        calculatePrice(usdtAmount);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPriceCalculation(null);
    }
  }, [usdtAmount]);

  // Calcular quando PIX amount mudar  
  useEffect(() => {
    if (pixAmount && parseFloat(pixAmount) > 0) {
      const timeoutId = setTimeout(() => {
        calculatePrice(undefined, pixAmount);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (!pixAmount) {
      setPriceCalculation(null);
    }
  }, [pixAmount]);

  const handlePixSubmit = async () => {
    if (!priceCalculation?.calculation) return;

    setLoading(true);
    try {
      console.log('PIX payment requested:', {
        brlAmount: priceCalculation.calculation.finalPrice,
        usdtAmount: priceCalculation.calculation.usdtAmount
      });

      const response = await fetch('/api/usdt/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          brlAmount: priceCalculation.calculation.finalPrice,
          usdtAmount: priceCalculation.calculation.usdtAmount,
          exchangeRate: priceCalculation.calculation.pricePerUsdt,
          payerName: 'Usuário Seller', // TODO: Pegar do perfil do usuário
          payerDocument: '000.000.000-00' // TODO: Pegar do perfil do usuário
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ PIX generated successfully:', data);
        // TODO: Mostrar QR Code PIX para o usuário
        // Pode redirecionar para página de pagamento ou mostrar modal com QR Code
        alert(`PIX gerado! Valor: ${priceCalculation.formatted.finalPrice}\nTransação ID: ${data.transactionId}`);
        setShowPixModal(false);
      } else {
        console.error('❌ Error creating PIX:', data.error);
        alert(`Erro ao gerar PIX: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting PIX:', error);
      alert('Erro interno ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSubmit = () => {
    // Create payout request with 2h SLA
    console.log('Payout requested:', payoutData);
    // Here we would integrate with crypto payout API
    setShowPayoutModal(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PIX to USDT Card - Destaque principal */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/50 shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-lg">Adicionar Fundos</h3>
                <p className="text-gray-600 text-sm">PIX → USDT (Instantâneo)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm border border-indigo-200/30 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-2">Como funciona</h4>
                <ol className="text-sm text-indigo-700 space-y-1">
                  <li>1. Informe o valor em BRL</li>
                  <li>2. Escaneie o QR Code PIX</li>
                  <li>3. Receba USDT automaticamente</li>
                </ol>
              </div>

              <button
                onClick={() => setShowPixModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                Gerar Cobrança PIX
              </button>
            </div>
          </div>
        </div>

        {/* USDT Payout Card */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/50 shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-lg">Receber USDT</h3>
              <p className="text-gray-600 text-sm">Payout em até 2h</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm border border-purple-200/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-purple-800">SLA de até 2 horas</span>
              </div>
              <p className="text-sm text-purple-700">
                Redes suportadas: TRC20, ERC20, BSC
              </p>
            </div>

            <button
              onClick={() => setShowPayoutModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
              Solicitar Payout
            </button>
          </div>
        </div>
      </div>

      {/* PIX Modal */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Adicionar Fundos via PIX</h2>
              <p className="text-gray-600 mt-1">Converta BRL para USDT automaticamente</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Tabs para escolher método de entrada */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setUsdtAmount('');
                    setPriceCalculation(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    !usdtAmount ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Valor em BRL
                </button>
                <button
                  onClick={() => {
                    setPixAmount('');
                    setPriceCalculation(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    usdtAmount && !pixAmount ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Quantidade USDT
                </button>
              </div>

              {!usdtAmount ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quanto você quer gastar em BRL?
                  </label>
                  <input
                    type="number"
                    value={pixAmount}
                    onChange={(e) => setPixAmount(e.target.value)}
                    placeholder="Ex: 1000.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantos USDT você quer comprar?
                  </label>
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="Ex: 100.00"
                    step="0.000001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {loading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              )}

              {priceCalculation && !loading && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">💰 Resumo da Conversão</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Cotação USDT:</span>
                      <span className="font-medium">{priceCalculation.formatted.pricePerUsdt.replace(' USDT', '')} / USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Taxa do seller:</span>
                      <span className="font-medium">{priceCalculation.calculation.sellerFee}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">USDT a receber:</span>
                      <span className="font-medium text-green-600">{priceCalculation.formatted.usdtAmount}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between">
                      <span className="font-semibold text-blue-800">💳 Total a pagar no PIX:</span>
                      <span className="font-bold text-lg text-blue-900">{priceCalculation.formatted.finalPrice}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-600">
                      ℹ️ Preço baseado na cotação CoinMarketCap + taxa personalizada
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> O USDT será creditado automaticamente após confirmação do pagamento PIX.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowPixModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePixSubmit}
                disabled={!priceCalculation || loading || (!pixAmount && !usdtAmount) || (pixAmount && parseFloat(pixAmount) <= 0) || (usdtAmount && parseFloat(usdtAmount) <= 0)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculando...' : 
                 priceCalculation ? 
                   `Pagar ${priceCalculation.formatted.finalPrice} no PIX` : 
                   'Calcule o preço primeiro'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Solicitar Payout USDT</h2>
              <p className="text-gray-600 mt-1">SLA de até 2 horas para processamento</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rede
                </label>
                <select
                  value={payoutData.network}
                  onChange={(e) => setPayoutData({...payoutData, network: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="TRC20">TRC20 (Tron)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="BSC">BSC (Binance Smart Chain)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço de Destino
                </label>
                <input
                  type="text"
                  value={payoutData.address}
                  onChange={(e) => setPayoutData({...payoutData, address: e.target.value})}
                  placeholder="Ex: TQn9Y2khEsLMG73Knh8kn7LnvQm..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (USDT)
                </label>
                <input
                  type="number"
                  value={payoutData.amount}
                  onChange={(e) => setPayoutData({...payoutData, amount: e.target.value})}
                  placeholder="Ex: 100.00"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-purple-800">SLA de Processamento</span>
                </div>
                <p className="text-sm text-purple-700">
                  Sua solicitação será processada em até 2 horas. Você receberá notificações sobre o status.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayoutSubmit}
                disabled={!payoutData.address || !payoutData.amount || parseFloat(payoutData.amount) <= 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Solicitar Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}