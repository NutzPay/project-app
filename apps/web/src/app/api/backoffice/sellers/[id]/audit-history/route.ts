import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { auditService } from '@/lib/audit/audit-service';
import { AuditAction } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação do admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado. Apenas administradores podem ver histórico de auditoria.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const sellerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar logs de auditoria relacionados ao seller (tanto taxas quanto perfil)
    const auditData = await auditService.getLogs({
      resourceId: sellerId,
      // Buscar todos os logs do seller (não filtrar por action específica)
      limit,
      offset,
    });

    // Formatar logs para o frontend
    const formattedLogs = auditData.logs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      adminUser: log.user ? {
        id: log.user.id,
        email: log.user.email,
        name: log.user.name,
      } : null,
      changes: log.details?.changes || [],
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.ipAddress,
      success: log.success,
    }));

    return NextResponse.json({
      success: true,
      history: formattedLogs,
      pagination: {
        total: auditData.total,
        limit,
        offset,
        hasMore: auditData.hasMore,
      }
    });

  } catch (error) {
    console.error('❌ Error fetching seller audit history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor ao carregar histórico',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}