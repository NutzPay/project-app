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
            <div className="mb-8 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="w-40 h-40 lg:w-48 lg:h-48 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl border border-red-500/20 group-hover:border-red-500/40 transition-all duration-500">
                  <div className="text-center">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -inset-2 bg-red-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="text-white font-bold text-lg tracking-wider">NUTZ</div>
                    <div className="text-red-400 font-medium text-sm">BACKOFFICE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Messaging */}
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl lg:text-4xl font-light text-white tracking-tight">
                Central de
                <span className="block font-medium text-red-400">Administração</span>
              </h1>
              <p className="text-lg text-gray-400 font-light leading-relaxed">
                Controle total do ecossistema Nutz com segurança empresarial
              </p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-2xl bg-gray-900/30 border border-gray-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-lg font-semibold text-white">99.9%</div>
                <div className="text-xs text-gray-500">Uptime</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-gray-900/30 border border-gray-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-lg font-semibold text-white">24/7</div>
                <div className="text-xs text-gray-500">Monitor</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-gray-900/30 border border-gray-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-lg font-semibold text-white">1,2K+</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
            </div>

            {/* Security Features */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900/50 rounded-full border border-gray-800/50">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Real-time</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900/50 rounded-full border border-gray-800/50">
                <Server className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Isolado</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900/50 rounded-full border border-gray-800/50">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Auditado</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 max-w-md w-full">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800/50 p-8 lg:p-10">

              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-2">
                  Acesso Seguro
                </h2>
                <p className="text-gray-400 text-sm">
                  Entre com suas credenciais administrativas
                </p>
              </div>

              {/* System Status */}
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-300 font-medium">Sistema Online</p>
                    <p className="text-xs text-green-400/70">Todos os serviços operacionais</p>
                  </div>
                </div>
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
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-red-400 transition-colors" />
                    <input
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-12 pr-4 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 hover:border-gray-600"
                      placeholder="admin@nutz.com"
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
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-red-400 transition-colors" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-12 pr-12 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 hover:border-gray-600"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-300 transition-colors"
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
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500/50 focus:ring-2"
                      disabled={loading}
                    />
                    <span className="ml-2">Lembrar acesso</span>
                  </label>
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span>Whitelist Ativo</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shadow-lg hover:shadow-red-500/25"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3 w-5 h-5" />
                      Acessar Backoffice
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Development Credentials */}
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="text-center mb-3">
                  <p className="text-xs text-blue-300 font-semibold">🧪 Ambiente de Desenvolvimento</p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@nutz.com', 'admin123')}
                    className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group border border-gray-700/50 hover:border-gray-600"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Super Admin</div>
                        <div className="text-xs text-gray-400">admin@nutz.com</div>
                      </div>
                      <div className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique para preencher
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('ops@nutz.com', 'ops123')}
                    className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group border border-gray-700/50 hover:border-gray-600"
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Operations</div>
                        <div className="text-xs text-gray-400">ops@nutz.com</div>
                      </div>
                      <div className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique para preencher
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <span>Nutz Backoffice</span>
                    <span>•</span>
                    <span>v2.1.0</span>
                    <span>•</span>
                    <span className="text-green-400">Ambiente Seguro</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Acesso monitorado e auditado em tempo real
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