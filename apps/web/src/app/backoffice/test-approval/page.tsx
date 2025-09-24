'use client';

import { useState } from 'react';

interface TestResult {
  endpoint: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

export default function TestApprovalPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (endpoint: string, method: string = 'POST', body?: any): Promise<TestResult> => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });

      const data = await response.json();
      
      return {
        endpoint: `${method} ${endpoint}`,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.error : undefined,
      };
    } catch (error) {
      return {
        endpoint: `${method} ${endpoint}`,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    const tests: Array<() => Promise<TestResult>> = [
      // Test GET reason codes
      () => testEndpoint('/api/backoffice/sellers/seller-003/reject', 'GET'),
      
      // Test GET common change types  
      () => testEndpoint('/api/backoffice/sellers/seller-003/request-changes', 'GET'),
      
      // Test approval with valid data
      () => testEndpoint('/api/backoffice/sellers/seller-003/approve', 'POST', {
        note: 'Test approval',
        idempotencyKey: 'test-approval-' + Date.now(),
      }),
      
      // Test approval with missing idempotency key (should fail)
      () => testEndpoint('/api/backoffice/sellers/seller-003/approve', 'POST', {
        note: 'Test approval without key',
      }),
      
      // Test rejection with valid data
      () => testEndpoint('/api/backoffice/sellers/seller-004/reject', 'POST', {
        reasonCode: 'INVALID_DOCUMENTS',
        reasonText: 'Test rejection with invalid documents provided by the seller',
        idempotencyKey: 'test-rejection-' + Date.now(),
      }),
      
      // Test rejection with invalid reason code (should fail)
      () => testEndpoint('/api/backoffice/sellers/seller-004/reject', 'POST', {
        reasonCode: 'INVALID_CODE',
        reasonText: 'Test rejection with invalid code',
        idempotencyKey: 'test-rejection-invalid-' + Date.now(),
      }),
      
      // Test request changes with valid data
      () => testEndpoint('/api/backoffice/sellers/seller-003/request-changes', 'POST', {
        requiredChanges: ['Atualizar documentos de identidade', 'Corrigir informações da empresa'],
        reasonText: 'Please update your identification documents and company information as they contain errors',
        idempotencyKey: 'test-changes-' + Date.now(),
      }),
      
      // Test request changes with empty changes array (should fail)
      () => testEndpoint('/api/backoffice/sellers/seller-003/request-changes', 'POST', {
        requiredChanges: [],
        reasonText: 'Test with empty changes',
        idempotencyKey: 'test-changes-empty-' + Date.now(),
      }),
    ];

    const testResults: TestResult[] = [];
    
    for (const test of tests) {
      const result = await test();
      testResults.push(result);
      setResults([...testResults]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    setTesting(false);
  };

  const getStatusColor = (result: TestResult) => {
    if (result.status === 0) return 'text-gray-500';
    if (result.success) return 'text-green-600';
    if (result.status >= 400 && result.status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBadge = (result: TestResult) => {
    if (result.status === 0) return 'bg-gray-100 text-gray-800';
    if (result.success) return 'bg-green-100 text-green-800';
    if (result.status >= 400 && result.status < 500) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Teste de APIs de Aprovação
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Validação das funcionalidades de aprovação, rejeição e solicitação de ajustes
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={testing}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {testing ? 'Executando Testes...' : 'Executar Todos os Testes'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resultados dos Testes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {results.filter(r => r.success).length}/{results.length} testes passaram
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {result.endpoint}
                      </code>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(result)}`}>
                        {result.status || 'ERROR'}
                      </span>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        <strong>Erro:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.data && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Ver resposta
                          </summary>
                          <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <div className={`ml-4 ${getStatusColor(result)}`}>
                    {result.success ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testing && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-md">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800 dark:text-blue-200">Executando testes...</span>
          </div>
        </div>
      )}
    </div>
  );
}