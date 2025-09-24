'use client';

import { useState, useEffect } from 'react';

export default function FixTransactionPage() {
  const [pixId, setPixId] = useState('68abbe3f7263418b3ecafa60');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTransaction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/fix-transaction?pixId=${pixId}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Erro ao buscar transação');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const forceComplete = async (transactionData?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixId: pixId,
          action: 'force_complete',
          amount: 1.717 // Valor correto para R$ 10,10
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Transação processada com sucesso!\n\n' + 
              `Saldo anterior: ${data.result.oldBalance} USDT\n` +
              `USDT creditado: ${data.result.creditedAmount} USDT\n` +
              `Novo saldo: ${data.result.newBalance} USDT`);
        searchTransaction(); // Atualizar dados
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao processar transação');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createManual = async () => {
    const userId = prompt('Digite seu User ID:');
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixId: pixId,
          action: 'create_manual',
          amount: 1.717,
          userId: userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Transação criada e processada!\n\n' + 
              `Novo saldo: ${data.result.newBalance} USDT`);
        searchTransaction();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao criar transação manual');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const creditPixBalance = async () => {
    const userId = prompt('Digite seu User ID:');
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixId: pixId,
          action: 'credit_pix_balance',
          amount: 10.10, // R$ 10,10 no saldo PIX
          userId: userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Saldo PIX creditado!\n\n' + 
              `PIX creditado: R$ ${data.result.creditedAmount}\n` +
              `Novo saldo PIX: R$ ${data.result.newBalance}\n` +
              `Wallet: ${data.result.walletType}`);
        searchTransaction();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao creditar saldo PIX');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchTransaction();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Correção de Transação</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">PIX Transaction ID:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pixId}
                onChange={(e) => setPixId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                placeholder="Digite o PIX ID"
              />
              <button
                onClick={searchTransaction}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded text-red-700">
              ❌ {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Resultado da Busca:</h3>
                <p>Transações encontradas: {result.foundTransactions}</p>
                <p>Transações recentes: {result.recentTransactions.count}</p>
              </div>

              {result.transactions.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Transação Encontrada:</h3>
                  {result.transactions.map((tx: any) => (
                    <div key={tx.id} className="border border-gray-200 rounded p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>ID:</strong> {tx.id}</p>
                          <p><strong>PIX ID:</strong> {tx.pixTransactionId}</p>
                          <p><strong>Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status}
                            </span>
                          </p>
                          <p><strong>Valor USDT:</strong> {tx.amount}</p>
                          <p><strong>Valor BRL:</strong> R$ {tx.brlAmount}</p>
                        </div>
                        <div>
                          <p><strong>Usuário:</strong> {tx.user.name}</p>
                          <p><strong>Email:</strong> {tx.user.email}</p>
                          <p><strong>Criado em:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
                          <p><strong>Saldo atual:</strong> {tx.currentWalletBalance} USDT</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        {tx.status !== 'COMPLETED' && (
                          <button
                            onClick={() => forceComplete(tx)}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            ✅ Forçar Completar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-yellow-200 bg-yellow-50 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-800">❌ Transação não encontrada</h3>
                  <p className="text-yellow-700 mb-4">A transação com PIX ID "{pixId}" não foi encontrada no banco.</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={createManual}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      🔧 Criar Transação Manual (USDT)
                    </button>
                    <button
                      onClick={creditPixBalance}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      💰 Creditar Saldo PIX (R$ 10,10)
                    </button>
                  </div>
                </div>
              )}

              {result.recentTransactions.count > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Transações Recentes (24h):</h3>
                  <div className="max-h-64 overflow-y-auto">
                    {result.recentTransactions.transactions.map((tx: any) => (
                      <div key={tx.id} className="text-sm border-b py-2">
                        <p><strong>PIX:</strong> {tx.pixTransactionId} | <strong>Status:</strong> {tx.status} | <strong>R$:</strong> {tx.brlAmount} | <strong>USDT:</strong> {tx.amount}</p>
                        <p className="text-gray-600">{tx.user} - {new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}