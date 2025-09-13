'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    avatar: null,
    accountType: '',
    companyName: '',
    document: '',
    status: '',
    role: '',
  });
  
  const [loading, setLoading] = useState(true);

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailNotifications: true,
    webhookNotifications: true,
    apiKeyNotifications: true,
  });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const result = await response.json();

        if (result.success) {
          setProfileData({
            name: result.profile.name || '',
            email: result.profile.email || '',
            phone: '', // Not available in current schema
            timezone: 'America/Sao_Paulo',
            language: 'pt-BR',
            avatar: null,
            accountType: result.profile.accountType || '',
            companyName: result.profile.companyName || '',
            document: result.profile.document || '',
            status: result.profile.status || '',
            role: result.profile.role || '',
          });
        } else {
          console.error('Error loading profile:', result.error);
          if (result.code === 'UNAUTHORIZED') {
            window.location.href = '/auth/login';
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar atualização do perfil
    console.log('Atualizando perfil:', profileData);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    // TODO: Implementar alteração de senha
    console.log('Alterando senha');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Perfil do Usuário</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas informações pessoais, preferências e configurações de segurança.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Informações Pessoais
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Atualize suas informações básicas e preferências.
              </p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img 
                      src="/default-avatar.svg" 
                      alt="Avatar do usuário" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Foto do perfil
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <button
                      type="button"
                      className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Alterar foto
                    </button>
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Fuso horário
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/New_York">Nova York (GMT-5)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                    <option value="Europe/Paris">Paris (GMT+1)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Idioma preferido
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={profileData.language}
                    onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>

              {/* Account Information */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Informações da Conta</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Conta
                    </label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {profileData.accountType === 'PF' ? 'Pessoa Física' : 
                       profileData.accountType === 'PJ' ? 'Pessoa Jurídica' : 'Não definido'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status da Conta
                    </label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {profileData.status === 'ACTIVE' ? 'Ativa' : 
                       profileData.status === 'PENDING' ? 'Pendente' : 
                       profileData.status === 'SUSPENDED' ? 'Suspensa' : 'Indefinido'}
                    </p>
                  </div>

                  {profileData.companyName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Empresa
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                        {profileData.companyName}
                      </p>
                    </div>
                  )}

                  {profileData.document && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {profileData.accountType === 'PF' ? 'CPF' : 'CNPJ'}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                        {profileData.document}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Função
                    </label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {profileData.role === 'ADMIN' ? 'Administrador' : 
                       profileData.role === 'MEMBER' ? 'Membro' : 'Usuário'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Alterar Senha
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Mantenha sua conta segura usando uma senha forte.
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                  Senha atual
                </label>
                <input
                  type="password"
                  name="current-password"
                  id="current-password"
                  value={securitySettings.currentPassword}
                  onChange={(e) => setSecuritySettings({...securitySettings, currentPassword: e.target.value})}
                  className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    name="new-password"
                    id="new-password"
                    value={securitySettings.newPassword}
                    onChange={(e) => setSecuritySettings({...securitySettings, newPassword: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    name="confirm-password"
                    id="confirm-password"
                    value={securitySettings.confirmPassword}
                    onChange={(e) => setSecuritySettings({...securitySettings, confirmPassword: e.target.value})}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Dicas de segurança
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use pelo menos 8 caracteres</li>
                        <li>Inclua letras maiúsculas e minúsculas</li>
                        <li>Adicione números e símbolos</li>
                        <li>Evite informações pessoais</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Preferências de Notificação
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure como você deseja receber notificações sobre sua conta.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">
                    Notificações por Email
                  </label>
                  <p className="text-sm text-gray-500">
                    Receber emails sobre atividades importantes na sua conta
                  </p>
                </div>
                <button
                  type="button"
                  className={`${
                    securitySettings.emailNotifications ? 'bg-red-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  onClick={() => setSecuritySettings({...securitySettings, emailNotifications: !securitySettings.emailNotifications})}
                >
                  <span
                    className={`${
                      securitySettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="webhook-notifications" className="text-sm font-medium text-gray-700">
                    Notificações de Webhook
                  </label>
                  <p className="text-sm text-gray-500">
                    Alertas quando webhooks falham ou têm problemas
                  </p>
                </div>
                <button
                  type="button"
                  className={`${
                    securitySettings.webhookNotifications ? 'bg-red-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  onClick={() => setSecuritySettings({...securitySettings, webhookNotifications: !securitySettings.webhookNotifications})}
                >
                  <span
                    className={`${
                      securitySettings.webhookNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="api-key-notifications" className="text-sm font-medium text-gray-700">
                    Notificações de Chave API
                  </label>
                  <p className="text-sm text-gray-500">
                    Alertas sobre uso suspeito ou problemas com chaves API
                  </p>
                </div>
                <button
                  type="button"
                  className={`${
                    securitySettings.apiKeyNotifications ? 'bg-red-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  onClick={() => setSecuritySettings({...securitySettings, apiKeyNotifications: !securitySettings.apiKeyNotifications})}
                >
                  <span
                    className={`${
                      securitySettings.apiKeyNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}