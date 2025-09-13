import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const stats = {
      total: 24,
      active: 21,
      expiring: 2,
      revoked: 1
    };

    const apiKeys = [
      {
        id: 'key-001',
        name: 'Webhook Principal',
        description: 'Chave para recebimento de webhooks do Stark Bank',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
        lastUsed: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        permissions: ['webhooks:read', 'transactions:read']
      },
      {
        id: 'key-002',
        name: 'API Interna',
        description: 'Chave para comunicação entre serviços internos',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        permissions: ['users:read', 'transactions:write', 'webhooks:write']
      },
      {
        id: 'key-003',
        name: 'Monitoramento',
        description: 'Chave para sistema de monitoramento e alertas',
        status: 'expiring',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        permissions: ['stats:read', 'logs:read']
      }
    ];

    return NextResponse.json({
      success: true,
      stats,
      apiKeys
    });

  } catch (error) {
    console.error('❌ Error loading API keys:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}