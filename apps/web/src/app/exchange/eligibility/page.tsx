'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EligibilityCheck {
  id: string;
  title: string;
  description: string;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  details?: string;
}

export default function EligibilityPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const [checks, setChecks] = useState<EligibilityCheck[]>([
    {
      id: 'account',
      title: 'Verificação de Conta',
      description: 'Validando status da conta e histórico',
      status: 'checking'
    },
    {
      id: 'kyc',
      title: 'Documentação KYC',
      description: 'Verificando documentos de identificação',
      status: 'checking'
    },
    {
      id: 'limits',
      title: 'Limites Operacionais',
      description: 'Checando limites disponíveis para câmbio',
      status: 'checking'
    },
    {
      id: 'compliance',
      title: 'Compliance AML',
      description: 'Verificação anti-lavagem de dinheiro',
      status: 'checking'
    },
    {
      id: 'banking',
      title: 'Dados Bancários',
      description: 'Validando informações de conta bancária',
      status: 'checking'
    }
  ]);

  const runEligibilityChecks = async () => {
    setIsChecking(true);
    
    for (let i = 0; i < checks.length; i++) {
      setCurrentStep(i);
      
      // Simulate API calls with realistic delays
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      setChecks(prev => prev.map((check, index) => {
        if (index === i) {
          // Simulate realistic results
          const rand = Math.random();
          if (check.id === 'account') {
            return { ...check, status: 'passed', details: 'Conta ativa e em boa situação' };
          } else if (check.id === 'limits' && rand < 0.1) {
            return { ...check, status: 'warning', details: 'Limite mensal próximo ao máximo (R$ 45.000 de R$ 50.000)' };
          } else if (check.id === 'banking' && rand < 0.05) {
            return { ...check, status: 'failed', details: 'Dados bancários incompletos. Atualize seu perfil.' };
          } else {
            return { ...check, status: 'passed', details: 'Verificação aprovada' };
          }
        }
        return check;
      }));
    }
    
    setIsChecking(false);
    
    // Check if all passed
    setTimeout(() => {
      const failed = checks.some(check => check.status === 'failed');
      setAllPassed(!failed);
    }, 500);
  };

  useEffect(() => {
    // Start checks after component mounts
    const timer = setTimeout(() => {
      runEligibilityChecks();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return (
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        );
      case 'passed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="user">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">Verificação de Elegibilidade</h1>
            <Link href="/exchange" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-black rounded-full w-2/7"></div>
            </div>
            <span className="text-sm text-gray-500">Etapa 2 de 7</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Verificando Elegibilidade</h2>
            <p className="text-gray-600">
              Estamos validando se sua conta atende aos requisitos para operações de câmbio
            </p>
          </div>

          {/* Eligibility Checks */}
          <div className="space-y-4 mb-8">
            {checks.map((check, index) => (
              <div
                key={check.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  check.status === 'passed'
                    ? 'bg-green-50 border-green-200'
                    : check.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : check.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-1">{check.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{check.description}</p>
                    {check.details && (
                      <p className={`text-xs ${
                        check.status === 'passed'
                          ? 'text-green-700'
                          : check.status === 'warning'
                          ? 'text-yellow-700'
                          : check.status === 'failed'
                          ? 'text-red-700'
                          : 'text-gray-500'
                      }`}>
                        {check.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          {isChecking && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin mr-3"></div>
                <span className="text-sm text-gray-700">
                  Verificando: {checks[currentStep]?.title}...
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          {!isChecking && allPassed && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-full mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verificação Aprovada
              </div>
              <p className="text-gray-600 mb-6">
                Sua conta atende a todos os requisitos para operações de câmbio
              </p>
            </div>
          )}

          {!isChecking && !allPassed && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-red-100 text-red-800 rounded-full mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Ação Necessária
              </div>
              <p className="text-gray-600 mb-6">
                Alguns requisitos precisam ser atendidos antes de prosseguir
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link 
              href="/exchange"
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-50 transition-all"
            >
              Voltar
            </Link>
            
            {!isChecking && allPassed && (
              <Link 
                href="/exchange/terms"
                className="flex-1 bg-black text-white py-3 rounded-xl font-semibold text-center hover:bg-gray-800 transition-all"
              >
                Continuar para Termos
              </Link>
            )}
            
            {!isChecking && !allPassed && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">Precisa de ajuda?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Se alguma verificação falhou, nossa equipe pode ajudar a resolver. Entre em contato conosco.
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Falar com Suporte →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}