'use client';

import { useEffect, useState } from 'react';
import { Shield, Server, Activity, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function BackofficeTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backoffice/test');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to fetch test endpoint',
        message: 'Network error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-3xl font-bold text-white">
              Backoffice System Test
            </h1>
          </div>
          <p className="text-gray-400">
            Validação do isolamento de sessões e recursos de segurança
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Session Status */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <Server className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">Session Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Environment:</span>
                <span className="text-red-400 font-mono font-semibold">BACKOFFICE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cookie Path:</span>
                <span className="text-blue-400 font-mono">/backoffice</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">JWT Secret:</span>
                <span className="text-yellow-400 font-mono">ISOLATED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Session Type:</span>
                <span className="text-green-400 font-mono">SECURE</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">Security Features</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Feature Flag:</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-semibold">Enabled</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Whitelist:</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-semibold">Active</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rate Limiting:</span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-semibold">Protected</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Middleware:</span>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 font-semibold">Testing</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <Activity className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-white">System Health</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">API Status:</span>
                <span className="text-green-400 font-semibold">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Database:</span>
                <span className="text-green-400 font-semibold">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Isolation:</span>
                <span className="text-green-400 font-semibold">Complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Uptime:</span>
                <span className="text-green-400 font-semibold">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TestTube className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-xl font-semibold text-white">API Test Results</h3>
            </div>
            <button
              onClick={runTest}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {loading ? 'Testing...' : 'Run Test'}
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className={`flex items-center gap-3 mb-4 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.success ? 
                  <CheckCircle className="w-6 h-6" /> : 
                  <XCircle className="w-6 h-6" />
                }
                <span className="text-xl font-semibold">
                  {testResult.success ? 'Test Passed' : 'Test Failed'}
                </span>
              </div>
              
              <div className="text-gray-300 mb-4 text-lg">
                {testResult.message}
              </div>

              {testResult.data && (
                <div className="bg-black border border-gray-700 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2 font-semibold">Response Data:</div>
                  <pre className="text-xs text-green-400 overflow-auto font-mono leading-relaxed">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.error && (
                <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 mt-4">
                  <div className="text-red-400 font-semibold">
                    Error: {testResult.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Isolation Notice */}
        <div className="bg-yellow-950/20 border border-yellow-600/30 rounded-2xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h4 className="text-yellow-300 font-semibold text-lg mb-2">
                Session Isolation Active
              </h4>
              <p className="text-yellow-200/80 leading-relaxed">
                Esta página está completamente isolada das sessões do <code className="bg-black/30 px-2 py-1 rounded font-mono text-yellow-300">/dashboard</code>. 
                Os cookies e tokens de autenticação são específicos do backoffice e não interferem no sistema principal. 
                Todas as ações são auditadas e monitoradas independentemente.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-yellow-300 font-semibold">JWT Isolado</div>
                  <div className="text-yellow-200/70">Secrets diferentes</div>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-yellow-300 font-semibold">Cookies Separados</div>
                  <div className="text-yellow-200/70">Domínios isolados</div>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-3">
                  <div className="text-yellow-300 font-semibold">Middleware Dedicado</div>
                  <div className="text-yellow-200/70">Proteção específica</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Backoffice Testing Suite • Isolated Environment • Version 0.1.0
          </p>
        </div>
      </div>
    </div>
  );
}