'use client';

import { useState, useEffect } from 'react';
import { formatBRL, formatCrypto, formatCurrency } from '@/lib/currency';
import InvestmentModal from '../modals/InvestmentModal';

interface USDTInvestmentCardProps {
  userBalance?: number;
  onInvestmentSuccess?: () => void;
}

export default function USDTInvestmentCard({ 
  userBalance = 0, 
  onInvestmentSuccess 
}: USDTInvestmentCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, data: any} | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'6M' | '1Y' | '2Y'>('1Y');
  const [chartAnimated, setChartAnimated] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentSummary, setInvestmentSummary] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalYield: 0,
    activeInvestments: 0
  });
  const [cdiData, setCdiData] = useState<any>(null);
  const [usdtPriceData, setUsdtPriceData] = useState<any>(null);
  const [simulationAmount, setSimulationAmount] = useState('10000');
  const [simulationPeriod, setSimulationPeriod] = useState('6');

  // Função para formatar número com vírgulas
  const formatNumber = (value: string) => {
    // Remove tudo que não for dígito
    const numericValue = value.replace(/\D/g, '');
    // Adiciona vírgulas nos milhares
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Função para converter valor formatado para número
  const parseFormattedNumber = (value: string) => {
    return value.replace(/,/g, '');
  };
  
  // Dados da cotação USDT - usa dados reais da API quando disponíveis
  const usdtData = usdtPriceData ? {
    currentPrice: usdtPriceData.currentPrice || 5.42,
    change24h: usdtPriceData.change24h || 0.37,
    changePercent24h: usdtPriceData.changePercent24h || 0.37,
    lastUpdate: usdtPriceData.lastUpdate || new Date().toLocaleString('pt-BR')
  } : {
    currentPrice: 5.42,
    change24h: 0.02,
    changePercent24h: 0.37,
    lastUpdate: new Date().toLocaleString('pt-BR')
  };

  // Função para gerar dados históricos realistas baseados no preço atual
  const generateRealisticHistoricalData = (currentPrice: number, period: '6M' | '1Y' | '2Y') => {
    const monthsMap = {
      '6M': 6,
      '1Y': 12,
      '2Y': 24
    };
    
    const months = monthsMap[period];
    const data = [];
    const now = new Date();
    
    // Simulação de volatilidade USDT baseada em dados reais (baixa volatilidade)
    const baseVolatility = 0.02; // 2% volatilidade base
    const trend = -0.001; // Tendência muito leve de desvalorização ao longo do tempo
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Gera variação baseada em:
      // - Tendência temporal leve
      // - Volatilidade natural do USDT
      // - Alguns "eventos" aleatórios de maior variação
      const timeEffect = trend * i;
      const randomVolatility = (Math.random() - 0.5) * baseVolatility * 2;
      const eventEffect = Math.random() < 0.15 ? (Math.random() - 0.5) * 0.05 : 0; // 15% chance de evento maior
      
      const priceVariation = timeEffect + randomVolatility + eventEffect;
      const price = currentPrice * (1 + priceVariation);
      
      data.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        price: Math.max(price, currentPrice * 0.85), // Não deixa cair mais que 15%
        fullMonth: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        date: date.toISOString().split('T')[0]
      });
    }
    
    return data;
  };

  // Dados históricos estáveis com melhor distribuição
  const getHistoricalData = () => {
    const monthsMap = { '6M': 6, '1Y': 12, '2Y': 24 };
    const months = monthsMap[selectedPeriod];
    const basePrice = usdtData.currentPrice;

    // Padrões de preços diferentes para cada período para melhor visualização
    const pricePatterns = {
      '6M': [0.98, 0.96, 1.01, 0.99, 1.02, 1.00],
      '1Y': [0.94, 0.97, 0.95, 1.03, 1.01, 0.98, 1.04, 0.96, 1.02, 0.99, 1.05, 1.00],
      '2Y': [0.92, 0.95, 0.93, 0.97, 0.99, 0.96, 1.01, 0.98, 1.03, 1.00, 0.97, 1.04, 0.99, 1.02, 0.98, 1.05, 0.97, 1.01, 0.99, 1.03, 0.98, 1.02, 1.01, 1.00]
    };

    const pattern = pricePatterns[selectedPeriod];
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));

      // Usa padrão específico do período
      const priceMultiplier = pattern[i] || 1.00;
      const price = basePrice * priceMultiplier;

      data.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        price: price,
        fullMonth: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    return data;
  };

  const historicalData = getHistoricalData();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    loadUserInvestments();
    loadCDIData();
    loadUSDTPrice();
    
    // Atualizar preço USDT a cada 10 segundos
    const priceUpdateInterval = setInterval(() => {
      loadUSDTPrice();
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(priceUpdateInterval);
    };
  }, []);

  useEffect(() => {
    if (showChart) {
      setTimeout(() => setChartAnimated(true), 100);
    } else {
      setChartAnimated(false);
    }
  }, [showChart]);

  const loadUserInvestments = async () => {
    try {
      const response = await fetch('/api/investments/user-investments');
      const result = await response.json();
      
      if (result.success) {
        setInvestments(result.investments);
        setInvestmentSummary({
          totalInvested: result.portfolioStats.totalInvested,
          currentValue: result.portfolioStats.currentValue,
          totalYield: result.portfolioStats.totalYields,
          activeInvestments: result.portfolioStats.activeInvestments
        });
      } else {
        console.error('Error loading investments:', result.error);
      }
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  const loadCDIData = async () => {
    try {
      const response = await fetch('/api/cdi/current-rate');
      const result = await response.json();
      
      if (result.success) {
        setCdiData(result.data);
      } else {
        console.error('Error loading CDI data:', result.error);
      }
    } catch (error) {
      console.error('Error loading CDI data:', error);
    }
  };

  const loadUSDTPrice = async () => {
    try {
      const response = await fetch('/api/crypto/coinmarketcap?convert=BRL');
      const result = await response.json();
      
      console.log('🪙 USDT API Response:', result);
      
      if (result.success && result.data && result.data.USDT) {
        console.log('💰 Setting USDT price:', result.data.USDT.currentPrice);
        // Calcular o percentual baseado no preço anterior
        const currentPrice = result.data.USDT.currentPrice;
        const change24h = result.data.USDT.change24h;
        const previousPrice = currentPrice / (1 + change24h);
        const changePercent24h = ((currentPrice - previousPrice) / previousPrice) * 100;

        setUsdtPriceData({
          currentPrice: currentPrice,
          change24h: change24h,
          changePercent24h: changePercent24h,
          lastUpdate: result.data.USDT.lastUpdate
        });
      } else {
        console.error('Error loading USDT price:', result.error);
      }
    } catch (error) {
      console.error('Error loading USDT price:', error);
    }
  };

  const handleInvest = () => {
    setShowInvestModal(true);
  };

  const handleSimulation = () => {
    setShowSimulationModal(true);
  };

  const handleInvestmentSuccess = () => {
    // Recarregar dados dos investimentos
    loadUserInvestments();
    // Notificar componente pai se houver callback
    if (onInvestmentSuccess) {
      onInvestmentSuccess();
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isPositive = usdtData.changePercent24h >= 0;
  const minPrice = Math.min(...historicalData.map(d => d.price));
  const maxPrice = Math.max(...historicalData.map(d => d.price));

  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header Compacto */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₮</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Aplicação em USDT</h3>
                <p className="text-gray-600 text-xs">
                  {formatBRL(usdtData.currentPrice, { maximumFractionDigits: 3 })} • 300% CDI
                  {cdiData && (
                    <span className="ml-1">({cdiData.cdi.annualPercentage}%)</span>
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowChart(!showChart)}
              className="p-1.5 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Ver gráfico"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>

          {/* Layout Compacto - Mobile First */}
          <div className="space-y-3">
            {/* Info Compacta em uma linha */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  isPositive 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {isPositive ? '+' : ''}{usdtData.changePercent24h.toFixed(2)}%
                </span>
                <span className="text-gray-500">24h</span>
              </div>
              <span className="text-gray-600">Limite: 10.000 USDT</span>
            </div>

            {/* Botões de Ação Compactos */}
            <div className="flex gap-2">
              <button
                onClick={handleInvest}
                className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Aplicar
              </button>
              
              <button
                onClick={handleSimulation}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-200 transition-colors text-sm"
              >
                Simular
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico Minimalista */}
        {showChart && (
          <div className="border-t border-gray-200 bg-white">
            {/* Header clean */}
            <div className="p-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Histórico {selectedPeriod === '6M' ? '6M' : selectedPeriod}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {formatBRL(minPrice)} - {formatBRL(maxPrice)}
                  </div>
                </div>
                
                {/* Seletor minimalista */}
                <div className="flex border border-gray-200 rounded-md overflow-hidden">
                  {(['6M', '1Y', '2Y'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        selectedPeriod === period
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico ultra clean */}
            <div className="p-4">
              <div className="relative h-24 bg-white">
                <svg className="w-full h-full" viewBox="0 0 280 60" preserveAspectRatio="none">
                  {/* Grid minimal */}
                  <defs>
                    <pattern id="grid-minimal" width="40" height="15" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 15" fill="none" stroke="#f3f4f6" strokeWidth="0.5" opacity="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="280" height="60" fill="url(#grid-minimal)" />
                  
                  {/* Linha única e clean */}
                  <polyline
                    fill="none"
                    stroke="#374151"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={historicalData.map((point, index) => {
                      const x = (index / (historicalData.length - 1)) * 260 + 10;
                      const y = 50 - ((point.price - minPrice) / (maxPrice - minPrice)) * 40;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  
                  {/* Pontos minimal */}
                  {historicalData.map((point, index) => {
                    const x = (index / (historicalData.length - 1)) * 260 + 10;
                    const y = 50 - ((point.price - minPrice) / (maxPrice - minPrice)) * 40;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#374151"
                        className="cursor-pointer opacity-60 hover:opacity-100 hover:r-3 transition-all"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredPoint({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 5,
                            data: point
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}
                </svg>
                
                {/* Tooltip minimal */}
                {hoveredPoint && (
                  <div 
                    className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none"
                    style={{
                      left: `${hoveredPoint.x}px`,
                      top: `${hoveredPoint.y}px`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div>{hoveredPoint.data.month}: {formatBRL(hoveredPoint.data.price)}</div>
                  </div>
                )}
              </div>

              {/* Labels minimal */}
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{historicalData[0]?.month}</span>
                <span>{historicalData[Math.floor(historicalData.length / 2)]?.month}</span>
                <span>{historicalData[historicalData.length - 1]?.month}</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Simulation Modal */}
      {showSimulationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-fit">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Simulação Aplicação USDT</h2>
                <button
                  onClick={() => setShowSimulationModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">Informações da Aplicação</h3>
                  
                  {/* Informações CDI Compactas */}
                  {cdiData ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Taxa CDI Atual</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">CDI:</span>
                          <span className="font-bold text-gray-900 ml-1">{cdiData.cdi.annualPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Aplicação:</span>
                          <span className="font-bold text-gray-900 ml-1">{cdiData.investment.annualPercentage}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                        <strong>Piso:</strong> 0% ao mês garantido
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Taxa Estimada</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">CDI:</span>
                          <span className="font-bold text-gray-900 ml-1">12.75%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Aplicação:</span>
                          <span className="font-bold text-gray-900 ml-1">38.25%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Histórico Compacto */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Performance Recente</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { month: 'Mar', perf: '+2.49%' },
                        { month: 'Abr', perf: '+1.71%' },
                        { month: 'Mai', perf: '+0.75%' },
                        { month: 'Jun', perf: '0.00%' },
                      ].map((data, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600">{data.month}:</span>
                          <span className={`font-medium ${data.perf === '0.00%' ? 'text-gray-500' : 'text-gray-900'}`}>
                            {data.perf}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">Simulador Personalizado</h3>
                  
                  {/* Inputs de Simulação */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor da Aplicação
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatNumber(simulationAmount)}
                          onChange={(e) => {
                            const rawValue = parseFormattedNumber(e.target.value);
                            setSimulationAmount(rawValue);
                          }}
                          className="w-full pl-3 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-right"
                          placeholder="10,000"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-sm font-medium">USDT</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Mínimo: 100 USDT</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período
                      </label>
                      <select
                        value={simulationPeriod}
                        onChange={(e) => setSimulationPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="1">1 mês</option>
                        <option value="3">3 meses</option>
                        <option value="6">6 meses</option>
                        <option value="12">12 meses</option>
                        <option value="24">24 meses</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Resultados da Simulação Compactos */}
                  {simulationAmount && Number(simulationAmount) >= 100 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">Projeção</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Inicial:</span>
                          <span className="font-medium">{formatCrypto(Number(parseFormattedNumber(simulationAmount)))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor BRL:</span>
                          <span className="font-medium">{formatBRL(Number(parseFormattedNumber(simulationAmount)) * usdtData.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rendimento:</span>
                          <span className="font-medium text-gray-900">
                            +{cdiData 
                              ? formatCrypto(Number(parseFormattedNumber(simulationAmount)) * Number(cdiData.investment.monthly) * Number(simulationPeriod), 'USDT', { showSymbol: false })
                              : formatCrypto(Number(parseFormattedNumber(simulationAmount)) * 0.0103 * Number(simulationPeriod), 'USDT', { showSymbol: false })
                            } USDT
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-gray-900">
                            {cdiData 
                              ? formatCrypto(Number(parseFormattedNumber(simulationAmount)) + (Number(parseFormattedNumber(simulationAmount)) * Number(cdiData.investment.monthly) * Number(simulationPeriod)))
                              : formatCrypto(Number(parseFormattedNumber(simulationAmount)) + (Number(parseFormattedNumber(simulationAmount)) * 0.0103 * Number(simulationPeriod)))
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-600 text-xs">
                  <strong>Importante:</strong> Simulação ilustrativa. Rendimento varia conforme CDI e USDT. Piso mínimo: 0%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvestmentModal
        isOpen={showInvestModal}
        onClose={() => {
          setShowInvestModal(false);
          setInvestmentAmount('');
        }}
        userBalance={userBalance}
        onSuccess={handleInvestmentSuccess}
        prefilledAmount={investmentAmount}
      />
    </>
  );
}