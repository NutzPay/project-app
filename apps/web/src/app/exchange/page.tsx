'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';

export default function ExchangePage() {
  return (
    <DashboardLayout userType="user">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">Câmbio Profissional</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Converta seus reais em USDT através do nosso serviço regulamentado de câmbio digital
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Service Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-6">Por que escolher nosso câmbio?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-2">Regulamentado e Seguro</h3>
                    <p className="text-gray-600 text-sm">Operação autorizada pelo Banco Central, com total compliance às normas vigentes</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-2">Cotação Competitiva</h3>
                    <p className="text-gray-600 text-sm">Taxas transparentes e competitivas, baseadas na cotação internacional</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-2">Processamento Rápido</h3>
                    <p className="text-gray-600 text-sm">Conversão processada em até 24 horas úteis após confirmação do pagamento</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-2">Suporte Especializado</h3>
                    <p className="text-gray-600 text-sm">Acompanhamento dedicado durante todo o processo de câmbio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-black mb-6">Documentos Necessários</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">CPF ou CNPJ válido</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Conta bancária em seu nome</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Comprovante de renda (para valores acima de R$ 50.000)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Carteira de cripto moedas própria</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Action Card */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sticky top-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Operação Segura
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">Inicie sua Operação</h3>
                <p className="text-gray-600 mb-8">
                  Processo 100% digital e seguro, com acompanhamento em tempo real
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">5min</div>
                  <div className="text-xs text-gray-500">Processo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">24h</div>
                  <div className="text-xs text-gray-500">Conversão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">0,5%</div>
                  <div className="text-xs text-gray-500">Taxa</div>
                </div>
              </div>

              {/* Current Rate Preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Cotação atual USDT/BRL</span>
                  <span className="text-xs text-gray-400">Atualizada agora</span>
                </div>
                <div className="text-2xl font-bold text-black">R$ 5,431</div>
                <div className="text-xs text-gray-500 mt-1">+ Taxa de câmbio aplicada no checkout</div>
              </div>

              {/* Action Button */}
              <Link 
                href="/exchange/eligibility"
                className="block w-full bg-black text-white py-4 rounded-xl font-semibold text-center hover:bg-gray-800 transition-all"
              >
                Iniciar Solicitação de Câmbio
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                Ao continuar, você concorda com nossos{' '}
                <Link href="/terms" className="underline hover:text-gray-700">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacy" className="underline hover:text-gray-700">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-black mb-2">Processo Transparente</h3>
            <p className="text-gray-600">Acompanhe cada etapa da sua operação de câmbio</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">1</span>
              </div>
              <h4 className="font-semibold text-black mb-2">Verificação</h4>
              <p className="text-sm text-gray-600">Validação de elegibilidade e documentos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">2</span>
              </div>
              <h4 className="font-semibold text-black mb-2">Contrato</h4>
              <p className="text-sm text-gray-600">Assinatura digital dos termos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">3</span>
              </div>
              <h4 className="font-semibold text-black mb-2">Pagamento</h4>
              <p className="text-sm text-gray-600">Transferência via PIX seguro</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">4</span>
              </div>
              <h4 className="font-semibold text-black mb-2">Conversão</h4>
              <p className="text-sm text-gray-600">USDT creditado na sua carteira</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}