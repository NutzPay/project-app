'use client';

import { useState } from 'react';

export default function SimpleBackofficeTest() {
  const [formData, setFormData] = useState({
    email: 'admin@nutz.com',
    password: 'admin123',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Iniciando teste de login...');
      console.log('📋 Dados do formulário:', formData);

      const response = await fetch('/api/backoffice/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 OK:', response.ok);

      const data = await response.json();
      console.log('📋 Dados da resposta:', data);

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toLocaleString()
      });

      if (response.ok) {
        console.log('✅ Login realizado com sucesso!');
        // Tentar redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = '/backoffice';
        }, 2000);
      } else {
        console.log('❌ Falha no login:', data.error);
      }

    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧪 Teste Simples - Login Backoffice
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Senha:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50"
          >
            {loading ? '⏳ Testando...' : '🚀 Testar Login'}
          </button>
        </form>

        {result && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Resultado do Teste:</h3>
            <pre className="text-sm bg-gray-700 p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-400 space-y-2">
          <div><strong>URL atual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          <div><strong>Cookies:</strong> {typeof document !== 'undefined' ? document.cookie || 'Nenhum' : 'N/A'}</div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 rounded">
          <p className="text-sm text-blue-300">
            Este é um teste direto da API de login. Se funcionar, o problema está na interface principal.
          </p>
        </div>
      </div>
    </div>
  );
}