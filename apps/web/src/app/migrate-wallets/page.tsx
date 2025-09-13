'use client';

import { useState } from 'react';

export default function MigrateWalletsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate-wallets');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async () => {
    if (!confirm('Executar migração de carteiras? Esta ação criará PIX e Investment wallets para todos os usuários.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/migrate-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      // Atualizar status após migração
      if (data.success) {
        await checkStatus();
      }
    } catch (error) {
      console.error('Erro na migração:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            🔄 Migração de Carteiras para 3 Saldos Separados
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Status Current */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-blue-900">📊 Status Atual</h2>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={checkStatus}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Verificar Status'}
                </button>
              </div>
              
              {status && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <h3 className="font-medium text-gray-800">Estatísticas Gerais:</h3>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>• Total usuários: {status.stats?.totalUsers}</li>
                      <li>• Com USDT wallet: {status.stats?.usersWithUSDT}</li>
                      <li>• Com PIX wallet: {status.stats?.usersWithPIX}</li>
                      <li>• Com Investment wallet: {status.stats?.usersWithInvestment}</li>
                      <li>• <strong>Precisam migração: {status.stats?.needsMigration}</strong></li>
                    </ul>
                  </div>
                  
                  {status.felixStatus && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                      <h3 className="font-medium text-green-800">👤 felixelmada@gmail.com:</h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• USDT Wallet: {status.felixStatus.hasUSDTWallet ? `✅ ${status.felixStatus.wallets.usdt} USDT` : '❌ Não existe'}</li>
                        <li>• PIX Wallet: {status.felixStatus.hasPIXWallet ? `✅ R$ ${status.felixStatus.wallets.pix}` : '❌ Não existe'}</li>
                        <li>• Investment Wallet: {status.felixStatus.hasInvestmentWallet ? `✅ ${status.felixStatus.wallets.investment} investido` : '❌ Não existe'}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Migration Action */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-orange-900">⚡ Executar Migração</h2>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  Esta migração irá:
                </p>
                <ul className="text-sm space-y-1 text-gray-600 mb-4">
                  <li>✅ Criar <strong>PIX Wallet</strong> para usuários que não têm</li>
                  <li>✅ Criar <strong>Investment Wallet</strong> para usuários que não têm</li>
                  <li>✅ Migrar dados de investimentos existentes</li>
                  <li>✅ Manter USDT Wallets existentes intactos</li>
                  <li>⚠️ <strong>Operação segura</strong> - não deleta dados</li>
                </ul>
              </div>
              
              <button
                onClick={executeMigration}
                disabled={loading}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
              >
                {loading ? '🔄 Executando Migração...' : '🚀 Executar Migração Agora'}
              </button>
            </div>
          </div>
          
          {/* Results */}
          {result && (
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                {result.success ? '✅ Migração Concluída' : '❌ Erro na Migração'}
              </h2>
              
              {result.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.results.processedUsers}</div>
                      <div className="text-sm text-gray-600">Usuários Processados</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-green-600">{result.results.migratedUsers}</div>
                      <div className="text-sm text-gray-600">Usuários Migrados</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-purple-600">{result.results.pixWalletsCreated}</div>
                      <div className="text-sm text-gray-600">PIX Wallets Criados</div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-2xl font-bold text-indigo-600">{result.results.investmentWalletsCreated}</div>
                      <div className="text-sm text-gray-600">Investment Wallets Criados</div>
                    </div>
                  </div>
                  
                  {result.results.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                      <h3 className="font-medium text-red-800 mb-2">Erros encontrados:</h3>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.results.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.felixStatus && result.felixStatus.exists && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <h3 className="font-medium text-green-800 mb-2">✅ felixelmada@gmail.com - Status Pós-Migração:</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>USDT:</strong><br/>
                          {result.felixStatus.wallets.usdt ? `${result.felixStatus.wallets.usdt} USDT` : 'N/A'}
                        </div>
                        <div>
                          <strong>PIX:</strong><br/>
                          R$ {result.felixStatus.wallets.pix || '0.00'}
                        </div>
                        <div>
                          <strong>Investment:</strong><br/>
                          {result.felixStatus.wallets.investment || '0'} investido
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  <p><strong>Erro:</strong> {result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}