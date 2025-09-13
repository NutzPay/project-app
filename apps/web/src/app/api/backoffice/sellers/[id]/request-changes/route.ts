import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { auditService } from '@/lib/rbac/audit';
import { randomUUID } from 'crypto';

interface RequestChangesRequest {
  requiredChanges: string[];
  reasonText: string;
  idempotencyKey: string;
}

interface RequestChangesResponse {
  sellerId: string;
  oldStatus: string;
  newStatus: string;
  auditId: string;
  updatedAt: string;
  message: string;
}

// Tipos de ajustes comuns que podem ser solicitados
const COMMON_CHANGE_TYPES = [
  'Atualizar documentos de identidade',
  'Corrigir informações da empresa',
  'Completar dados bancários',
  'Verificar endereço comercial',
  'Ajustar informações de contato',
  'Corrigir dados do CNPJ',
  'Atualizar contratos sociais',
  'Verificar licenças e alvarás',
  'Completar informações fiscais',
  'Outros ajustes necessários'
];

// Mock data para desenvolvimento
const mockSellers: Record<string, any> = {
  'seller-003': {
    id: 'seller-003',
    name: 'Carlos Eduardo Oliveira',
    email: 'carlos.oliveira@startup123.com',
    status: 'PENDING',
    updatedAt: '2024-08-20T16:45:00Z',
    version: 1,
  },
  'seller-004': {
    id: 'seller-004', 
    name: 'Patricia Lima Santos',
    email: 'patricia@newcompany.com',
    status: 'PENDING',
    updatedAt: '2024-08-23T10:30:00Z',
    version: 1,
  },
};

// Controle de idempotência
const processedRequests = new Map<string, RequestChangesResponse>();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const sellerId = params.id;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Verificar autenticação do admin
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Mock admin user
    const adminUser = {
      id: 'admin-1',
      email: 'admin@nutz.com',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    // Verificar permissões
    if (!adminUser.isAdmin || 
        ![UserRole.SUPER_ADMIN, UserRole.OPERATIONS].includes(adminUser.role)) {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: adminUser.id,
        details: {
          action: 'REQUEST_SELLER_CHANGES',
          sellerId,
          reason: 'Insufficient permissions for requesting changes',
          role: adminUser.role
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Permission denied - Only Super Admin and Operations can request changes', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    const body: RequestChangesRequest = await request.json();
    const { requiredChanges, reasonText, idempotencyKey } = body;

    // Validações
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'Idempotency-Key is required', code: 'MISSING_IDEMPOTENCY_KEY' },
        { status: 400 }
      );
    }

    if (!requiredChanges || !Array.isArray(requiredChanges) || requiredChanges.length === 0) {
      return NextResponse.json(
        { error: 'At least one required change must be specified', code: 'MISSING_REQUIRED_CHANGES' },
        { status: 400 }
      );
    }

    if (!reasonText || reasonText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason text must be at least 10 characters', code: 'REASON_TEXT_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Validar se todas as mudanças são válidas
    const invalidChanges = requiredChanges.filter(change => 
      typeof change !== 'string' || change.trim().length < 5
    );
    
    if (invalidChanges.length > 0) {
      return NextResponse.json(
        { error: 'All required changes must be valid strings with at least 5 characters', code: 'INVALID_REQUIRED_CHANGES' },
        { status: 400 }
      );
    }

    // Verificar idempotência
    if (processedRequests.has(idempotencyKey)) {
      const cachedResponse = processedRequests.get(idempotencyKey)!;
      console.log(`[REQUEST-CHANGES] Returning cached response for idempotency key: ${idempotencyKey}`);
      return NextResponse.json(cachedResponse);
    }

    const seller = mockSellers[sellerId];
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found', code: 'SELLER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verificar se seller está pendente
    if (seller.status !== 'PENDING') {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: adminUser.id,
        details: {
          action: 'REQUEST_SELLER_CHANGES',
          sellerId,
          reason: `Seller status is ${seller.status}, expected PENDING`,
          currentStatus: seller.status
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { 
          error: `Cannot request changes for seller with status ${seller.status}. Only PENDING sellers can have changes requested.`, 
          code: 'INVALID_STATUS_FOR_CHANGES' 
        },
        { status: 422 }
      );
    }

    // Simular controle de concorrência
    const requestTime = new Date();
    const sellerUpdatedAt = new Date(seller.updatedAt);
    
    if (requestTime.getTime() - sellerUpdatedAt.getTime() < 1000 && seller.version > 1) {
      return NextResponse.json(
        { error: 'Seller was recently modified by another operation. Please refresh and try again.', code: 'CONCURRENT_MODIFICATION' },
        { status: 409 }
      );
    }

    // Executar solicitação de mudanças
    const auditId = randomUUID();
    const oldStatus = seller.status;
    const newStatus = 'NEEDS_INFO';
    const updatedAt = new Date().toISOString();

    // Atualizar seller
    seller.status = newStatus;
    seller.updatedAt = updatedAt;
    seller.reviewedBy = adminUser.id;
    seller.reviewedAt = updatedAt;
    seller.requiredChanges = {
      changes: requiredChanges.map(change => change.trim()),
      reasonText: reasonText.trim(),
      requestedBy: adminUser.id,
      requestedAt: updatedAt,
      resolved: false
    };
    seller.version += 1;

    // Log de auditoria
    await auditService.logEvent({
      eventType: 'ACCESS_DENIED', // Será SELLER_CHANGES_REQUESTED em produção
      userId: adminUser.id,
      details: {
        action: 'REQUEST_SELLER_CHANGES',
        sellerId,
        sellerEmail: seller.email,
        sellerName: seller.name,
        fromStatus: oldStatus,
        toStatus: newStatus,
        requiredChanges: requiredChanges.map(change => change.trim()),
        reasonText: reasonText.trim(),
        auditId,
        reviewedBy: adminUser.email,
        changesCount: requiredChanges.length,
      },
      ipAddress: ip,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[REQUEST-CHANGES] Requested ${requiredChanges.length} changes for seller ${sellerId} in ${responseTime}ms. Audit ID: ${auditId}`);

    const response: RequestChangesResponse = {
      sellerId,
      oldStatus,
      newStatus,
      auditId,
      updatedAt,
      message: `Successfully requested ${requiredChanges.length} changes for seller`,
    };

    // Cache response para idempotência
    processedRequests.set(idempotencyKey, response);
    
    // Limpar cache após 5 minutos
    setTimeout(() => {
      processedRequests.delete(idempotencyKey);
    }, 5 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[REQUEST-CHANGES] Error requesting changes for seller ${sellerId} after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to request changes', code: 'REQUEST_CHANGES_ERROR' },
      { status: 500 }
    );
  }
}

// Endpoint para obter tipos comuns de mudanças
export async function GET() {
  return NextResponse.json({
    commonChangeTypes: COMMON_CHANGE_TYPES
  });
}