import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserType } from '@/types/rbac';
import { hasBackofficeAccess, validateRoleConflict } from './permissions';
import { auditService } from './audit';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  userType: UserType;
  companyId?: string;
  isAdmin: boolean;
  isSeller: boolean;
}

export class RBACMiddleware {
  static async validateBackofficeAccess(
    request: NextRequest,
    user: AuthenticatedUser
  ): Promise<NextResponse | null> {
    const url = request.nextUrl.pathname;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verificar conflito de papéis
    const roleConflict = validateRoleConflict([user.role]);
    if (roleConflict.hasConflict) {
      await auditService.logEvent({
        eventType: 'ROLE_CONFLICT',
        userId: user.id,
        details: {
          role: user.role,
          conflictReason: roleConflict.conflictReason,
          attemptedUrl: url
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { 
          error: 'Role conflict detected',
          message: 'Your account has conflicting roles. Please contact system administrator.',
          code: 'ROLE_CONFLICT'
        },
        { status: 403 }
      );
    }

    // Verificar se é seller tentando acessar backoffice
    if (user.isSeller || !user.isAdmin) {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: user.id,
        details: {
          reason: 'Seller attempting backoffice access',
          role: user.role,
          userType: user.userType,
          attemptedUrl: url
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Sellers cannot access the backoffice system.',
          code: 'SELLER_ACCESS_DENIED'
        },
        { status: 403 }
      );
    }

    // Verificar permissão de acesso ao backoffice
    if (!hasBackofficeAccess(user.role)) {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: user.id,
        details: {
          reason: 'Insufficient role for backoffice',
          role: user.role,
          attemptedUrl: url
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Your role does not have access to the backoffice system.',
          code: 'INSUFFICIENT_ROLE'
        },
        { status: 403 }
      );
    }

    return null; // Access granted
  }

  static async validateAPIAccess(
    request: NextRequest,
    user: AuthenticatedUser,
    resource: string,
    action: string
  ): Promise<NextResponse | null> {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Primeiro validar acesso ao backoffice
    const backofficeCheck = await this.validateBackofficeAccess(request, user);
    if (backofficeCheck) {
      return backofficeCheck;
    }

    // Verificar permissão específica do recurso
    const { canAccess } = await import('./permissions');
    if (!canAccess(user.role, resource, action)) {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: user.id,
        details: {
          reason: 'Insufficient permission for resource/action',
          role: user.role,
          resource,
          action,
          attemptedUrl: request.nextUrl.pathname
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        {
          error: 'Permission denied',
          message: `Your role does not have permission to ${action} on ${resource}.`,
          code: 'INSUFFICIENT_PERMISSION'
        },
        { status: 403 }
      );
    }

    return null; // Access granted
  }

  static async logLoginBlocked(
    email: string,
    reason: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    await auditService.logEvent({
      eventType: 'LOGIN_BLOCKED',
      userId: 'unknown',
      details: {
        email,
        reason,
        blockType: 'ROLE_CONFLICT'
      },
      ipAddress: ip,
      userAgent,
    });
  }
}

export function requireBackofficeAuth() {
  return async (request: NextRequest) => {
    try {
      // Extrair token do cookie
      const token = request.cookies.get('backoffice-auth-token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      // Verificar e decodificar token
      const { verifyBackofficeToken } = await import('@/lib/backoffice/auth');
      const user = await verifyBackofficeToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid token', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      // Validar acesso ao backoffice
      return await RBACMiddleware.validateBackofficeAccess(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

export function requirePermission(resource: string, action: string) {
  return async (request: NextRequest) => {
    try {
      const token = request.cookies.get('backoffice-auth-token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      const { verifyBackofficeToken } = await import('@/lib/backoffice/auth');
      const user = await verifyBackofficeToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid token', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      return await RBACMiddleware.validateAPIAccess(request, user, resource, action);
    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.json(
        { error: 'Authorization failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}