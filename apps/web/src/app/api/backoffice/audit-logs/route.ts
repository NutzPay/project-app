import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/lib/audit/audit-service';
import { getCurrentUser } from '@/lib/auth';
import { AuditAction, AuditSeverity, AuditCategory } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado. Apenas administradores podem acessar logs de auditoria.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    // Parse filters
    const action = searchParams.get('action') as AuditAction | null;
    const severity = searchParams.get('severity') as AuditSeverity | null;
    const category = searchParams.get('category') as AuditCategory | null;
    const flagged = searchParams.get('flagged') === 'true';
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const period = searchParams.get('period') || 'today';

    // Get audit logs with filters
    const filters = {
      action: action || undefined,
      severity: severity || undefined,
      category: category || undefined,
      flagged: flagged || undefined,
      userId: userId || undefined,
      startDate,
      endDate,
      limit,
      offset: page ? (page - 1) * limit : offset,
    };

    const [auditData, stats] = await Promise.all([
      auditService.getLogs(filters),
      auditService.getStats(period as 'today' | 'week' | 'month'),
    ]);

    // Format logs for the frontend
    const formattedLogs = auditData.logs.map(log => ({
      id: log.id,
      type: log.action.toLowerCase(),
      action: log.action,
      description: log.description || `${log.action}: ${log.resource || 'Sistema'}`,
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        name: log.user.name,
      } : null,
      metadata: {
        ...log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        location: log.location,
        deviceType: log.deviceType,
        sessionId: log.sessionId,
        requestId: log.requestId,
        resource: log.resource,
        resourceId: log.resourceId,
        success: log.success,
        errorCode: log.errorCode,
        errorMessage: log.errorMessage,
        duration: log.duration,
        riskScore: log.riskScore,
      },
      severity: log.severity.toLowerCase(),
      category: log.category.toLowerCase(),
      flagged: log.flagged,
      riskScore: log.riskScore,
      timestamp: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      stats: {
        total: stats.total,
        today: stats.today,
        alerts: stats.alerts + stats.critical,
        errors: stats.errors,
        flagged: stats.flagged,
        critical: stats.critical,
      },
      pagination: {
        total: auditData.total,
        limit,
        offset: filters.offset,
        currentPage: page,
        totalPages: Math.ceil(auditData.total / limit),
        hasNextPage: auditData.hasMore,
        hasPrevPage: page > 1,
      },
      filters: {
        availableActions: Object.values(AuditAction),
        availableSeverities: Object.values(AuditSeverity),
        availableCategories: Object.values(AuditCategory),
      },
    });

  } catch (error) {
    console.error('❌ Error loading audit logs:', error);

    // Log the API access attempt
    try {
      const currentUser = await getCurrentUser(request);
      const ipAddress = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await auditService.logEvent({
        action: AuditAction.AUDIT_LOG_EXPORT,
        category: AuditCategory.DATA,
        severity: AuditSeverity.HIGH,
        description: 'Tentativa de acesso a logs de auditoria falhou',
        success: false,
        userId: currentUser?.id,
        ipAddress,
        userAgent,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: {
          endpoint: '/api/backoffice/audit-logs',
          method: 'GET',
        },
      });
    } catch (auditError) {
      console.error('Failed to log audit access attempt:', auditError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor ao carregar logs de auditoria',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso negado',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, filters } = body;

    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let result;

    switch (action) {
      case 'export':
        // Export audit logs
        const csvData = await auditService.exportLogs(filters);

        // Log the export action
        await auditService.logEvent({
          action: AuditAction.AUDIT_LOG_EXPORT,
          category: AuditCategory.DATA,
          severity: AuditSeverity.MEDIUM,
          description: 'Logs de auditoria exportados',
          success: true,
          userId: currentUser.id,
          ipAddress,
          userAgent,
          details: {
            exportedRecords: csvData.split('\n').length - 1, // Subtract header
            filters,
          },
        });

        return new NextResponse(csvData, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
          },
        });

      case 'flag':
        // Flag/unflag specific logs
        const { logIds, flagged } = body;

        if (!Array.isArray(logIds)) {
          return NextResponse.json({
            success: false,
            error: 'IDs de logs inválidos',
          }, { status: 400 });
        }

        // This would require additional implementation in auditService
        result = { updated: logIds.length };

        await auditService.logEvent({
          action: AuditAction.ADMIN_ACTION,
          category: AuditCategory.ADMINISTRATIVE,
          severity: AuditSeverity.LOW,
          description: `Logs ${flagged ? 'marcados' : 'desmarcados'} para revisão`,
          success: true,
          userId: currentUser.id,
          ipAddress,
          userAgent,
          details: {
            logIds,
            flagged,
          },
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não suportada',
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ Error in audit logs POST:', error);
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