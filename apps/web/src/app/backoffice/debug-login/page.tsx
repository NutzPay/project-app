'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔍 Testando login API...');
      
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

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📋 Response data:', data);

      setResult({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        cookies: document.cookie,
      });

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Testando API de sellers...');
      
      const response = await fetch('/api/backoffice/sellers', {
        method: 'GET',
        credentials: 'include',
      });

      console.log('📡 Sellers API status:', response.status);
      const data = await response.json();
      console.log('📋 Sellers API data:', data);

      setResult(prev => ({
        ...prev,
        sellersTest: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }));

    } catch (error) {
      console.error('❌ Erro no teste de sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Debug Login Backoffice</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Login API'}
          </button>
          
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testando...' : 'Testar Sellers API'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Resultado do Teste:</h2>
            <pre className="bg-gray-700 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Informações de Debug:</h2>
          <div className="space-y-2 text-sm">
            <div><strong>URL Atual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div><strong>Cookies:</strong> {typeof document !== 'undefined' ? document.cookie || 'Nenhum cookie' : 'N/A'}</div>
            <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Credenciais de Teste:</h3>
          <div className="space-y-1 text-sm">
            <div>Email: admin@nutz.com</div>
            <div>Senha: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
}