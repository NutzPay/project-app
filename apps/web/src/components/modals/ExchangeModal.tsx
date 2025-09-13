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
  mode: 'brl' | 'usdt'; // Define se o usuário está inserindo BRL ou USDT
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
    mode: 'brl'
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

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setForm({ brlAmount: '', usdtAmount: '', mode: 'brl' });
      setCalculation(null);
      setError('');
      setPixData(null);
      setPaymentStatus(null);
      setCurrentTransactionId(null);
    }
  }, [isOpen]);

  // Calcular preço em tempo real
  useEffect(() => {
    const calculatePriceDebounced = async () => {
      if (form.mode === 'brl' && form.brlAmount) {
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
      } else if (form.mode === 'usdt' && form.usdtAmount) {
        const amount = parseFloat(form.usdtAmount);
        if (amount > 0) {
          try {
            setLoading(true);
            const calc = await priceCalculator.calculatePrice(amount);
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
    const newMode = field === 'brlAmount' ? 'brl' : 'usdt';
    
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
          sellerFee: calculation.sellerFee
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-black">Câmbio PIX → USDT</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">
                  Troque seus reais por USDT de forma rápida e segura
                </p>
              </div>

              <div className="space-y-4">
                {/* Input BRL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valor em Reais (BRL)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.brlAmount}
                      onChange={(e) => handleInputChange('brlAmount', formatNumber(e.target.value))}
                      placeholder="0,00"
                      className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-500 text-sm">R$</span>
                  </div>
                </div>

                {/* Exchange Arrow */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* Input USDT */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantidade USDT
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.usdtAmount}
                      onChange={(e) => handleInputChange('usdtAmount', e.target.value)}
                      placeholder="0.000000"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 text-sm">₮</span>
                  </div>
                </div>
              </div>

              {/* Calculation Details */}
              {calculation && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm">Resumo da Transação</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cotação USDT:</span>
                      <span className="font-medium">{priceCalculator.formatPrice(calculation.usdtPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de câmbio:</span>
                      <span className="font-medium text-orange-600">{calculation.sellerFee}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço final por USDT:</span>
                      <span className="font-medium">{priceCalculator.formatPrice(calculation.pricePerUsdt)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-gray-800 font-semibold">Total a pagar:</span>
                      <span className="font-bold text-black">{priceCalculator.formatPrice(calculation.finalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800 font-semibold">Você receberá:</span>
                      <span className="font-bold text-black">{priceCalculator.formatUSDT(calculation.usdtAmount)}</span>
                    </div>
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
                  <span className="text-gray-600">Você paga:</span>
                  <span className="font-bold text-lg text-black">{priceCalculator.formatPrice(calculation.finalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Você recebe:</span>
                  <span className="font-bold text-lg text-black">{priceCalculator.formatUSDT(calculation.usdtAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cotação + Taxa ({calculation.sellerFee}%):</span>
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