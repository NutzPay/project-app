'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

interface CodeExample {
  language: string;
  label: string;
  code: string;
}

interface Section {
  id: string;
  title: string;
  content: JSX.Element;
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const codeExamples: Record<string, CodeExample[]> = {
    auth: [
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `// Authenticate with API key
const response = await fetch('https://api.nutzpay.com/transactions', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.nutzpay.com/transactions',
    headers=headers
)

data = response.json()
print(data)`
      }
    ],
    payment: [
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `// Create a PIX payment
const payment = await fetch('https://api.nutzpay.com/payments/pix', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 100.00,
    description: 'Payment for service',
    pixKey: 'customer@email.com'
  })
});

const result = await payment.json();
console.log(result);`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import requests

payment_data = {
    'amount': 100.00,
    'description': 'Payment for service',
    'pixKey': 'customer@email.com'
}

response = requests.post(
    'https://api.nutzpay.com/payments/pix',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json=payment_data
)

result = response.json()
print(result)`
      }
    ],
    webhooks: [
      {
        language: 'javascript',
        label: 'JavaScript',
        code: `// Webhook endpoint validation
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
}

// Express.js example
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-nutz-signature'];
  const isValid = validateWebhook(req.body, signature, process.env.WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  console.log('Payment status updated:', req.body);
  res.status(200).send('OK');
});`
      },
      {
        language: 'python',
        label: 'Python',
        code: `import hashlib
import hmac
from flask import Flask, request, jsonify

app = Flask(__name__)

def validate_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return expected_signature == signature

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Nutz-Signature')
    payload = request.get_data(as_text=True)

    if not validate_webhook(payload, signature, WEBHOOK_SECRET):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook
    data = request.get_json()
    print(f'Payment status updated: {data}')

    return jsonify({'status': 'ok'}), 200`
      }
    ]
  };

  const sections: Section[] = [
    {
      id: 'getting-started',
      title: 'Começando',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Bem-vindo à API NutzBeta</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Nossa API RESTful permite integrar pagamentos PIX e USDT de forma simples e segura em sua aplicação.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="font-medium text-black mb-2">Base URL</h4>
            <code className="text-red-600 bg-white px-3 py-2 rounded-lg border text-sm font-mono">
              https://api.nutzpay.com
            </code>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-4">Recursos Principais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h5 className="font-medium text-black">Pagamentos PIX</h5>
                </div>
                <p className="text-sm text-gray-600">Processe pagamentos instantâneos via PIX</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h5 className="font-medium text-black">USDT</h5>
                </div>
                <p className="text-sm text-gray-600">Transações com criptomoeda USDT</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h5 className="font-medium text-black">Webhooks</h5>
                </div>
                <p className="text-sm text-gray-600">Notificações em tempo real</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h5 className="font-medium text-black">Auditoria</h5>
                </div>
                <p className="text-sm text-gray-600">Logs detalhados de todas as operações</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-semibold text-black mb-4">Links Úteis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="http://localhost:3001/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-black">Swagger Docs</span>
                    <p className="text-sm text-gray-600">Documentação interativa completa</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href="http://localhost:3001/health"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-black">Health Check</span>
                    <p className="text-sm text-gray-600">Status e disponibilidade da API</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'authentication',
      title: 'Autenticação',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Autenticação via API Key</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Use sua API key no header Authorization com Bearer token para autenticar suas requisições.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-semibold text-black mb-4">Formato da API Key</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Teste:</span>
                <code className="text-green-600 bg-green-50 px-2 py-1 rounded text-sm font-mono">ntz_test_abc123...</code>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Produção:</span>
                <code className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm font-mono">ntz_live_xyz789...</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {codeExamples.auth.map((example, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <span className="text-sm font-medium text-black">{example.label}</span>
                  <button
                    onClick={() => copyToClipboard(example.code, `auth-${index}`)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    {copiedCode === `auth-${index}` ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-4 text-sm text-gray-800 overflow-x-auto font-mono">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-red-800 mb-1">Importante</h4>
                <p className="text-sm text-red-700">
                  Mantenha sua API key segura. Nunca a exponha em código client-side ou repositórios públicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payments',
      title: 'Pagamentos',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Criar Pagamento PIX</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Endpoint para criar pagamentos via PIX com processamento instantâneo.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium">POST</span>
              <code className="text-gray-800 font-mono">/payments/pix</code>
            </div>
            <p className="text-sm text-gray-600">Cria um novo pagamento PIX</p>
          </div>

          <div className="space-y-4">
            {codeExamples.payment.map((example, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <span className="text-sm font-medium text-black">{example.label}</span>
                  <button
                    onClick={() => copyToClipboard(example.code, `payment-${index}`)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    {copiedCode === `payment-${index}` ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-4 text-sm text-gray-800 overflow-x-auto font-mono">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">Configuração de Webhooks</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Receba notificações em tempo real sobre mudanças de status dos pagamentos.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-black mb-4">Headers do Webhook</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <code className="text-sm font-mono text-gray-700">Content-Type</code>
                <code className="text-sm font-mono text-red-600">application/json</code>
              </div>
              <div className="flex justify-between items-center">
                <code className="text-sm font-mono text-gray-700">X-Nutz-Signature</code>
                <code className="text-sm font-mono text-red-600">sha256=...</code>
              </div>
              <div className="flex justify-between items-center">
                <code className="text-sm font-mono text-gray-700">User-Agent</code>
                <code className="text-sm font-mono text-red-600">NutzBeta-Webhook/1.0</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {codeExamples.webhooks.map((example, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <span className="text-sm font-medium text-black">{example.label}</span>
                  <button
                    onClick={() => copyToClipboard(example.code, `webhook-${index}`)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    {copiedCode === `webhook-${index}` ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-4 text-sm text-gray-800 overflow-x-auto font-mono">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Dica</h4>
                <p className="text-sm text-blue-700">
                  Configure seus webhooks no <a href="/dashboard/webhooks" className="underline">painel de webhooks</a> para receber notificações automáticas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout userType="standard">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Documentação da API</h1>
              <p className="text-gray-600">Integre pagamentos PIX e USDT de forma simples e segura</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeTab === section.id
                      ? 'border-red-500 text-red-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-white/50'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {sections
              .filter(section => section.id === activeTab)
              .map(section => (
                <div key={section.id}>
                  {section.content}
                </div>
              ))
            }
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="text-center">
            <h3 className="font-semibold text-black mb-2">Precisa de ajuda?</h3>
            <p className="text-gray-600 mb-4">Entre em contato conosco ou configure seus webhooks</p>
            <div className="flex justify-center items-center space-x-6">
              <a
                href="mailto:suporte@nutzpay.com"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                suporte@nutzpay.com
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="/dashboard/webhooks"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Configurar Webhooks
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="/dashboard/api-keys"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Gerenciar API Keys
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}