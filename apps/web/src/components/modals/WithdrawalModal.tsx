'use client';

import { useState, useEffect } from 'react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WithdrawalMethod = 'pix' | 'usdt';

interface WithdrawalForm {
  method: WithdrawalMethod;
  amount: string;
  pixKey: string;
  pixKeyType?: 0 | 1 | 2 | 3 | 4; // 0=CPF, 1=CNPJ, 2=EMAIL, 3=TELEFONE, 4=RANDOM_KEY
  walletAddress: string;
  network: 'TRC20' | 'ERC20';
}

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  console.log('WithdrawalModal render:', { isOpen });
  const [step, setStep] = useState<'method' | 'form' | 'confirmation' | 'processing' | 'success'>('method');
  const [form, setForm] = useState<WithdrawalForm>({
    method: 'pix',
    amount: '',
    pixKey: '',
    walletAddress: '',
    network: 'TRC20'
  });
  const [validationError, setValidationError] = useState('');
  const [balances, setBalances] = useState({
    brl: 0,
    usdt: 0
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [fees, setFees] = useState<{
    pix: { percentage: number; fixed: number };
    usdt: { percentage: number; fixed: number };
  }>({
    pix: { percentage: 0, fixed: 0 },
    usdt: { percentage: 0, fixed: 0 }
  });
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [transactionId, setTransactionId] = useState<string>('');
  const [detectedPixKeyType, setDetectedPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | 'ambiguous' | null>(null);
  const [showPixKeyTypeSelector, setShowPixKeyTypeSelector] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBalances();
      fetchFees();
    }
  }, [isOpen]);

  const fetchBalances = async () => {
    try {
      setIsLoadingBalances(true);

      // Fetch PIX balance
      const pixResponse = await fetch('/api/pix/balance');
      const pixData = await pixResponse.json();

      // Fetch USDT balance
      const usdtResponse = await fetch('/api/usdt/balance');
      const usdtData = await usdtResponse.json();

      if (pixData.success && usdtData.success) {
        setBalances({
          brl: pixData.balance.brlAmount || 0,
          usdt: usdtData.wallet.availableBalance || 0
        });
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      // Keep default values of 0 on error
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const fetchFees = async () => {
    try {
      setIsLoadingFees(true);

      const response = await fetch('/api/user/fees');
      const data = await response.json();

      if (data.success) {
        // Store the actual percentage and fixed fee for PIX payouts
        setFees({
          pix: {
            percentage: data.fees.pixPayOut.percentage * 100, // Convert to percentage
            fixed: data.fees.pixPayOut.fixed
          },
          usdt: {
            percentage: data.fees.usdt.percentage * 100,
            fixed: data.fees.usdt.fixed
          }
        });
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      // Keep default values on error
    } finally {
      setIsLoadingFees(false);
    }
  };

  const calculateTotalFee = (amount: number, percentage: number, fixed: number) => {
    return (amount * (percentage / 100)) + fixed;
  };

  const detectPixKeyType = (key: string): { type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | 'ambiguous', pixKeyType: number } | null => {
    if (!key || key.trim() === '') {
      console.log('🔍 detectPixKeyType: empty key');
      return null;
    }

    const cleanKey = key.replace(/\D/g, ''); // Remove non-numeric characters
    console.log('🔍 detectPixKeyType:', { originalKey: key, cleanKey, length: cleanKey.length });

    // Check for email
    if (key.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
      console.log('✅ Detected: EMAIL');
      return { type: 'email', pixKeyType: 2 };
    }

    // Check for UUID (random key) - 32 alphanumeric chars or with hyphens
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key) ||
        /^[a-f0-9]{32}$/i.test(key.replace(/-/g, ''))) {
      console.log('✅ Detected: RANDOM KEY');
      return { type: 'random', pixKeyType: 4 };
    }

    // Check for numeric keys (CPF, CNPJ, or phone)
    if (cleanKey.length === 11) {
      // Could be CPF or phone
      console.log('⚠️ Detected: AMBIGUOUS (CPF or Phone)');
      return { type: 'ambiguous', pixKeyType: -1 };
    }

    if (cleanKey.length === 14) {
      // CNPJ
      console.log('✅ Detected: CNPJ');
      return { type: 'cnpj', pixKeyType: 1 };
    }

    if (cleanKey.length >= 10 && cleanKey.length <= 13) {
      // Likely phone (10-13 digits with country code)
      console.log('✅ Detected: PHONE');
      return { type: 'phone', pixKeyType: 3 };
    }

    console.log('❌ No type detected');
    return null;
  };

  const handlePixKeyChange = (value: string) => {
    console.log('📝 handlePixKeyChange called with:', value);

    setForm({ ...form, pixKey: value, pixKeyType: undefined });
    setDetectedPixKeyType(null);
    setShowPixKeyTypeSelector(false);

    const detection = detectPixKeyType(value);
    console.log('🎯 Detection result:', detection);

    if (detection) {
      if (detection.type === 'ambiguous') {
        // Show selector for CPF or Phone
        console.log('🔀 Setting ambiguous selector');
        setDetectedPixKeyType('ambiguous');
        setShowPixKeyTypeSelector(true);
      } else {
        console.log('✅ Setting detected type:', detection.type);
        setDetectedPixKeyType(detection.type);
        setForm(prev => ({ ...prev, pixKey: value, pixKeyType: detection.pixKeyType }));
      }
    } else {
      console.log('❌ No detection result');
    }
  };

  const handleAmbiguousTypeSelect = (type: 'cpf' | 'phone') => {
    const pixKeyType = type === 'cpf' ? 0 : 3;
    setForm({ ...form, pixKeyType });
    setDetectedPixKeyType(type);
    setShowPixKeyTypeSelector(false);
  };

  if (!isOpen) return null;

  const handleMethodSelect = (method: WithdrawalMethod) => {
    setForm({ ...form, method });
    setValidationError('');
    setStep('form');
  };

  const handleSubmit = () => {
    const requestedAmount = parseFloat(form.amount) || 0;
    const availableBalance = getBalance();
    const feeAmount = getFee();
    const totalNeeded = getTotalNeeded();

    // Clear previous validation errors
    setValidationError('');

    // Validate amount
    if (requestedAmount <= 0) {
      setValidationError('Por favor, insira um valor válido para o saque.');
      return;
    }

    // Validate balance (must have requested amount + fee)
    if (totalNeeded > availableBalance) {
      const formattedBalance = formatCurrency(availableBalance, form.method === 'usdt' ? 'USDT' : 'BRL');
      const formattedTotal = formatCurrency(totalNeeded, form.method === 'usdt' ? 'USDT' : 'BRL');
      const formattedFee = formatCurrency(feeAmount, form.method === 'usdt' ? 'USDT' : 'BRL');
      setValidationError(`Saldo insuficiente. Você precisa de ${formattedTotal} (${formatCurrency(requestedAmount, form.method === 'usdt' ? 'USDT' : 'BRL')} + ${formattedFee} de taxa). Seu saldo disponível é de ${formattedBalance}.`);
      return;
    }
    
    // Validate specific fields
    if (form.method === 'pix' && !form.pixKey.trim()) {
      setValidationError('Por favor, insira sua chave PIX.');
      return;
    }

    if (form.method === 'pix' && form.pixKeyType === undefined) {
      setValidationError('Por favor, aguarde enquanto identificamos o tipo da sua chave PIX ou selecione o tipo manualmente.');
      return;
    }

    if (form.method === 'pix' && showPixKeyTypeSelector) {
      setValidationError('Por favor, selecione se sua chave é CPF ou Telefone.');
      return;
    }
    
    if (form.method === 'usdt' && !form.walletAddress.trim()) {
      setValidationError('Por favor, insira o endereço da wallet.');
      return;
    }
    
    // If all validations pass, proceed to confirmation
    setStep('confirmation');
  };

  const confirmWithdrawal = async () => {
    setStep('processing');
    setValidationError('');

    try {
      const requestedAmount = parseFloat(form.amount);

      if (form.method === 'pix') {
        // Call Bettrix PIX payout API
        const response = await fetch('/api/bettrix/pix/payout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: requestedAmount,
            pixKey: form.pixKey,
            pixKeyType: form.pixKeyType, // 0=CPF, 1=CNPJ, 2=EMAIL, 3=TELEFONE, 4=RANDOM_KEY
            recipientName: 'Usuario Nutz', // TODO: Get from user profile
            recipientDocument: '', // Optional
            recipientEmail: '', // Optional
            recipientPhone: '' // Optional
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao processar saque PIX');
        }

        console.log('✅ PIX payout successful:', data);
        setTransactionId(data.transaction?.id || 'N/A');

        // Refresh balances after successful payout
        await fetchBalances();

        setStep('success');

      } else if (form.method === 'usdt') {
        // Call USDT payout API
        const response = await fetch('/api/usdt/payout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: requestedAmount,
            walletAddress: form.walletAddress,
            network: form.network
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao processar saque USDT');
        }

        console.log('✅ USDT payout successful:', data);
        setTransactionId(data.transaction?.id || 'N/A');

        // Refresh balances after successful payout
        await fetchBalances();

        setStep('success');
      }

    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      setValidationError(error instanceof Error ? error.message : 'Erro ao processar saque');
      setStep('form');
    }
  };

  const resetModal = () => {
    setStep('method');
    setForm({
      method: 'pix',
      amount: '',
      pixKey: '',
      walletAddress: '',
      network: 'TRC20'
    });
    setValidationError('');
    onClose();
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : 'BRL'
    }).format(value);
  };

  const getBalance = () => {
    switch (form.method) {
      case 'pix': return balances.brl;
      case 'usdt': return balances.usdt;
    }
  };

  const getFee = () => {
    const amount = parseFloat(form.amount) || 0;
    if (amount === 0) return 0;

    if (form.method === 'pix') {
      // PIX withdrawal fee from API
      return calculateTotalFee(amount, fees.pix.percentage, fees.pix.fixed);
    } else if (form.method === 'usdt') {
      // USDT withdrawal fee from API
      return calculateTotalFee(amount, fees.usdt.percentage, fees.usdt.fixed);
    }

    return 0;
  };

  // Total amount needed from balance (requested amount + fee)
  const getTotalNeeded = () => {
    const amount = parseFloat(form.amount) || 0;
    const fee = getFee();
    return amount + fee;
  };

  // Amount that will be received by the user (same as requested for PIX)
  const getNetAmount = () => {
    const amount = parseFloat(form.amount) || 0;
    return amount; // User receives exactly what they requested
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Realizar Saque</h3>
              <p className="text-sm text-gray-600">Retire seus fundos de forma segura</p>
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

        <div className="p-6">

        {/* Step 1: Method Selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Escolha o método de saque</h4>
            
            {/* PIX Option */}
            <button
              onClick={() => handleMethodSelect('pix')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900">PIX</h5>
                    <p className="text-sm text-gray-600">Saque instantâneo para sua conta</p>
                    <p className="text-xs text-gray-500">Taxa: 2,0%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Saldo disponível</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isLoadingBalances ? 'Carregando...' : formatCurrency(balances.brl, 'BRL')}
                  </p>
                </div>
              </div>
            </button>

            {/* USDT Option */}
            <button
              onClick={() => handleMethodSelect('usdt')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900">USDT</h5>
                    <p className="text-sm text-gray-600">Stablecoin para sua wallet</p>
                    <p className="text-xs text-gray-500">Taxa: 1,5%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Saldo disponível</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isLoadingBalances ? 'Carregando...' : `US$ ${balances.usdt.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </button>

          </div>
        )}

        {/* Step 2: Form */}
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
                Saque via {form.method.toUpperCase()}
              </h4>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do saque
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">
                    {form.method === 'usdt' ? 'USDT' : 'BRL'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>
                  Disponível: {isLoadingBalances
                    ? 'Carregando...'
                    : (form.method === 'usdt'
                       ? `US$ ${getBalance().toFixed(2)}`
                       : formatCurrency(getBalance(), 'BRL')
                      )
                  }
                </span>
                <button
                  onClick={() => setForm({ ...form, amount: getBalance().toString() })}
                  disabled={isLoadingBalances}
                  className="text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Usar máximo
                </button>
              </div>
            </div>

            {/* PIX Key Input */}
            {form.method === 'pix' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={form.pixKey}
                  onChange={(e) => handlePixKeyChange(e.target.value)}
                  placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />

                {/* Detected PIX Key Type */}
                {detectedPixKeyType && detectedPixKeyType !== 'ambiguous' && (
                  <div className="mt-2 flex items-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-600 font-medium">
                      {detectedPixKeyType === 'cpf' && 'Tipo detectado: CPF'}
                      {detectedPixKeyType === 'cnpj' && 'Tipo detectado: CNPJ'}
                      {detectedPixKeyType === 'email' && 'Tipo detectado: Email'}
                      {detectedPixKeyType === 'phone' && 'Tipo detectado: Telefone'}
                      {detectedPixKeyType === 'random' && 'Tipo detectado: Chave Aleatória'}
                    </span>
                  </div>
                )}

                {/* Ambiguous Type Selector (CPF or Phone) */}
                {showPixKeyTypeSelector && detectedPixKeyType === 'ambiguous' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2 font-medium">
                      Esta chave pode ser CPF ou Telefone. Por favor, selecione o tipo correto:
                    </p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAmbiguousTypeSelect('cpf')}
                        className="flex-1 px-4 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-lg hover:bg-yellow-100 font-medium transition-colors"
                      >
                        CPF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAmbiguousTypeSelect('phone')}
                        className="flex-1 px-4 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-lg hover:bg-yellow-100 font-medium transition-colors"
                      >
                        Telefone
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Crypto Wallet Input */}
            {(form.method === 'usdt' || form.method === 'bitcoin') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço da Wallet
                </label>
                {form.method === 'usdt' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rede</label>
                    <select
                      value={form.network}
                      onChange={(e) => setForm({ ...form, network: e.target.value as 'TRC20' | 'ERC20' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="TRC20">TRC20 (Tron) - Taxa menor</option>
                      <option value="ERC20">ERC20 (Ethereum) - Taxa maior</option>
                    </select>
                  </div>
                )}
                <input
                  type="text"
                  value={form.walletAddress}
                  onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                  placeholder={`Digite o endereço da wallet ${form.method === 'bitcoin' ? 'Bitcoin' : 'USDT'}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-600">
                  ⚠️ Verifique cuidadosamente o endereço. Transações não podem ser revertidas.
                </p>
              </div>
            )}

            {/* Summary */}
            {form.amount && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h5 className="font-semibold text-gray-900">Resumo do saque</h5>
                <div className="flex justify-between text-sm">
                  <span>Valor solicitado:</span>
                  <span className="font-medium">{formatCurrency(parseFloat(form.amount) || 0, form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa:</span>
                  <span className="font-medium">{formatCurrency(getFee(), form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Você receberá:</span>
                  <span>{formatCurrency(getNetAmount(), form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-red-700">{validationError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!form.amount || (form.method === 'pix' && !form.pixKey) || (form.method === 'usdt' && !form.walletAddress)}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Confirmar Saque</h4>
              <p className="text-gray-600">Revise os dados antes de confirmar</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Método:</span>
                <span>{form.method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valor:</span>
                <span>{formatCurrency(parseFloat(form.amount), form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Taxa:</span>
                <span>{formatCurrency(getFee(), form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
              </div>
              {form.method === 'pix' && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Chave PIX:</span>
                    <span className="text-sm font-mono">{form.pixKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tipo de Chave:</span>
                    <span className="text-sm">
                      {form.pixKeyType === 0 && 'CPF'}
                      {form.pixKeyType === 1 && 'CNPJ'}
                      {form.pixKeyType === 2 && 'Email'}
                      {form.pixKeyType === 3 && 'Telefone'}
                      {form.pixKeyType === 4 && 'Chave Aleatória'}
                    </span>
                  </div>
                </>
              )}
              {form.method === 'usdt' && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Rede:</span>
                    <span>{form.network}</span>
                  </div>
                  <div>
                    <span className="font-medium">Endereço:</span>
                    <p className="text-sm font-mono break-all mt-1 bg-white p-2 rounded border">
                      {form.walletAddress}
                    </p>
                  </div>
                </>
              )}
              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Total a receber:</span>
                <span className="text-gray-900">{formatCurrency(getNetAmount(), form.method === 'usdt' ? 'USDT' : 'BRL')}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={confirmWithdrawal}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Confirmar Saque
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Processando Saque</h4>
              <p className="text-gray-600">Estamos processando sua solicitação via Bettrix...</p>
              <p className="text-xs text-gray-500 mt-2">Aguarde alguns instantes</p>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Saque Confirmado!</h4>
              <p className="text-gray-600 mb-4">
                {form.method === 'pix' 
                  ? 'Seu saque PIX foi processado e estará disponível em alguns instantes.'
                  : `Seu saque ${form.method.toUpperCase()} foi enviado para a blockchain. Você receberá uma confirmação em breve.`
                }
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900">ID da transação</p>
                <p className="text-lg font-mono text-gray-700">{transactionId || `#TXN${Date.now().toString().slice(-8)}`}</p>
              </div>
            </div>
            <button
              onClick={resetModal}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Concluir
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}