'use client';

import { useState, useEffect } from 'react';
import { priceCalculator } from '@/lib/priceCalculator';
import { usePaymentWebSocket, PaymentStatus } from '@/hooks/usePaymentWebSocket';
import PaymentSuccess from '@/components/ui/PaymentSuccess';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ExchangeForm {
  brlAmount: string;
  usdtAmount: string;
  mode: 'brl_to_usdt' | 'usdt_to_brl'; // Define a direção do câmbio
}

interface PriceCalculation {
  usdtAmount: number;
  brlAmount: number;
  usdtPrice: number;
  sellerFee: number;
  finalPrice: number;
  pricePerUsdt: number;
}

export default function ExchangeModal({ isOpen, onClose, onSuccess }: ExchangeModalProps) {
  const [step, setStep] = useState<'form' | 'confirmation' | 'qrcode' | 'processing' | 'success'>('form');
  const [form, setForm] = useState<ExchangeForm>({
    brlAmount: '',
    usdtAmount: '',
    mode: 'brl_to_usdt'
  });
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeText: string;
    expiresAt: Date;
    transactionId: string;
  } | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [balances, setBalances] = useState<{
    brl: number;
    usdt: number;
    loading: boolean;
  }>({ brl: 0, usdt: 0, loading: true });

  // WebSocket para monitorar pagamentos PIX
  usePaymentWebSocket({
    transactionId: currentTransactionId || undefined,
    onPaymentUpdate: (status) => {
      setPaymentStatus(status);
      if (status.status === 'completed') {
        setStep('success');
      }
    },
    enabled: !!currentTransactionId
  });

  // Reset form e carregar saldos quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setForm({ brlAmount: '', usdtAmount: '', mode: 'brl_to_usdt' });
      setCalculation(null);
      setError('');
      setPixData(null);
      setPaymentStatus(null);
      setCurrentTransactionId(null);

      // Carregar saldos reais
      loadBalances();
    }
  }, [isOpen]);

  // Carregar saldos do usuário
  const loadBalances = async () => {
    try {
      setBalances(prev => ({ ...prev, loading: true }));

      const [pixResponse, usdtResponse] = await Promise.all([
        fetch('/api/pix/balance', { credentials: 'include' }),
        fetch('/api/usdt/balance', { credentials: 'include' })
      ]);

      let brlBalance = 0;
      let usdtBalance = 0;

      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        if (pixData.success) {
          brlBalance = pixData.balance.brlAmount;
        }
      }

      if (usdtResponse.ok) {
        const usdtData = await usdtResponse.json();
        if (usdtData.success) {
          usdtBalance = usdtData.wallet.availableBalance;
        }
      }

      setBalances({
        brl: brlBalance,
        usdt: usdtBalance,
        loading: false
      });
    } catch (error) {
      console.error('Error loading balances:', error);
      setBalances(prev => ({ ...prev, loading: false }));
    }
  };

  // Calcular preço em tempo real
  useEffect(() => {
    const calculatePriceDebounced = async () => {
      if (form.mode === 'brl_to_usdt' && form.brlAmount) {
        const amount = parseFloat(form.brlAmount.replace(',', ''));
        if (amount > 0) {
          try {
            setLoading(true);
            const calc = await priceCalculator.calculateUSDTAmount(amount);
            setCalculation(calc);
            setForm(prev => ({ ...prev, usdtAmount: calc.usdtAmount.toFixed(6) }));
          } catch (error) {
            console.error('Error calculating price:', error);
          } finally {
            setLoading(false);
          }
        }
      } else if (form.mode === 'usdt_to_brl' && form.usdtAmount) {
        const amount = parseFloat(form.usdtAmount);
        if (amount > 0) {
          try {
            setLoading(true);
            const calc = await priceCalculator.calculateBRLAmount(amount);
            setCalculation(calc);
            setForm(prev => ({ ...prev, brlAmount: calc.finalPrice.toFixed(2) }));
          } catch (error) {
            console.error('Error calculating price:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    const timer = setTimeout(calculatePriceDebounced, 500);
    return () => clearTimeout(timer);
  }, [form.brlAmount, form.usdtAmount, form.mode]);

  const handleInputChange = (field: 'brlAmount' | 'usdtAmount', value: string) => {
    // Atualizar modo baseado no campo que está sendo editado
    const newMode = field === 'brlAmount' ? 'brl_to_usdt' : 'usdt_to_brl';
    
    setForm(prev => ({
      ...prev,
      [field]: value,
      mode: newMode
    }));
    
    // Limpar o outro campo quando mudamos de modo
    if (newMode !== form.mode) {
      const otherField = field === 'brlAmount' ? 'usdtAmount' : 'brlAmount';
      setForm(prev => ({ ...prev, [otherField]: '' }));
    }
  };

  const handleConfirm = () => {
    if (!calculation) {
      setError('Erro no cálculo do preço');
      return;
    }

    if (calculation.finalPrice < 10) {
      setError('Valor mínimo para câmbio é R$ 10,00');
      return;
    }

    // Verificar saldo suficiente
    if (form.mode === 'brl_to_usdt') {
      if (calculation.finalPrice > balances.brl) {
        setError(`Saldo insuficiente. Você tem R$ ${balances.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponível`);
        return;
      }
    } else {
      if (calculation.usdtAmount > balances.usdt) {
        setError(`Saldo insuficiente. Você tem ${balances.usdt.toLocaleString('en-US', { minimumFractionDigits: 6 })} ₮ disponível`);
        return;
      }
    }

    setStep('confirmation');
  };

  const handleCreateExchange = async () => {
    if (!calculation) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/exchange/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brlAmount: calculation.finalPrice,
          usdtAmount: calculation.usdtAmount,
          pricePerUsdt: calculation.pricePerUsdt,
          sellerFee: calculation.sellerFee,
          exchangeMode: form.mode
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPixData(result.pixData);
        setCurrentTransactionId(result.transactionId);
        setStep('qrcode');
      } else {
        setError(result.error || 'Erro ao criar câmbio');
      }
    } catch (error) {
      console.error('Error creating exchange:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg mx-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-black">Câmbio</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Direction Indicator */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {form.mode === 'brl_to_usdt' ? 'PIX' : 'USDT'}
              </span>
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">
                  {form.mode === 'brl_to_usdt' ? 'R$' : '₮'}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {form.mode === 'brl_to_usdt' ? '₮' : 'R$'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {form.mode === 'brl_to_usdt' ? 'USDT' : 'PIX'}
              </span>
            </div>
          </div>

          {/* Mode Switch */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg mt-3">
            <button
              onClick={() => {
                setForm({ brlAmount: '', usdtAmount: '', mode: 'brl_to_usdt' });
                setCalculation(null);
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                form.mode === 'brl_to_usdt'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Comprar USDT
            </button>
            <button
              onClick={() => {
                setForm({ brlAmount: '', usdtAmount: '', mode: 'usdt_to_brl' });
                setCalculation(null);
              }}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                form.mode === 'usdt_to_brl'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Vender USDT
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'form' && (
            <div className={`space-y-4 ${!calculation ? 'space-y-3' : 'space-y-4'}`}>
              {/* Input Section */}
              <div className="space-y-3">
                {/* Input Principal (o que o usuário está inserindo) */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {form.mode === 'brl_to_usdt' ? 'Quanto você quer gastar?' : 'Quanto USDT você quer vender?'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.mode === 'brl_to_usdt' ? form.brlAmount : form.usdtAmount}
                      onChange={(e) => handleInputChange(
                        form.mode === 'brl_to_usdt' ? 'brlAmount' : 'usdtAmount',
                        form.mode === 'brl_to_usdt' ? formatNumber(e.target.value) : e.target.value
                      )}
                      placeholder={form.mode === 'brl_to_usdt' ? '1.000,00' : '100.000000'}
                      className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-lg font-semibold bg-white"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-500 text-sm font-bold">
                      {form.mode === 'brl_to_usdt' ? 'R$' : '₮'}
                    </span>
                  </div>
                </div>

                {/* Resultado (calculado automaticamente) */}
                {calculation && (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Você receberá:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.mode === 'brl_to_usdt' ? form.usdtAmount : form.brlAmount}
                        readOnly
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white text-lg font-semibold text-gray-800"
                      />
                      <span className="absolute left-3 top-3.5 text-gray-600 text-sm font-bold">
                        {form.mode === 'brl_to_usdt' ? '₮' : 'R$'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance e Taxa Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Saldos disponíveis:</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    BRL: {balances.loading ? 'Carregando...' : `R$ ${balances.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                  <span className="text-gray-600">
                    USDT: {balances.loading ? 'Carregando...' : `${balances.usdt.toLocaleString('en-US', { minimumFractionDigits: 6 })} ₮`}
                  </span>
                </div>
                {calculation && (
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa de câmbio:</span>
                      <span className="font-medium text-gray-800">{calculation.sellerFee}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo Compacto */}
              {calculation && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Cotação + Taxa ({calculation.sellerFee}%):</span>
                    <span className="font-medium">{priceCalculator.formatPrice(calculation.pricePerUsdt)} por USDT</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={!calculation || loading}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculando...' : 'Continuar'}
              </button>
            </div>
          )}

          {step === 'confirmation' && calculation && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Confirmar Câmbio</h3>
                <p className="text-gray-600 text-sm">
                  Revise os detalhes antes de prosseguir
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {form.mode === 'brl_to_usdt' ? 'Você paga:' : 'Você entrega:'}
                  </span>
                  <span className="font-bold text-lg text-black">
                    {form.mode === 'brl_to_usdt' ? 
                      priceCalculator.formatPrice(calculation.finalPrice) : 
                      priceCalculator.formatUSDT(calculation.usdtAmount)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Você recebe:</span>
                  <span className="font-bold text-lg text-black">
                    {form.mode === 'brl_to_usdt' ? 
                      priceCalculator.formatUSDT(calculation.usdtAmount) : 
                      priceCalculator.formatPrice(calculation.finalPrice)
                    }
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {form.mode === 'brl_to_usdt' ? 
                        `Cotação + Taxa (+${calculation.sellerFee}%):` : 
                        `Cotação - Taxa (-${calculation.sellerFee}%):`
                      }
                    </span>
                    <span>{priceCalculator.formatPrice(calculation.pricePerUsdt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateExchange}
                  disabled={loading}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {step === 'qrcode' && pixData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Pague com PIX</h3>
                <p className="text-gray-600 text-sm">
                  Escaneie o código ou copie a chave PIX
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex justify-center">
                  <img src={pixData.qrCode} alt="QR Code PIX" className="w-48 h-48" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Chave PIX:</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={pixData.qrCodeText}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(pixData.qrCodeText)}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Valor: <span className="font-semibold">{calculation && priceCalculator.formatPrice(calculation.finalPrice)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Expira em: {pixData.expiresAt.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Aguardando pagamento</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Após o pagamento, os USDT serão creditados automaticamente na sua carteira.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão de Teste - Apenas para desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-700 font-medium">Modo Desenvolvimento</p>
                    <button
                      onClick={async () => {
                        if (!currentTransactionId) return;
                        try {
                          setLoading(true);
                          const response = await fetch('/api/exchange/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ transactionId: currentTransactionId })
                          });
                          const result = await response.json();
                          if (result.success) {
                            setStep('success');
                          } else {
                            setError(result.error || 'Erro no teste');
                          }
                        } catch (error) {
                          setError('Erro no teste de pagamento');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Testando...' : 'Simular Pagamento PIX'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <PaymentSuccess
              amount={calculation?.finalPrice || 0}
              usdtAmount={calculation?.usdtAmount}
              type="exchange"
              onClose={() => {
                onClose();
                onSuccess?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}