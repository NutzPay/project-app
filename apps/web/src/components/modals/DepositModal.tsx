'use client';

import { useState, useEffect } from 'react';
import { usePaymentWebSocket, PaymentStatus } from '@/hooks/usePaymentWebSocket';
import PaymentSuccess from '@/components/ui/PaymentSuccess';
import { formatBRL, formatCrypto, formatCurrency } from '@/lib/currency';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserAcquirer {
  id: string;
  acquirer: {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    logoUrl?: string;
    description?: string;
  };
  priority: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  isActive: boolean;
}

interface DepositForm {
  selectedAcquirer: UserAcquirer | null;
  method: 'pix' | 'usdt';
  amount: string;
}

type DepositMethod = 'pix' | 'usdt';

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [step, setStep] = useState<'method' | 'form' | 'qrcode' | 'processing' | 'success' | 'payment_success'>('method');
  const [form, setForm] = useState<DepositForm>({
    selectedAcquirer: null,
    method: 'pix',
    amount: ''
  });

  const [userAcquirers, setUserAcquirers] = useState<UserAcquirer[]>([]);
  const [acquirersLoading, setAcquirersLoading] = useState(true);
  const [acquirersError, setAcquirersError] = useState<string | null>(null);

  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeText: string;
    expiresAt: Date;
    transactionId: string;
  } | null>(null);

  const [usdtData, setUsdtData] = useState<{
    walletAddress: string;
    network: string;
    minimumAmount: number;
    transactionId: string;
    usdtAmount?: number;
    exchangeRate?: number;
    provider?: string;
  } | null>(null);

  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [isPaymentDetected, setIsPaymentDetected] = useState(false);
  const [paymentProcessingStep, setPaymentProcessingStep] = useState<'waiting' | 'detected' | 'processing' | 'confirmed'>('waiting');
  const [countdown, setCountdown] = useState<number>(5);

  // Fetch user's assigned acquirers
  const fetchUserAcquirers = async () => {
    try {
      setAcquirersLoading(true);
      setAcquirersError(null);
      
      // TEMPORARY: Hardcode acquirers to bypass auth/database issues
      const mockAcquirers: UserAcquirer[] = [
        {
          id: 'mock-pix',
          acquirer: {
            id: 'starkbank-id',
            name: 'StarkBank',
            slug: 'starkbank',
            type: 'PIX',
            status: 'ACTIVE',
            logoUrl: null,
            description: 'Processamento PIX empresarial'
          },
          priority: 10,
          dailyLimit: 50000,
          monthlyLimit: 500000,
          isActive: true
        },
        {
          id: 'mock-crypto',
          acquirer: {
            id: 'xgate-id',
            name: 'XGate',
            slug: 'xgate',
            type: 'CRYPTO',
            status: 'ACTIVE',
            logoUrl: null,
            description: 'Gateway de criptomoedas'
          },
          priority: 5,
          dailyLimit: 50000,
          monthlyLimit: 500000,
          isActive: true
        }
      ];
      
      setUserAcquirers(mockAcquirers);
      
      // Auto-select CRYPTO acquirer for USDT purchases
      const cryptoAcquirer = mockAcquirers.find(a => a.acquirer.type === 'CRYPTO');
      if (cryptoAcquirer && form.method === 'usdt') {
        setForm(prev => ({
          ...prev,
          selectedAcquirer: cryptoAcquirer
        }));
      }
      
    } catch (error) {
      console.error('Error fetching user acquirers:', error);
      setAcquirersError('Erro de conexão');
    } finally {
      setAcquirersLoading(false);
    }
  };

  // Calcular preço em tempo real para compra de USDT
  const calculatePrice = async (usdtAmount: string) => {
    console.log('🔄 calculatePrice called with:', {
      usdtAmount,
      hasSelectedAcquirer: !!form.selectedAcquirer,
      selectedAcquirerType: form.selectedAcquirer?.acquirer?.type,
      parsedAmount: parseFloat(usdtAmount || '0'),
      method: form.method
    });

    if (!usdtAmount || parseFloat(usdtAmount) <= 0 || !form.selectedAcquirer || form.selectedAcquirer.acquirer.type !== 'CRYPTO') {
      console.log('❌ calculatePrice early return:', {
        noAmount: !usdtAmount,
        zeroAmount: parseFloat(usdtAmount || '0') <= 0,
        noAcquirer: !form.selectedAcquirer,
        notCrypto: form.selectedAcquirer?.acquirer?.type !== 'CRYPTO'
      });
      setPriceCalculation(null);
      return;
    }

    console.log('✅ calculatePrice proceeding with calculation...');
    setCalculationLoading(true);
    try {
      const url = `/api/usdt/calculate-price?usdt=${usdtAmount}`;
      console.log('🌐 Fetching:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('📥 calculatePrice response:', data);

      if (data.success) {
        console.log('✅ Setting price calculation:', data);
        setPriceCalculation(data);
      } else {
        console.error('❌ Error calculating price:', data.error);
        setPriceCalculation(null);
      }
    } catch (error) {
      console.error('❌ Error fetching price:', error);
      setPriceCalculation(null);
    } finally {
      setCalculationLoading(false);
    }
  };

  // Fetch acquirers when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal opened, fetching user acquirers...');
      fetchUserAcquirers();
    }
  }, [isOpen]);

  // Auto-select CRYPTO acquirer when method is USDT
  useEffect(() => {
    console.log('🔄 Auto-select CRYPTO useEffect triggered:', {
      method: form.method,
      userAcquirersCount: userAcquirers.length,
      currentSelectedAcquirer: form.selectedAcquirer?.acquirer?.name
    });

    if (form.method === 'usdt' && userAcquirers.length > 0) {
      const cryptoAcquirer = userAcquirers.find(a => a.acquirer.type === 'CRYPTO');
      console.log('🔍 Looking for CRYPTO acquirer:', {
        found: !!cryptoAcquirer,
        cryptoAcquirerName: cryptoAcquirer?.acquirer?.name
      });
      
      if (cryptoAcquirer) {
        console.log('✅ Setting CRYPTO acquirer:', cryptoAcquirer.acquirer.name);
        setForm(prev => ({
          ...prev,
          selectedAcquirer: cryptoAcquirer
        }));
      }
    }
  }, [form.method, userAcquirers]);

  // Calcular preço quando valor USDT mudar
  useEffect(() => {
    console.log('🔄 Price calculation useEffect triggered:', {
      method: form.method,
      amount: form.amount,
      parsedAmount: parseFloat(form.amount || '0'),
      hasSelectedAcquirer: !!form.selectedAcquirer,
      selectedAcquirerType: form.selectedAcquirer?.acquirer?.type,
      willCalculate: form.method === 'usdt' && form.amount && parseFloat(form.amount) >= 1
    });

    if (form.method === 'usdt' && form.amount && parseFloat(form.amount) >= 1) {
      console.log('⏱️ Setting timeout for price calculation in 500ms...');
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout triggered, calling calculatePrice...');
        calculatePrice(form.amount);
      }, 500);
      return () => {
        console.log('🧹 Clearing timeout...');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('❌ Not calculating price, clearing priceCalculation');
      setPriceCalculation(null);
    }
  }, [form.amount, form.method, form.selectedAcquirer]);

  // Função para processar confirmação de pagamento
  const processPaymentConfirmation = (transactionData: any) => {
    console.log('✅ Payment confirmed!', transactionData);

    // Sequence of payment detection animations
    setPaymentProcessingStep('detected');
    setIsPaymentDetected(true);

    // Show processing animation
    setTimeout(() => {
      setPaymentProcessingStep('processing');
    }, 500);

    // Show confirmation and auto-close
    setTimeout(() => {
      setPaymentProcessingStep('confirmed');
      setPaymentStatus({
        transactionId: transactionData.id || currentTransactionId || '',
        status: 'confirmed',
        usdtAmount: transactionData.amount || 0,
        brlAmount: transactionData.brlAmount || 0,
        timestamp: new Date().toISOString(),
        message: 'Pagamento confirmado!'
      });

      // Start countdown for auto-close
      setCountdown(5);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            resetModal();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  // Polling frequente para verificar status do pagamento quando modal está ativo
  useEffect(() => {
    if (!currentTransactionId || step !== 'qrcode') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/transactions/${currentTransactionId}`);
        const data = await response.json();

        if (data.success && data.transaction.status === 'COMPLETED') {
          console.log('✅ Payment completed via polling!');
          processPaymentConfirmation(data.transaction);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling transaction status:', error);
      }
    }, 2000); // Verificar a cada 2 segundos para resposta rápida

    return () => clearInterval(pollInterval);
  }, [currentTransactionId, step]);

  // Valores mock para compatibilidade (removidos - usando WebSocket real)

  const resetModal = () => {
    setStep('method');
    setForm({
      selectedAcquirer: null,
      method: 'pix',
      amount: ''
    });
    setPixData(null);
    setUsdtData(null);
    setPriceCalculation(null);
    setCalculationLoading(false);
    setPaymentStatus(null);
    setCurrentTransactionId(null);
    setIsPaymentDetected(false);
    setPaymentProcessingStep('waiting');
    setCountdown(5);
    onClose();
  };

  if (!isOpen) return null;

  const handleMethodSelect = (method: DepositMethod) => {
    setForm({ ...form, method });
    setStep('form');
  };

  const handleSubmit = async () => {
    if (form.method === 'pix') {
      setStep('processing');
      
      try {
        // Fazer chamada real para API Starkbank
        const response = await fetch('/api/starkbank/pix/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Assumindo que o token está no localStorage
          },
          body: JSON.stringify({
            amount: parseFloat(form.amount),
            name: 'Usuário Seller', // Idealmente pegar do contexto do usuário
            taxId: '000.000.000-00', // Idealmente pegar do perfil do usuário
            description: `Depósito de R$ ${form.amount}`,
            externalId: `deposit_${Date.now()}`
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar PIX');
        }

        const pixResponse = await response.json();
        
        setPixData({
          qrCode: pixResponse.qrCodeUrl,
          qrCodeText: pixResponse.qrCodeText,
          expiresAt: pixResponse.expiresAt ? new Date(pixResponse.expiresAt) : new Date(Date.now() + 15 * 60 * 1000),
          transactionId: pixResponse.transactionId
        });
        setStep('qrcode');
      } catch (error) {
        console.error('Erro ao criar PIX:', error);
        // Voltar ao formulário em caso de erro
        setStep('form');
        // Você pode adicionar um toast de erro aqui
        alert('Erro ao gerar PIX. Tente novamente.');
      }
    } else {
      // Chamada para API Xgate para compra de USDT via PIX
      setStep('processing');
      
      try {
        const response = await fetch('/api/xgate/usdt/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            amount: priceCalculation?.calculation?.finalPrice || parseFloat(form.amount), // Amount in BRL from calculation
            usdtAmount: parseFloat(form.amount), // Amount of USDT requested
            name: 'Usuário Seller',
            taxId: '000.000.000-00',
            description: `Compra de ${form.amount} USDT via PIX`,
            externalId: `xgate_${Date.now()}`
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao criar ordem USDT');
        }

        const xgateResponse = await response.json();
        
        // Set transaction ID for WebSocket connection
        setCurrentTransactionId(xgateResponse.transactionId);
        
        // Para USDT via Xgate, usamos os dados do PIX retornados
        setPixData({
          qrCode: xgateResponse.qrCodeUrl,
          qrCodeText: xgateResponse.qrCodeText,
          expiresAt: xgateResponse.expiresAt ? new Date(xgateResponse.expiresAt) : new Date(Date.now() + 15 * 60 * 1000),
          transactionId: xgateResponse.transactionId
        });

        // Também salvamos dados específicos do USDT
        setUsdtData({
          walletAddress: 'Automático via PIX', // Não precisa de wallet manual
          network: 'USDT (TRC20)',
          minimumAmount: 10,
          transactionId: xgateResponse.transactionId,
          usdtAmount: xgateResponse.usdtAmount,
          exchangeRate: xgateResponse.exchangeRate,
          provider: 'xgate'
        });
        
        setStep('qrcode');
      } catch (error) {
        console.error('Erro ao criar ordem USDT:', error);
        setStep('form');
        alert('Erro ao gerar ordem USDT. Tente novamente.');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Você pode adicionar um toast aqui
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 pb-24">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Comprar USDT via PIX</h3>
              <p className="text-sm text-gray-600">Adicione saldo à sua conta</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">

        {/* Step 1: Method Selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Como você quer depositar?
            </h4>

            {/* PIX Option - Priority */}
            <button
              onClick={() => handleMethodSelect('pix')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group relative"
            >
              {/* Recommended Badge */}
              <div className="absolute -top-2 left-4">
                <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full">
                  RECOMENDADO
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900">PIX</h5>
                    <p className="text-sm text-gray-600">Depósito instantâneo via PIX</p>
                    <p className="text-xs text-gray-700 font-medium">Sem taxas • Imediato</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Para saldo</p>
                  <p className="text-lg font-bold text-gray-900">BRL</p>
                </div>
              </div>
            </button>


            {/* USDT Option */}
            <button
              onClick={() => handleMethodSelect('usdt')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900">Comprar USDT</h5>
                    <p className="text-sm text-gray-600">Depósito via transferência para compra de USDT</p>
                    <p className="text-xs text-gray-600">Mínimo: $1.00</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Para saldo</p>
                  <p className="text-lg font-bold text-gray-900">USDT</p>
                </div>
              </div>
            </button>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Saldos Separados</p>
                  <p>O saldo BRL (PIX) e USDT são mantidos separadamente. Não há conversão automática entre eles.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Amount Form */}
        {step === 'form' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setStep('method')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h4 className="text-lg font-semibold text-gray-900">
                {form.method === 'pix' ? 'Depósito via PIX' : 'Comprar USDT'}
              </h4>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {form.method === 'pix' ? 'Valor do depósito' : 'Valor para compra de USDT'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={form.method === 'usdt' ? '1' : '0.01'}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder={form.method === 'usdt' ? '1.00' : '0.00'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm font-medium">
                    {form.method === 'usdt' ? 'USD' : 'BRL'}
                  </span>
                </div>
              </div>
              {form.method === 'usdt' && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-600">
                    Valor mínimo: $1.00 USD • Você receberá exatamente a quantidade solicitada
                  </p>
                  
                  {calculationLoading && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="animate-pulse flex items-center space-x-2">
                        <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Information Box */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2">
                {form.method === 'pix' ? 'Como funciona o PIX?' : 'Como funciona a compra de USDT?'}
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {form.method === 'pix' ? (
                  <>
                    <li>• Faça o pagamento via PIX</li>
                    <li>• Processamento instantâneo</li>
                    <li>• Saldo creditado automaticamente</li>
                    <li>• Sem taxas adicionais</li>
                  </>
                ) : (
                  <>
                    <li>• Você fará uma transferência bancária</li>
                    <li>• Processamos a compra de USDT para você</li>
                    <li>• USDT creditado em até 24 horas úteis</li>
                    <li>• Taxa de conversão USD → BRL aplicada</li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.amount || (form.method === 'usdt' && parseFloat(form.amount) < 1) || calculationLoading || (form.method === 'usdt' && !priceCalculation)}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {(() => {
                const buttonState = {
                  calculationLoading,
                  method: form.method,
                  hasPriceCalculation: !!priceCalculation,
                  priceCalculationData: priceCalculation,
                  amount: form.amount
                };
                console.log('🎯 Button render state:', buttonState);

                if (calculationLoading) {
                  console.log('🔄 Button showing: Calculando...');
                  return 'Calculando...';
                } else if (form.method === 'pix') {
                  console.log('💰 Button showing: Gerar QR Code PIX');
                  return 'Gerar QR Code PIX';
                } else if (priceCalculation) {
                  const buttonText = `Pagar ${priceCalculation.formatted.finalPrice} no PIX`;
                  console.log('✅ Button showing price:', buttonText);
                  return buttonText;
                } else {
                  console.log('❌ Button showing default: Digite o valor para calcular');
                  return 'Digite o valor para calcular';
                }
              })()}
            </button>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">
              {form.method === 'pix' ? 'Gerando QR Code PIX...' : 'Gerando dados de transferência...'}
            </h4>
            <p className="text-gray-600">Aguarde enquanto preparamos seus dados de pagamento</p>
          </div>
        )}

        {/* Step 4: QR Code / Transfer Data */}
        {step === 'qrcode' && (
          <div className={`${form.method === 'usdt' ? 'space-y-3' : 'space-y-4'}`}>
            {form.method === 'pix' && pixData && (
              <>

                {/* QR Code */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                  <div className="w-48 h-48 mx-auto bg-white border border-gray-300 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                    {pixData.qrCode ? (
                      <img 
                        src={pixData.qrCode} 
                        alt="QR Code PIX" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-2 0v1m-2-1h.01M12 12h.01M12 8h.01M12 16h.01m-6-4h.01M8 12h.01M8 8h.01M8 16h.01M16 12h.01M16 8h.01M16 16h.01" />
                      </svg>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatBRL(parseFloat(form.amount))}</p>
                  <p className="text-sm text-gray-600">ID: {pixData.transactionId}</p>
                </div>

                {/* PIX Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código PIX Copia e Cola</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={pixData.qrCodeText}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(pixData.qrCodeText)}
                      className="px-4 py-3 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Timer */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      PIX válido por 15 minutos
                    </span>
                  </div>
                </div>
              </>
            )}

            {form.method === 'usdt' && (
              <>
                {/* Show PIX for Xgate USDT purchases or traditional transfer */}
                {usdtData?.provider === 'xgate' && pixData ? (
                  <>
                    <div className="text-center">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-800">
                          Você receberá: <span className="font-bold">{form.amount} USDT</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Valor exato garantido
                        </p>
                      </div>
                    </div>

                    {/* QR Code PIX for USDT purchase */}
                    <div className={`relative bg-white border-2 border-gray-200 rounded-xl p-3 text-center ${
                      paymentProcessingStep !== 'waiting' ? 'transition-all duration-500' : ''
                    } ${
                      paymentProcessingStep === 'detected' ? 'border-yellow-400 shadow-lg shadow-yellow-200' :
                      paymentProcessingStep === 'processing' ? 'border-blue-400 shadow-lg shadow-blue-200' :
                      paymentProcessingStep === 'confirmed' ? 'border-green-400 shadow-lg shadow-green-200' :
                      'border-gray-200'
                    }`}>
                      
                      {/* Payment Status Overlay - Minimalista */}
                      {paymentProcessingStep !== 'waiting' && (
                        <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
                          <div className="text-center text-gray-900">
                            {paymentProcessingStep === 'detected' && (
                              <div>
                                <div className="w-12 h-12 mx-auto border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
                                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                                </div>
                                <p className="font-medium text-lg text-gray-900">Pagamento detectado</p>
                                <p className="text-sm text-gray-600 mt-1">Processando...</p>
                              </div>
                            )}

                            {paymentProcessingStep === 'processing' && (
                              <div>
                                <div className="w-12 h-12 mx-auto border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
                                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                </div>
                                <p className="font-medium text-lg text-gray-900">Confirmando pagamento</p>
                                <p className="text-sm text-gray-600 mt-1">Aguarde um momento...</p>
                              </div>
                            )}

                            {paymentProcessingStep === 'confirmed' && (
                              <div>
                                <div className="w-12 h-12 mx-auto border-2 border-green-500 rounded-full flex items-center justify-center mb-4">
                                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="font-medium text-lg text-gray-900">Pagamento aprovado</p>
                                <p className="text-sm text-gray-600 mt-1 mb-4">
                                  {paymentStatus?.usdtAmount && !isNaN(Number(paymentStatus.usdtAmount))
                                    ? `${Number(paymentStatus.usdtAmount).toFixed(6)} USDT creditado`
                                    : 'USDT creditado com sucesso'
                                  }
                                </p>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                  <p className="text-xs text-gray-600">Fechando em</p>
                                  <p className="font-medium text-lg text-gray-900">{countdown}s</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="w-36 h-36 mx-auto bg-white border border-gray-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                        {pixData.qrCode ? (
                          <img 
                            src={pixData.qrCode} 
                            alt="QR Code PIX USDT" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-2 0v1m-2-1h.01M12 12h.01M12 8h.01M12 16h.01m-6-4h.01M8 12h.01M8 8h.01M8 16h.01M16 12h.01M16 8h.01M16 16h.01" />
                          </svg>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {priceCalculation?.formatted?.finalPrice || 
                         (usdtData.exchangeRate ? 
                          formatBRL(parseFloat(form.amount) * usdtData.exchangeRate) : 
                          formatCrypto(parseFloat(form.amount), 'USD'))
                        }
                      </p>
                      {priceCalculation && (
                        <p className="text-sm font-medium text-black">
                          Receberá: {priceCalculation.formatted.usdtAmount}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">ID: {pixData.transactionId}</p>
                    </div>

                    {/* PIX Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Código PIX Copia e Cola</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={pixData.qrCodeText}
                          readOnly
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(pixData.qrCodeText)}
                          className="px-4 py-3 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">PIX válido por 15 minutos</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">• Pague o PIX acima</p>
                        <p>• O USDT será creditado automaticamente</p>
                      </div>
                    </div>
                  </>
                ) : usdtData ? (
                  <>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Dados para Transferência</h4>
                      <p className="text-gray-600">Faça a transferência para os dados abaixo</p>
                    </div>

                    {/* Transfer Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Banco</label>
                    <p className="text-lg font-semibold text-gray-900">Banco Inter</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Agência</label>
                      <p className="text-lg font-semibold text-gray-900">0001</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Conta</label>
                      <p className="text-lg font-semibold text-gray-900">12345678-9</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Favorecido</label>
                    <p className="text-lg font-semibold text-gray-900">NUTZPAY S.A.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                    <p className="text-lg font-semibold text-gray-900">18.236.120/0001-58</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <p className="text-xl font-bold text-gray-900">{formatCrypto(parseFloat(form.amount), 'USD')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Identificador</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={usdtData.transactionId}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-white text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(usdtData.transactionId)}
                        className="px-3 py-2 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Use este ID na descrição da transferência</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h6 className="font-semibold text-gray-900 mb-2">Importante:</h6>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• A transferência deve ser feita em até 24 horas</li>
                    <li>• Inclua o identificador na descrição</li>
                    <li>• O USDT será creditado após confirmação</li>
                    <li>• Taxa de câmbio será aplicada na conversão</li>
                  </ul>
                </div>
              </>
            ) : null
            }
              </>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Novo Depósito
              </button>
              <button
                onClick={resetModal}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Payment Success */}
        {step === 'payment_success' && paymentStatus && (
          <div>
            <PaymentSuccess 
              usdtAmount={paymentStatus.usdtAmount ? `${paymentStatus.usdtAmount.toFixed(6)} USDT` : form.amount + ' USDT'}
              brlAmount={paymentStatus.brlAmount ? `R$ ${paymentStatus.brlAmount.toFixed(2)}` : priceCalculation?.formatted?.finalPrice || 'R$ 0,00'}
              onComplete={() => {
                // Auto close after animation
                setTimeout(() => {
                  resetModal();
                }, 1000);
              }}
            />
            
            <div className="flex justify-center mt-6">
              <button
                onClick={resetModal}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg"
              >
                🎉 Finalizar
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}