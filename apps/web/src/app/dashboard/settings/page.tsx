'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState({
    name: 'Minha Empresa LTDA',
    email: 'contato@minhaempresa.com',
    document: '12.345.678/0001-90',
    phone: '+55 11 99999-9999',
    address: 'Rua Exemplo, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
  });

  const [billingSettings, setBillingSettings] = useState({
    plan: 'Pro',
    monthlyLimit: 50000,
    dailyLimit: 5000,
    requestsPerMinute: 300,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    ipWhitelistEnabled: false,
    ipWhitelist: '192.168.1.1\n10.0.0.1',
    webhookRetryEnabled: true,
    maxWebhookRetries: 3,
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Configurações</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie as configurações da sua conta, empresa e preferências de segurança.
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-bold text-black">
                Informações da Empresa
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Atualize as informações básicas da sua empresa.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-black">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="company-email" className="block text-sm font-medium text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    name="company-email"
                    id="company-email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="company-document" className="block text-sm font-medium text-black">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="company-document"
                    id="company-document"
                    value={companySettings.document}
                    onChange={(e) => setCompanySettings({...companySettings, document: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="company-phone" className="block text-sm font-medium text-black">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="company-phone"
                    id="company-phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label htmlFor="company-address" className="block text-sm font-medium text-black">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="company-address"
                    id="company-address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="company-city" className="block text-sm font-medium text-black">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="company-city"
                    id="company-city"
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings({...companySettings, city: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label htmlFor="company-state" className="block text-sm font-medium text-black">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="company-state"
                    id="company-state"
                    value={companySettings.state}
                    onChange={(e) => setCompanySettings({...companySettings, state: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-bold text-black">
                Plano e Faturamento
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Informações sobre seu plano atual e limites de uso.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
                <div>
                  <h4 className="text-lg font-bold text-black">Plano {billingSettings.plan}</h4>
                  <p className="text-sm text-gray-600">Plano atual da sua conta</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200">
                  Alterar Plano
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">R$ {billingSettings.monthlyLimit.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Limite Mensal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">R$ {billingSettings.dailyLimit.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Limite Diário</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{billingSettings.requestsPerMinute}</div>
                  <div className="text-sm text-gray-600">Requests/min</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-bold text-black">
                Configurações de Segurança
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Configure as opções de segurança para proteger sua conta.
              </p>
            </div>

            <form className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="two-factor" className="text-sm font-medium text-gray-700">
                    Autenticação de Dois Fatores (2FA)
                  </label>
                  <p className="text-sm text-gray-600">
                    Adicione uma camada extra de segurança à sua conta
                  </p>
                </div>
                <button
                  type="button"
                  className={`${
                    securitySettings.twoFactorEnabled ? 'bg-red-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  onClick={() => setSecuritySettings({...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled})}
                >
                  <span
                    className={`${
                      securitySettings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label htmlFor="ip-whitelist-enabled" className="text-sm font-medium text-gray-700">
                      Lista Branca de IPs
                    </label>
                    <p className="text-sm text-gray-600">
                      Restrinja o acesso apenas aos IPs especificados
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${
                      securitySettings.ipWhitelistEnabled ? 'bg-red-600' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    onClick={() => setSecuritySettings({...securitySettings, ipWhitelistEnabled: !securitySettings.ipWhitelistEnabled})}
                  >
                    <span
                      className={`${
                        securitySettings.ipWhitelistEnabled ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>

                {securitySettings.ipWhitelistEnabled && (
                  <div className="mt-4">
                    <label htmlFor="ip-whitelist" className="block text-sm font-medium text-black">
                      IPs Permitidos
                    </label>
                    <textarea
                      name="ip-whitelist"
                      id="ip-whitelist"
                      rows={3}
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                      placeholder="Um IP por linha"
                      className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Digite um endereço IP por linha
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label htmlFor="webhook-retry" className="text-sm font-medium text-gray-700">
                      Retry Automático de Webhooks
                    </label>
                    <p className="text-sm text-gray-600">
                      Reenviar automaticamente webhooks que falharem
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${
                      securitySettings.webhookRetryEnabled ? 'bg-red-600' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    onClick={() => setSecuritySettings({...securitySettings, webhookRetryEnabled: !securitySettings.webhookRetryEnabled})}
                  >
                    <span
                      className={`${
                        securitySettings.webhookRetryEnabled ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>

                {securitySettings.webhookRetryEnabled && (
                  <div className="mt-4">
                    <label htmlFor="max-retries" className="block text-sm font-medium text-black">
                      Máximo de Tentativas
                    </label>
                    <select
                      id="max-retries"
                      name="max-retries"
                      value={securitySettings.maxWebhookRetries}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxWebhookRetries: parseInt(e.target.value)})}
                      className="mt-1 focus:ring-red-500 focus:border-red-500 block w-32 shadow-sm sm:text-sm border-gray-300 rounded-lg"
                    >
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}