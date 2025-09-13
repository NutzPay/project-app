'use client';

import { useState } from 'react';

export default function ZeroPixPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const zeroPixBalance = async () => {
    if (!confirm('Zerar saldo PIX do felixelmada@gmail.com?\n\nO saldo PIX deve vir apenas da Starkbank, não da XGate.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reset-pix-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'felixelmada@gmail.com' })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🧹 Zerar Saldo PIX</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Situação:</h3>
            <p className="text-blue-800 text-sm mb-2">
              O saldo PIX atual (R$ 27,73) veio incorretamente da XGate.
            </p>
            <p className="text-blue-800 text-sm">
              <strong>Correto:</strong> PIX balance deve vir apenas da Starkbank API.
            </p>
          </div>

          <button
            onClick={zeroPixBalance}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {loading ? '🔄 Zerando...' : '🗑️ Zerar Saldo PIX (felixelmada@gmail.com)'}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded border ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              {result.success ? (
                <div>
                  <h3 className="font-semibold text-green-900">✅ Sucesso!</h3>
                  <p className="text-green-800">{result.message}</p>
                  {result.oldBalance && (
                    <p className="text-sm text-green-700 mt-1">
                      Saldo anterior: R$ {result.oldBalance} → Novo: R$ 0,00
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-900">❌ Erro</h3>
                  <p className="text-red-800">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}