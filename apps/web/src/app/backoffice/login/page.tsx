'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

export default function BackofficeLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/backoffice/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Login bem-sucedido 
        console.log('✅ Login successful:', data);
        console.log('🍪 Document cookies after login:', document.cookie);
        
        // Aguardar um pouco para garantir que o cookie foi definido
        setTimeout(() => {
          console.log('🍪 Document cookies after timeout:', document.cookie);
          console.log('🚀 Redirecting to /backoffice...');
          router.push('/backoffice');
        }, 500);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      console.error('Login error:', err);
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

  // Função para preencher credenciais de teste
  const fillCredentials = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-white rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-white rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-center min-h-screen">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">

          {/* Left Side - Brand */}
          <div className="flex-1 max-w-lg text-center lg:text-left">
            {/* Logo Principal */}
            <div className="mb-12 flex justify-center lg:justify-start">
              <div className="relative">
                <Image
                  src="/logo-branca.png"
                  alt="Nutzpay"
                  width={280}
                  height={120}
                  className="w-auto h-24 lg:h-28"
                  priority
                />
              </div>
            </div>

            {/* Brand Messaging */}
            <div className="space-y-6 mb-12">
              <h1 className="text-3xl lg:text-4xl font-light text-white tracking-tight">
                Central de Administração
              </h1>
              <p className="text-lg text-gray-400 font-light leading-relaxed">
                Acesso seguro ao painel administrativo
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 max-w-md w-full">
            <div className="bg-gray-950/80 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-8 lg:p-10">

              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-medium text-white mb-2">
                  Acesso Administrativo
                </h2>
                <p className="text-gray-500 text-sm">
                  Entre com suas credenciais
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Administrativo
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-12 pr-4 py-4 bg-black/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-gray-600"
                      placeholder="admin@nutzpay.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha Administrativa
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-12 pr-12 py-4 bg-black/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-gray-600"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-gray-400">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-white focus:ring-white/30 focus:ring-1"
                      disabled={loading}
                    />
                    <span className="ml-2">Lembrar acesso</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-4 px-6 bg-white hover:bg-gray-100 text-black font-medium rounded-lg focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-3"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      Acessar Sistema
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Development Credentials */}
              <div className="mt-8 p-4 bg-gray-900/20 border border-gray-800/30 rounded-lg">
                <div className="text-center mb-3">
                  <p className="text-xs text-gray-400 font-medium">Ambiente de Desenvolvimento</p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@nutzpay.com', 'admin123')}
                    className="w-full text-left p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors group border border-gray-700/30 hover:border-gray-600/50"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Super Admin</div>
                        <div className="text-xs text-gray-400">admin@nutzpay.com</div>
                      </div>
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique para preencher
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('ops@nutzpay.com', 'ops123')}
                    className="w-full text-left p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors group border border-gray-700/30 hover:border-gray-600/50"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Operations</div>
                        <div className="text-xs text-gray-400">ops@nutzpay.com</div>
                      </div>
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique para preencher
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-800/30">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <span>Nutzpay Backoffice</span>
                    <span>•</span>
                    <span>v2.1.0</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Acesso administrativo seguro
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}