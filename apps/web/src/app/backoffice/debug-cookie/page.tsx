'use client';

import { useState, useEffect } from 'react';

export default function DebugCookiePage() {
  const [cookieInfo, setCookieInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar cookies no carregamento
    checkCookies();
  }, []);

  const checkCookies = () => {
    const allCookies = document.cookie;
    const backofficeToken = getCookie('backoffice-auth-token');
    
    setCookieInfo({
      allCookies,
      backofficeToken,
      hasBackofficeToken: !!backofficeToken,
      timestamp: new Date().toLocaleString()
    });
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const testLogin = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/backoffice/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@nutz.com',
          password: 'admin123'
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('🔧 Login response:', data);
      
      // Aguardar um pouco e verificar cookies novamente
      setTimeout(() => {
        checkCookies();
      }, 1000);

    } catch (error) {
      console.error('❌ Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBackofficeAccess = async () => {
    try {
      const response = await fetch('/api/backoffice/sellers', {
        method: 'GET',
        credentials: 'include',
      });

      console.log('🔧 Backoffice access status:', response.status);
      const data = await response.json();
      console.log('🔧 Backoffice access data:', data);

    } catch (error) {
      console.error('❌ Backoffice access error:', error);
    }
  };

  const clearCookies = () => {
    document.cookie = 'backoffice-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    checkCookies();
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🍪 Debug Cookies - Backoffice</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={checkCookies}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔍 Verificar Cookies
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? '⏳ Logando...' : '🚀 Fazer Login'}
          </button>

          <button
            onClick={testBackofficeAccess}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-4"
          >
            🏢 Testar Acesso Backoffice
          </button>

          <button
            onClick={clearCookies}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-4"
          >
            🗑️ Limpar Cookies
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Informações dos Cookies:</h2>
          <pre className="bg-gray-700 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(cookieInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Como Testar:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Clique em "Fazer Login" para autenticar</li>
            <li>Clique em "Verificar Cookies" para ver se o token foi salvo</li>
            <li>Clique em "Testar Acesso Backoffice" para verificar se as APIs funcionam</li>
            <li>Tente acessar <a href="/backoffice" className="text-blue-400 underline">/backoffice</a> em nova aba</li>
          </ol>
        </div>

        <div className="mt-4 bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug do Problema:</h3>
          <p className="text-sm text-yellow-300">
            Se o cookie aparece aqui mas mesmo assim você é redirecionado para login, 
            o problema está no middleware não conseguindo ler o cookie corretamente.
          </p>
        </div>
      </div>
    </div>
  );
}