'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  FileText, 
  ArrowRight
} from 'lucide-react';

type AccountType = 'PF' | 'PJ';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('PJ');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    document: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (formData.password !== formData.confirmPassword) {
        alert('As senhas não coincidem');
        return;
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          accountType
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'Conta criada com sucesso! Aguarde a aprovação do administrador.');
        router.push('/auth/login');
      } else {
        alert(result.error || 'Erro no registro');
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:flex-1 lg:relative lg:items-center lg:justify-center bg-white overflow-hidden">
        {/* Subtle red accent */}
        <div className="absolute inset-0 bg-gradient-to-tl from-red-50 to-white"></div>
        
        {/* Lion Background */}
        <div className="absolute -left-80 top-1/2 -translate-y-1/2 opacity-5">
          <Image 
            src="/assets/leao.png" 
            alt="" 
            width={1120} 
            height={1120}
            className="object-contain"
          />
        </div>
        
        <div className="relative z-10 text-center max-w-lg px-12">
          {/* Logo - Compacto */}
          <div className="mb-6 flex justify-center">
            <div className="relative group">
              <div className="w-40 h-40 flex items-center justify-center bg-white rounded-3xl shadow-2xl border border-red-100 group-hover:shadow-3xl transition-all duration-500">
                <Image 
                  src="/banners/logo.png" 
                  alt="Nutzpay" 
                  width={160} 
                  height={120}
                  className="object-contain transition-all duration-500 group-hover:scale-105"
                />
              </div>
              {/* Glow effect sutil */}
              <div className="absolute -inset-4 bg-red-100/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>
          </div>

          {/* Brand messaging */}
          <div className="space-y-3">
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">
              Junte-se à Nutzpay
            </h1>
            <p className="text-base text-gray-600 font-light">
              Onde a inteligência vence
            </p>
            <div className="text-xs text-gray-600 bg-red-50 rounded-lg px-4 py-2 inline-block border border-red-100">
              Plataforma financeira premium
            </div>
          </div>

          {/* Benefits brasileiros - Compacto */}
          <div className="mt-8 space-y-4 text-left">
            <div>
              <div className="text-gray-900 font-medium text-sm">Processamento instantâneo</div>
              <div className="text-gray-500 text-xs">Transações em tempo real</div>
            </div>
            <div>
              <div className="text-gray-900 font-medium text-sm">Onboarding rapido</div>
              <div className="text-gray-500 text-xs">Processo simplificado</div>
            </div>
            <div>
              <div className="text-gray-900 font-medium text-sm">Segurança empresarial</div>
              <div className="text-gray-500 text-xs">Proteção nível bancário</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 bg-white">
        <div className="max-w-md w-full py-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="w-36 h-36 mx-auto bg-white rounded-2xl shadow-xl border border-red-100 flex items-center justify-center">
              <Image 
                src="/banners/logo.png" 
                alt="Nutzpay" 
                width={130} 
                height={98}
                className="object-contain"
              />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">
              Crie sua conta
            </h2>
          </div>

          {/* Account Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Tipo de conta
            </label>
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-1 grid grid-cols-2 gap-1">
              {(['PF', 'PJ'] as AccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`
                    flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200
                    ${accountType === type
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {type === 'PF' ? (
                    <User className="w-4 h-4 mr-2" />
                  ) : (
                    <Building2 className="w-4 h-4 mr-2" />
                  )}
                  {type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {accountType === 'PF' ? 'Nome completo' : 'Nome do responsável'}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      name="password"
                      type="password"
                      required
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Senha"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confirmar
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Confirmar"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Company fields for PJ */}
              {accountType === 'PJ' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nome da empresa
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        name="companyName"
                        type="text"
                        required={accountType === 'PJ'}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Nome da sua empresa"
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      CNPJ
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input
                        name="document"
                        type="text"
                        required={accountType === 'PJ'}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="00.000.000/0000-00"
                        value={formData.document}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CPF for PF */}
              {accountType === 'PF' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CPF
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      name="document"
                      type="text"
                      required={accountType === 'PF'}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="000.000.000-00"
                      value={formData.document}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>


            <div className="text-center pt-2">
              <span className="text-gray-600 text-sm">Já tem uma conta? </span>
              <Link href="/auth/login" className="font-medium text-red-600 hover:text-red-500 text-sm">
                Fazer login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}