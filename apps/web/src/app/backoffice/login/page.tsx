'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Mail, 
  Lock, 
  Shield,
  Server,
  Activity
} from 'lucide-react';

export default function BackofficeLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Side - Dark Brand */}
      <div className="hidden lg:flex lg:flex-1 lg:relative lg:items-center lg:justify-center bg-gray-950 overflow-hidden">
        {/* Dark gradient with red accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20"></div>
        
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-red-500/20 rotate-45"></div>
          <div className="absolute bottom-40 right-32 w-24 h-24 border border-red-500/20 rotate-12"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-red-500/20 -rotate-45"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-lg px-12">
          {/* Backoffice Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="w-48 h-48 flex items-center justify-center bg-gray-900 rounded-3xl shadow-2xl border border-red-900/50 group-hover:shadow-red-900/20 group-hover:shadow-3xl transition-all duration-500">
                <div className="text-center">
                  <Shield className="w-20 h-20 text-red-500 mx-auto mb-3" />
                  <div className="text-white font-bold text-lg">BACKOFFICE</div>
                </div>
              </div>
              {/* Red glow effect */}
              <div className="absolute -inset-4 bg-red-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>
          </div>

          {/* Dark Brand messaging */}
          <div className="space-y-4">
            <h1 className="text-3xl font-light text-white tracking-tight">
              Central Administrativa
            </h1>
            <p className="text-lg text-gray-400 font-light leading-relaxed">
              Controle total do sistema
            </p>
          </div>

          {/* System Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-xl font-medium text-red-400">99.9%</div>
              <div className="text-sm text-gray-500">Segurança</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium text-red-400">24/7</div>
              <div className="text-sm text-gray-500">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium text-red-400">ISO</div>
              <div className="text-sm text-gray-500">Compliant</div>
            </div>
          </div>

          {/* Security Features */}
          <div className="mt-8 flex justify-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-xs">Whitelist</span>
            </div>
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-red-500" />
              <span className="text-xs">Isolated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-red-500" />
              <span className="text-xs">Audited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Dark Form */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 bg-gray-950">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="w-32 h-32 mx-auto bg-gray-900 rounded-2xl shadow-xl border border-red-900/50 flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <div className="text-white font-bold text-sm">BACKOFFICE</div>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl font-medium text-white mb-3">
              Acesso Administrativo
            </h2>
            <p className="text-gray-400">
              Sistema de gestão interno
            </p>
          </div>

          {/* Login Status */}
          <div className="mb-8 p-4 bg-green-900/20 border border-green-600/30 rounded-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-300">
                  <strong>Sistema Ativo</strong><br />
                  Use as credenciais de desenvolvimento para acessar.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600/30 rounded-xl">
              <div className="flex">
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

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Autorizado
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-900/50 focus:bg-gray-900"
                    placeholder="admin@nutz.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Senha de Administrador
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-900/50 focus:bg-gray-900"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
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
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-900 rounded"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-400">
                  Manter sessão segura
                </label>
              </div>

              <div className="text-sm font-medium text-gray-500">
                Whitelist Active
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Shield className="mr-2 w-5 h-5" />
                  Acessar Backoffice
                </>
              )}
            </button>

            <div className="text-center pt-6">
              <span className="text-gray-500 text-sm">Ambiente Isolado • </span>
              <span className="text-red-400 text-sm font-medium">Backoffice v0.1.0</span>
            </div>
          </form>

          {/* Development Credentials */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-xl">
            <div className="text-center mb-3">
              <p className="text-xs text-blue-300 font-medium">Credenciais de Desenvolvimento</p>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between items-center">
                <span>Super Admin:</span>
                <code className="bg-gray-800 px-2 py-1 rounded">admin@nutz.com / admin123</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Operations:</span>
                <code className="bg-gray-800 px-2 py-1 rounded">ops@nutz.com / ops123</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Support:</span>
                <code className="bg-gray-800 px-2 py-1 rounded">support@nutz.com / support123</code>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Acesso monitorado e auditado. Apenas usuários autorizados podem acessar esta área.
                Sessões completamente isoladas do sistema principal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}