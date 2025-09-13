'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';

export default function ExchangeTermsPage() {
  const [acceptedSections, setAcceptedSections] = useState({
    contract: false,
    terms: false,
    privacy: false,
    risks: false
  });
  const [signature, setSignature] = useState('');
  const [showSignatureField, setShowSignatureField] = useState(false);

  const allAccepted = Object.values(acceptedSections).every(Boolean) && signature.length >= 3;

  const handleSectionAccept = (section: keyof typeof acceptedSections) => {
    setAcceptedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleContinue = () => {
    if (allAccepted) {
      window.location.href = '/exchange/calculator';
    }
  };

  return (
    <DashboardLayout userType="user">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-black">Termos e Condições</h1>
            <Link href="/exchange/eligibility" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-black rounded-full w-3/7"></div>
            </div>
            <span className="text-sm text-gray-500">Etapa 3 de 7</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exchange Contract */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Contrato de Câmbio</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="contract"
                      checked={acceptedSections.contract}
                      onChange={() => handleSectionAccept('contract')}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="contract" className="text-sm font-medium text-gray-700">
                      Li e aceito
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto text-sm text-gray-600 space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">1. OBJETO DO CONTRATO</h3>
                  <p>Este contrato tem por objeto a prestação de serviços de câmbio digital, consistente na conversão de moeda nacional (Real - BRL) em criptomoeda USDT (Tether), conforme as condições aqui estabelecidas.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">2. PARTES CONTRATANTES</h3>
                  <p><strong>CONTRATADA:</strong> Nutz Financial Services Ltda, empresa devidamente autorizada pelo Banco Central do Brasil para operações de câmbio digital.</p>
                  <p><strong>CONTRATANTE:</strong> O usuário devidamente identificado e qualificado na plataforma.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">3. CONDIÇÕES DA OPERAÇÃO</h3>
                  <p>3.1. A taxa de câmbio será estabelecida no momento da confirmação da operação, baseada na cotação internacional da USDT;</p>
                  <p>3.2. Será aplicada taxa de serviço de até 2% sobre o valor da operação;</p>
                  <p>3.3. O prazo para conversão é de até 24 horas úteis após confirmação do pagamento;</p>
                  <p>3.4. Valores mínimos e máximos conforme regulamentação vigente do Banco Central.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">4. OBRIGAÇÕES DO CONTRATANTE</h3>
                  <p>4.1. Fornecer informações verdadeiras e atualizadas;</p>
                  <p>4.2. Efetuar o pagamento dentro do prazo estipulado;</p>
                  <p>4.3. Manter sigilo sobre dados de acesso à plataforma;</p>
                  <p>4.4. Informar imediatamente sobre qualquer irregularidade.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">5. COMPLIANCE E REGULAMENTAÇÃO</h3>
                  <p>5.1. Todas as operações seguem as normas do Banco Central do Brasil;</p>
                  <p>5.2. Aplicam-se as regulamentações anti-lavagem de dinheiro (AML);</p>
                  <p>5.3. Operações podem ser reportadas aos órgãos competentes quando necessário.</p>
                </div>
              </div>
            </div>

            {/* Terms of Use */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Termos de Uso da Plataforma</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedSections.terms}
                      onChange={() => handleSectionAccept('terms')}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="terms" className="text-sm font-medium text-gray-700">
                      Li e aceito
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto text-sm text-gray-600 space-y-3">
                <p><strong>USO AUTORIZADO:</strong> A plataforma destina-se exclusivamente a operações de câmbio autorizadas e legítimas.</p>
                <p><strong>RESPONSABILIDADES:</strong> O usuário é responsável por manter a segurança de seus dados de acesso e por todas as operações realizadas em sua conta.</p>
                <p><strong>LIMITAÇÕES:</strong> Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou a legislação vigente.</p>
                <p><strong>MODIFICAÇÕES:</strong> Os termos podem ser alterados mediante aviso prévio de 30 dias.</p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Política de Privacidade</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={acceptedSections.privacy}
                      onChange={() => handleSectionAccept('privacy')}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="privacy" className="text-sm font-medium text-gray-700">
                      Li e aceito
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto text-sm text-gray-600 space-y-3">
                <p><strong>COLETA DE DADOS:</strong> Coletamos apenas dados necessários para cumprimento das obrigações legais e prestação dos serviços.</p>
                <p><strong>USO DE DADOS:</strong> Seus dados são utilizados exclusivamente para processamento das operações e compliance regulatório.</p>
                <p><strong>COMPARTILHAMENTO:</strong> Dados podem ser compartilhados com autoridades competentes quando exigido por lei.</p>
                <p><strong>SEGURANÇA:</strong> Implementamos medidas técnicas e organizacionais para proteger seus dados pessoais.</p>
                <p><strong>DIREITOS:</strong> Você tem direito de acesso, correção, exclusão e portabilidade dos seus dados conforme LGPD.</p>
              </div>
            </div>

            {/* Risk Disclosure */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Declaração de Riscos</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="risks"
                      checked={acceptedSections.risks}
                      onChange={() => handleSectionAccept('risks')}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="risks" className="text-sm font-medium text-gray-700">
                      Li e aceito
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto text-sm text-gray-600 space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold text-yellow-800">Atenção: Riscos Importantes</span>
                  </div>
                </div>
                <p><strong>VOLATILIDADE:</strong> Criptomoedas são ativos voláteis e podem sofrer variações significativas de preço.</p>
                <p><strong>RISCO TECNOLÓGICO:</strong> Operações com criptomoedas envolvem riscos tecnológicos inerentes.</p>
                <p><strong>REGULAMENTAÇÃO:</strong> O ambiente regulatório pode sofrer alterações que afetem as operações.</p>
                <p><strong>IRREVERSIBILIDADE:</strong> Transações de criptomoedas são geralmente irreversíveis.</p>
                <p><strong>DECLARAÇÃO:</strong> Declaro estar ciente dos riscos e operar por minha própria conta e risco.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Checklist */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-black mb-4">Progresso da Aceitação</h3>
              <div className="space-y-3 mb-6">
                {[
                  { key: 'contract', label: 'Contrato de Câmbio', required: true },
                  { key: 'terms', label: 'Termos de Uso', required: true },
                  { key: 'privacy', label: 'Política de Privacidade', required: true },
                  { key: 'risks', label: 'Declaração de Riscos', required: true }
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      acceptedSections[item.key as keyof typeof acceptedSections]
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}>
                      {acceptedSections[item.key as keyof typeof acceptedSections] && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      acceptedSections[item.key as keyof typeof acceptedSections]
                        ? 'text-green-700 font-medium'
                        : 'text-gray-600'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Digital Signature */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-black mb-3">Assinatura Digital</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Digite seu nome completo para confirmar o aceite dos termos:
                </p>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black"
                />
                {signature.length >= 3 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-600">Assinatura válida</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  disabled={!allAccepted}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allAccepted ? 'Prosseguir para Cálculo' : 'Aceite todos os termos'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Seus dados estão protegidos e seguros
                </p>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-black">Dúvidas jurídicas?</h4>
                  <p className="text-xs text-gray-600">Consulte nosso time legal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}