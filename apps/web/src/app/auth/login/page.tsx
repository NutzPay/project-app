'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Mail, 
  Lock, 
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Login successful:', result.user);
        router.push('/dashboard');
      } else {
        alert(result.error || 'Erro no login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
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
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white"></div>
        
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
          {/* Logo - Reduzido */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="w-48 h-48 flex items-center justify-center bg-white rounded-3xl shadow-2xl border border-red-100 group-hover:shadow-3xl transition-all duration-500">
                <Image 
                  src="/banners/logo.png" 
                  alt="Nutzpay" 
                  width={180} 
                  height={135}
                  className="object-contain transition-all duration-500 group-hover:scale-105"
                />
              </div>
              {/* Glow effect sutil */}
              <div className="absolute -inset-4 bg-red-100/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>
          </div>

          {/* Brand messaging */}
          <div className="space-y-4">
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Onde a inteligência vence
            </p>
          </div>

          {/* Stats brasileiros */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-xl font-medium text-gray-900">R$ 1B+</div>
              <div className="text-sm text-gray-500">Processado</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium text-gray-900">10K+</div>
              <div className="text-sm text-gray-500">Empresas</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium text-gray-900">99,9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 bg-white">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-xl border border-red-100 flex items-center justify-center">
              <Image 
                src="/banners/logo.png" 
                alt="Nutzpay" 
                width={120} 
                height={90}
                className="object-contain"
              />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl font-medium text-gray-900 mb-3">
              Faça seu login
            </h2>
            <p className="text-gray-600">
              Acesse sua conta Nutzpay
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700">
                  Lembrar de mim
                </label>
              </div>

              <Link href="/auth/forgot-password" className="text-sm font-medium text-red-600 hover:text-red-500">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-6 mt-6 border-t border-gray-200">
              <span className="text-gray-600">Não tem uma conta? </span>
              <Link href="/auth/register" className="font-medium text-red-600 hover:text-red-500">
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}