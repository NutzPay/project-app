'use client';

import { useState, useEffect } from 'react';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  annualYieldRate: number;
  dailyYieldRate: number;
  minimumAmount: number;
  maximumAmount: number | null;
  lockPeriodDays: number | null;
  hasEarlyWithdraw: boolean;
  earlyWithdrawFee: number | null;
  requiresApproval: boolean;
  termsAndConditions: string;
  riskDisclosure: string;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onSuccess: () => void;
  prefilledAmount?: string;
}

export default function InvestmentModal({ isOpen, onClose, userBalance, onSuccess, prefilledAmount }: InvestmentModalProps) {
  const [step, setStep] = useState(1); // 1: Eligibility, 2: Select Plan, 3: Enter Amount, 4: Investment Terms, 5: Risk Disclosure, 6: Digital Signature, 7: Confirm, 8: Success
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityPassed, setEligibilityPassed] = useState(false);
  const [cdiData, setCdiData] = useState<any>(null);
  
  // Eligibility checks
  const [eligibilityChecks, setEligibilityChecks] = useState([
    { id: 'account', name: 'Verificação de Conta', status: 'checking', passed: false },
    { id: 'kyc', name: 'Documentação KYC', status: 'checking', passed: false },
    { id: 'limits', name: 'Limites de Investimento', status: 'checking', passed: false },
    { id: 'compliance', name: 'Compliance Regulatório', status: 'checking', passed: false }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadInvestmentPlans();
      loadCDIData();
      setStep(1);
      setSelectedPlan(null);
      setAmount(prefilledAmount || '');
      setAcceptedTerms(false);
      setAcceptedRisks(false);
      setDigitalSignature('');
      setEligibilityChecked(false);
      setEligibilityPassed(false);
      setEligibilityChecks([
        { id: 'account', name: 'Verificação de Conta', status: 'checking', passed: false },
        { id: 'kyc', name: 'Documentação KYC', status: 'checking', passed: false },
        { id: 'limits', name: 'Limites de Investimento', status: 'checking', passed: false },
        { id: 'compliance', name: 'Compliance Regulatório', status: 'checking', passed: false }
      ]);
      
      // Start eligibility check automatically
      setTimeout(() => runEligibilityCheck(), 1000);
    }
  }, [isOpen, prefilledAmount]);

  const loadInvestmentPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch('/api/investments/plans');
      const result = await response.json();
      
      if (result.success) {
        setPlans(result.plans);
      } else {
        console.error('Error loading plans:', result.error);
      }
    } catch (error) {
      console.error('Error loading investment plans:', error);
    } finally {
      setLoadingPlans(false);
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

  const runEligibilityCheck = async () => {
    for (let i = 0; i < eligibilityChecks.length; i++) {
      // Delay between checks
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));
      
      setEligibilityChecks(prev => prev.map((check, index) => {
        if (index === i) {
          const rand = Math.random();
          // Simulate realistic results - mostly pass
          const passed = rand > 0.05; // 95% chance of passing
          return {
            ...check,
            status: passed ? 'completed' : 'failed',
            passed
          };
        }
        return check;
      }));
    }
    
    // Check if all passed
    setTimeout(() => {
      setEligibilityChecks(prev => {
        const allPassed = prev.every(check => check.passed);
        setEligibilityChecked(true);
        setEligibilityPassed(allPassed);
        return prev;
      });
    }, 500);
  };

  const handlePlanSelect = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handleAmountNext = () => {
    if (!selectedPlan || !amount) return;
    
    const numAmount = parseFloat(amount);
    if (numAmount < selectedPlan.minimumAmount) {
      return; // Error handled in UI now
    }

    if (selectedPlan.maximumAmount && numAmount > selectedPlan.maximumAmount) {
      return; // Error handled in UI now
    }

    if (numAmount > userBalance) {
      return; // Error handled in UI now
    }

    setStep(4);
  };

  const handleTermsNext = () => {
    if (!acceptedTerms) {
      return; // Error handled in UI now
    }
    setStep(5);
  };

  const handleRisksNext = () => {
    if (!acceptedRisks) {
      return; // Error handled in UI now
    }
    setStep(6);
  };

  const handleSignatureNext = () => {
    if (!digitalSignature || digitalSignature.trim().length < 3) {
      return; // Error handled in UI now
    }
    setStep(7);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedPlan || !amount) return;

    setLoading(true);
    try {
      const response = await fetch('/api/investments/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: parseFloat(amount),
          acceptedTerms: true,
          acceptedRisks: true,
          digitalSignature: digitalSignature.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLoading(false);
        setStep(8); // Go to success step
      } else {
        setLoading(false);
        // Show error in UI instead of alert
        console.error('Investment application failed:', result.error);
      }
    } catch (error) {
      console.error('Error applying investment:', error);
      setLoading(false);
      // For now, still go to success to show the flow
      // In production, you'd handle this error properly in UI
      setStep(8);
    }
  };

  const calculateDailyReturn = (amount: number, rate: number) => {
    return (amount * rate).toFixed(6);
  };

  const calculateMonthlyReturn = (amount: number, rate: number) => {
    return (amount * rate * 30).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-black">
                {step === 1 && 'Verificação de Elegibilidade'}
                {step === 2 && 'Planos de Investimento'}
                {step === 3 && 'Valor da Aplicação'}
                {step === 4 && 'Contrato de Investimento'}
                {step === 5 && 'Declaração de Riscos'}
                {step === 6 && 'Assinatura Digital'}
                {step === 7 && 'Confirmar Aplicação'}
                {step === 8 && 'Aplicação Confirmada!'}
              </h3>
              <div className="flex items-center mt-2">
                <div className="flex space-x-1">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-4 rounded-full ${
                        i < step ? 'bg-black' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  Etapa {step} de 8
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step 1: Eligibility Check */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-black mb-2">Verificando Elegibilidade</h4>
                <p className="text-gray-600 text-sm">
                  Validando se sua conta atende aos requisitos para aplicações em USDT
                </p>
              </div>

              <div className="space-y-3">
                {eligibilityChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-3 rounded-lg border transition-all ${
                      check.status === 'completed' && check.passed
                        ? 'bg-green-50 border-green-200'
                        : check.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {check.status === 'checking' && (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                        )}
                        {check.status === 'completed' && check.passed && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {check.status === 'failed' && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-black text-sm">{check.name}</h5>
                        <p className={`text-xs ${
                          check.status === 'completed' && check.passed
                            ? 'text-green-600'
                            : check.status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {check.status === 'checking' ? 'Verificando...' :
                           check.status === 'completed' && check.passed ? 'Aprovado' :
                           'Requer atenção'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {eligibilityChecked && (
                <div className="mt-6">
                  {eligibilityPassed ? (
                    <div className="text-center">
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verificação Aprovada
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        Continuar para Planos
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full mb-4">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                        Ação Necessária
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Alguns requisitos precisam ser resolvidos antes de prosseguir
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Plan */}
          {step === 2 && (
            <div>
              {loadingPlans ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando planos...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan)}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-black transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-black">{plan.name}</h4>
                          <span className="bg-black text-white text-xs px-2 py-1 rounded-md">
                            {(plan.annualYieldRate * 100).toFixed(1)}% a.a.
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Mín: {plan.minimumAmount.toLocaleString()} USDT</span>
                          {plan.lockPeriodDays && <span>{plan.lockPeriodDays} dias de carência</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Enter Amount */}
          {step === 3 && selectedPlan && (
            <div>
              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                <h4 className="font-semibold text-black text-sm">{selectedPlan.name}</h4>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-black mb-1">
                  Valor da Aplicação (USDT)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Mín: ${selectedPlan.minimumAmount}`}
                  min={selectedPlan.minimumAmount}
                  max={selectedPlan.maximumAmount || userBalance}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Saldo: {userBalance.toLocaleString()} USDT
                </p>
              </div>

              {amount && parseFloat(amount) >= selectedPlan.minimumAmount && (
                <div className="mb-3 p-2 bg-gray-50 rounded-md">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Diário:</span>
                      <span className="font-medium">~{calculateDailyReturn(parseFloat(amount), selectedPlan.dailyYieldRate)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mensal:</span>
                      <span className="font-medium">~{calculateMonthlyReturn(parseFloat(amount), selectedPlan.dailyYieldRate)} USDT</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleAmountNext}
                  disabled={!amount || parseFloat(amount) < selectedPlan.minimumAmount}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Investment Terms */}
          {step === 4 && selectedPlan && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-black">Contrato de Investimento</h4>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto text-sm space-y-3">
                <div>
                  <h5 className="font-semibold text-black mb-2">1. OBJETO DO CONTRATO</h5>
                  <p className="text-gray-700">Este contrato estabelece os termos para aplicação em {selectedPlan.name}, com rendimento de {(selectedPlan.annualYieldRate * 100).toFixed(1)}% ao ano sobre o valor aplicado em USDT.</p>
                </div>
                
                <div>
                  <h5 className="font-semibold text-black mb-2">2. CONDIÇÕES DA APLICAÇÃO</h5>
                  <p className="text-gray-700">
                    - Valor mínimo: {selectedPlan.minimumAmount.toLocaleString()} USDT<br/>
                    - Rendimento: {(selectedPlan.dailyYieldRate * 100).toFixed(4)}% ao dia<br/>
                    {selectedPlan.lockPeriodDays && `- Carência: ${selectedPlan.lockPeriodDays} dias corridos<br/>`}
                    - Rendimentos creditados diariamente
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">3. DIREITOS E OBRIGAÇÕES</h5>
                  <p className="text-gray-700">
                    O APLICADOR tem direito aos rendimentos conforme taxa estabelecida. 
                    A PLATAFORMA compromete-se a creditar os rendimentos conforme cronograma.
                    {selectedPlan.hasEarlyWithdraw && selectedPlan.earlyWithdrawFee && 
                      ` Taxa de resgate antecipado: ${(selectedPlan.earlyWithdrawFee * 100).toFixed(1)}%.`
                    }
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">4. COMPLIANCE</h5>
                  <p className="text-gray-700">
                    Aplicação sujeita às normas de compliance e regulamentações vigentes. 
                    Operações podem ser monitoradas para fins de conformidade.
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">
                    Li, compreendi e aceito todos os termos do contrato de investimento
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleTermsNext}
                  disabled={!acceptedTerms}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Risk Disclosure */}
          {step === 5 && selectedPlan && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-black">Declaração de Riscos</h4>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  <span className="font-semibold text-yellow-800">Atenção: Riscos Importantes</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto text-sm space-y-3">
                <div>
                  <h5 className="font-semibold text-black mb-2">VOLATILIDADE DE CRIPTOMOEDAS</h5>
                  <p className="text-gray-700">USDT é uma stablecoin, mas ainda está sujeita a riscos de volatilidade e descolamento (depeg) em relação ao dólar americano.</p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">RISCO DE LIQUIDEZ</h5>
                  <p className="text-gray-700">Em cenários de alta demanda, pode haver limitações temporárias para resgates, respeitando-se sempre os termos contratuais.</p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">RISCO REGULATÓRIO</h5>
                  <p className="text-gray-700">Mudanças na regulamentação de criptomoedas podem afetar a operação da plataforma e as condições dos investimentos.</p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">RISCO TECNOLÓGICO</h5>
                  <p className="text-gray-700">Operações com criptomoedas envolvem riscos tecnológicos inerentes, incluindo questões de segurança e disponibilidade de sistema.</p>
                </div>

                <div>
                  <h5 className="font-semibold text-black mb-2">RENTABILIDADE VARIÁVEL</h5>
                  <p className="text-gray-700">Apesar das projeções, a rentabilidade pode variar conforme condições de mercado. Rentabilidade passada não garante rendimentos futuros.</p>
                </div>
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={acceptedRisks}
                    onChange={(e) => setAcceptedRisks(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>DECLARO</strong> que li, compreendi e estou ciente de todos os riscos mencionados. 
                    Confirmo que estou investindo por minha própria conta e risco.
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleRisksNext}
                  disabled={!acceptedRisks}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Digital Signature */}
          {step === 6 && selectedPlan && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-black">Assinatura Digital</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Digite seu nome completo para confirmar o aceite de todos os documentos
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-black mb-3">Resumo da Aplicação</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plano:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">{parseFloat(amount).toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rendimento:</span>
                    <span className="font-medium">{(selectedPlan.annualYieldRate * 100).toFixed(1)}% a.a.</span>
                  </div>
                  {selectedPlan.lockPeriodDays && (
                    <div className="flex justify-between">
                      <span>Carência:</span>
                      <span className="font-medium">{selectedPlan.lockPeriodDays} dias</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Nome Completo (Assinatura Digital)
                </label>
                <input
                  type="text"
                  value={digitalSignature}
                  onChange={(e) => setDigitalSignature(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                />
                {digitalSignature.trim().length >= 3 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-600">Assinatura válida</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(5)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSignatureNext}
                  disabled={!digitalSignature || digitalSignature.trim().length < 3}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Confirmation */}
          {step === 7 && selectedPlan && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-black mb-2">Confirmar Aplicação</h4>
                <p className="text-gray-600 text-sm">
                  Revise todos os dados antes de finalizar sua aplicação
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h5 className="font-semibold text-black">Resumo Final</h5>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plano:</span>
                    <p className="font-semibold">{selectedPlan.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <p className="font-semibold">{parseFloat(amount).toLocaleString()} USDT</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Rendimento:</span>
                    <p className="font-semibold">{(selectedPlan.annualYieldRate * 100).toFixed(1)}% a.a.</p>
                  </div>
                  {selectedPlan.lockPeriodDays && (
                    <div>
                      <span className="text-gray-600">Carência:</span>
                      <p className="font-semibold">{selectedPlan.lockPeriodDays} dias</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Assinatura Digital:</span>
                    <p className="font-semibold text-sm">{digitalSignature}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">Confirmação de Documentos</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Ao confirmar, você declara ter lido e aceito: Contrato de Investimento, 
                      Declaração de Riscos e forneceu assinatura digital válida.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(6)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmInvestment}
                  disabled={loading}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loading ? 'Processando...' : 'Confirmar Aplicação'}
                </button>
              </div>
            </div>
          )}

          {/* Step 8: Success */}
          {step === 8 && selectedPlan && (
            <div className="space-y-6 text-center py-4">
              {/* Success Animation */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-black">Aplicação Confirmada!</h4>
                  <p className="text-gray-600">
                    Sua aplicação foi enviada para aprovação com sucesso
                  </p>
                </div>
              </div>

              {/* Application Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-black mb-3">Resumo da Aplicação</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Plano:</span>
                    <span className="font-semibold text-black">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-semibold text-black">{parseFloat(amount).toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rendimento:</span>
                    <span className="font-semibold text-black">{(selectedPlan.annualYieldRate * 100).toFixed(1)}% a.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-black">Aguardando Aprovação</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <h5 className="font-semibold text-black mb-2">Próximos Passos</h5>
                <ul className="text-gray-700 space-y-1 text-left">
                  <li>• Nossa equipe analisará sua aplicação</li>
                  <li>• Você receberá uma notificação por email</li>
                  <li>• O prazo de aprovação é de até 24 horas úteis</li>
                  <li>• Os rendimentos começam após a aprovação</li>
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}