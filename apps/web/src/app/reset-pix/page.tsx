'use client';

import { useState, useEffect } from 'react';

export default function ResetPixPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('felixelmada@gmail.com');
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const checkBalance = async (userEmail: string = email) => {
    try {
      const response = await fetch(`/api/reset-pix-balance?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      setCurrentBalance(data);
    } catch (error) {
      console.error('Erro ao verificar saldo:', error);
    }
  };

  const resetBalance = async () => {
    if (!confirm(`Zerar saldo PIX de ${email}?`)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/reset-pix-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Atualizar saldo após reset
        await checkBalance();
      }
    } catch (error) {
      console.error('Erro ao zerar saldo:', error);
      setResult({
        success: false,
        error: 'Erro de conexão'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBalance();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            🔄 Reset Saldo PIX
          </h1>

          <div className="space-y-6">
            {/* Input Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email do usuário:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="usuario@exemplo.com"
                />
                <button
                  onClick={() => checkBalance()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🔍 Verificar
                </button>
              </div>
            </div>

            {/* Current Balance */}
            {currentBalance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Saldos Atuais:</h3>
                
                {currentBalance.success ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">PIX Wallet</div>
                      <div className="text-lg font-semibold">
                        {currentBalance.user.wallets.pix 
                          ? `R$ ${currentBalance.user.wallets.pix.balance.toFixed(2)}`
                          : 'Não existe'
                        }
                      </div>
                      {currentBalance.user.wallets.pix && (
                        <div className="text-xs text-gray-500">
                          Recebido: R$ {currentBalance.user.wallets.pix.totalReceived.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">USDT Wallet</div>
                      <div className="text-lg font-semibold">
                        {currentBalance.user.wallets.usdt 
                          ? `${currentBalance.user.wallets.usdt.balance} USDT`
                          : 'Não existe'
                        }
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Investment Wallet</div>
                      <div className="text-lg font-semibold">
                        {currentBalance.user.wallets.investment 
                          ? `${currentBalance.user.wallets.investment.totalInvested} investido`
                          : 'Não existe'
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    ❌ {currentBalance.error}
                  </div>
                )}
              </div>
            )}

            {/* Reset Action */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-3">⚠️ Zerar Saldo PIX</h3>
              
              <p className="text-gray-700 mb-4">
                Esta ação irá:
              </p>
              <ul className="text-sm space-y-1 text-gray-600 mb-4">
                <li>• Definir saldo PIX como R$ 0,00</li>
                <li>• Criar registro da transação de reset</li>
                <li>• Manter outros wallets intactos</li>
                <li>• Criar PIX Wallet se não existir</li>
              </ul>

              <button
                onClick={resetBalance}
                disabled={loading || !email}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
              >
                {loading ? '🔄 Processando...' : '🗑️ Zerar Saldo PIX'}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`border rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? '✅ Sucesso!' : '❌ Erro'}
                </h3>
                
                {result.success ? (
                  <div className="space-y-2">
                    <p className="text-green-800">{result.message}</p>
                    {result.oldBalance !== null && (
                      <div className="text-sm text-green-700">
                        <strong>Saldo anterior:</strong> R$ {result.oldBalance.toFixed(2)} → 
                        <strong> Novo saldo:</strong> R$ {result.newBalance.toFixed(2)}
                      </div>
                    )}
                    <div className="text-sm text-green-600">
                      Tipo: {result.walletType}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-800">{result.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}