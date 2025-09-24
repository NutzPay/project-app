'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestDebugLoginPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDebugLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔧 Starting DEBUG login test...');
      
      const response = await fetch('/api/backoffice/auth/login-debug', {
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

      console.log('📡 Debug Login Response status:', response.status);
      
      const data = await response.json();
      console.log('📋 Debug Login Response data:', data);

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        clientCookies: document.cookie,
        timestamp: new Date().toLocaleString()
      });

      if (response.ok) {
        console.log('✅ DEBUG Login successful!');
        console.log('🍪 Client-side cookies:', document.cookie);
        
        // Aguardar e tentar redirecionar
        setTimeout(() => {
          console.log('🚀 Attempting redirect to /backoffice...');
          router.push('/backoffice');
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Debug login error:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testBackofficePageDirect = () => {
    window.open('/backoffice', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🔧 Debug Login Test
        </h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testDebugLogin}
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
          >
            {loading ? '⏳ Testing Debug Login...' : '🧪 Test Debug Login API'}
          </button>

          <button
            onClick={testBackofficePageDirect}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            🚀 Open Backoffice in New Tab (Direct Test)
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Test Result:</h2>
            <pre className="bg-gray-700 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">🔍 Debug Strategy:</h3>
          <div className="space-y-2 text-sm">
            <p>1. Esta API de debug define cookies de duas formas:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>backoffice-auth-token</code> - Visível no JavaScript (não httpOnly)</li>
              <li><code>backoffice-auth-token-http</code> - Apenas no servidor (httpOnly)</li>
            </ul>
            <p>2. O middleware foi atualizado para aceitar ambos</p>
            <p>3. Logs de debug aparecerão no console do servidor</p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📋 Steps to Debug:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Test Debug Login API" and watch browser console</li>
            <li>Check if cookies appear in the result</li>
            <li>Watch server console for middleware debug logs</li>
            <li>Try "Open Backoffice in New Tab" to test direct access</li>
            <li>If still redirecting, check server logs for the exact issue</li>
          </ol>
        </div>
      </div>
    </div>
  );
}