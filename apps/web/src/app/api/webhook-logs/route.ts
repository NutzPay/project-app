import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const pixId = searchParams.get('pixId');
    
    // Data de início (últimas X horas)
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    console.log(`🔍 Checking webhook logs since: ${startTime.toISOString()}`);
    console.log(`🎯 Looking for PIX ID: ${pixId || 'any'}`);
    
    // Buscar logs de auditoria relacionados a webhooks
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startTime
        },
        OR: [
          { resource: { contains: 'webhook' } },
          { resource: { contains: 'xgate' } },
          { details: { contains: 'webhook' } },
          { details: { contains: 'xgate' } },
          { details: { contains: 'PAID' } },
          { details: { contains: 'payment' } },
          ...(pixId ? [
            { details: { contains: pixId } },
            { resourceId: pixId }
          ] : [])
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Buscar transações recentes relacionadas
    const recentTransactions = await prisma.uSDTTransaction.findMany({
      where: {
        createdAt: {
          gte: startTime
        },
        ...(pixId ? {
          OR: [
            { pixTransactionId: pixId },
            { externalId: pixId },
            { id: pixId }
          ]
        } : {})
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Buscar logs de request (se existir a tabela)
    let requestLogs = [];
    try {
      requestLogs = await prisma.requestLog.findMany({
        where: {
          createdAt: {
            gte: startTime
          },
          OR: [
            { path: { contains: 'webhook' } },
            { path: { contains: 'xgate' } }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 30
      });
    } catch (error) {
      console.log('RequestLog table not available or accessible');
    }

    // Simular verificação de logs do sistema (console.log)
    // Em produção, isso viria de um serviço de logging como CloudWatch, etc.
    
    const mockSystemLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: '🔍 Webhook logs check requested',
        source: 'webhook-logs-api'
      }
    ];

    return NextResponse.json({
      success: true,
      timeRange: {
        from: startTime.toISOString(),
        to: new Date().toISOString(),
        hours: hours
      },
      searchCriteria: {
        pixId: pixId || 'any',
        lookingFor: ['webhook', 'xgate', 'PAID', 'payment']
      },
      results: {
        auditLogs: {
          count: auditLogs.length,
          logs: auditLogs.map(log => ({
            id: log.id,
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId,
            details: log.details,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
            userId: log.userId
          }))
        },
        recentTransactions: {
          count: recentTransactions.length,
          transactions: recentTransactions.map(tx => ({
            id: tx.id,
            pixTransactionId: tx.pixTransactionId,
            externalId: tx.externalId,
            type: tx.type,
            status: tx.status,
            amount: Number(tx.amount),
            brlAmount: Number(tx.brlAmount || 0),
            description: tx.description,
            createdAt: tx.createdAt,
            processedAt: tx.processedAt,
            user: {
              name: tx.wallet.user.name,
              email: tx.wallet.user.email
            }
          }))
        },
        requestLogs: {
          count: requestLogs.length,
          logs: requestLogs.map(log => ({
            id: log.id,
            method: log.method,
            path: log.path,
            statusCode: log.statusCode,
            responseTime: log.responseTime,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          }))
        },
        systemLogs: mockSystemLogs
      },
      analysis: {
        webhookCallsFound: requestLogs.filter(log => log.path?.includes('webhook')).length,
        xgateCallsFound: requestLogs.filter(log => log.path?.includes('xgate')).length,
        paidTransactionsFound: recentTransactions.filter(tx => tx.status === 'COMPLETED').length,
        pendingTransactionsFound: recentTransactions.filter(tx => tx.status === 'PENDING').length,
        suspiciousActivity: auditLogs.filter(log => 
          log.details?.includes('ERROR') || log.details?.includes('FAIL')
        ).length
      }
    });

  } catch (error) {
    console.error('❌ Error checking webhook logs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error checking logs',
      timestamp: new Date().toISOString()
    });
  }
}