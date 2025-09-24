import { NextRequest, NextResponse } from 'next/server';
import { conflictDetector } from '@/lib/rbac/conflict-detector';
import { UserRole } from '@/types/rbac';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do admin
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Mock admin user - em produção viria do token JWT
    const adminUser = {
      id: 'admin-1',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    // Verificar se tem permissão para ver relatórios
    if (!adminUser.isAdmin || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Permission denied', code: 'NO_REPORTS_PERMISSION' },
        { status: 403 }
      );
    }

    // Gerar relatório de conflitos
    const { conflictCount, reportPath, conflicts } = await conflictDetector.runConflictCheck();

    if (conflictCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No conflicting users found',
        conflictCount: 0,
        conflicts: [],
        reportGenerated: false,
      });
    }

    // Buscar conteúdo do relatório
    const csvContent = await conflictDetector.generateConflictReport();
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="usuarios_conflitantes_${new Date().toISOString().split('T')[0]}.csv"`,
        'X-Conflict-Count': conflictCount.toString(),
      },
    });
  } catch (error) {
    console.error('Conflicting users report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate conflicting users report', code: 'REPORT_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do admin
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const adminUser = {
      id: 'admin-1',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    if (!adminUser.isAdmin || adminUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Permission denied - Super Admin required', code: 'SUPER_ADMIN_REQUIRED' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, resolution } = body;

    if (!userId || !resolution) {
      return NextResponse.json(
        { error: 'User ID and resolution are required', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    if (!['make_admin', 'make_seller', 'suspend'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type', code: 'INVALID_RESOLUTION' },
        { status: 400 }
      );
    }

    // Resolver conflito
    await conflictDetector.resolveUserConflict(userId, resolution);

    return NextResponse.json({
      success: true,
      message: `User conflict resolved with resolution: ${resolution}`,
      userId,
      resolution,
      resolvedBy: adminUser.id,
      resolvedAt: new Date(),
    });
  } catch (error) {
    console.error('Resolve user conflict error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve user conflict', code: 'RESOLVE_ERROR' },
      { status: 500 }
    );
  }
}