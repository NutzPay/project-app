import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { auditService } from '@/lib/rbac/audit';
import { randomUUID } from 'crypto';

interface RejectionRequest {
  reasonCode: string;
  reasonText: string;
  idempotencyKey: string;
}

interface RejectionResponse {
  sellerId: string;
  oldStatus: string;
  newStatus: string;
  auditId: string;
  updatedAt: string;
  message: string;
}

// Códigos de motivo para reprovação
const REJECTION_REASON_CODES = {
  'INVALID_DOCUMENTS': 'Documentos inválidos ou incompletos',
  'SUSPICIOUS_ACTIVITY': 'Atividade suspeita detectada',
  'INCOMPLETE_PROFILE': 'Perfil incompleto',
  'REGULATORY_COMPLIANCE': 'Não atende requisitos regulatórios',
  'DUPLICATE_ACCOUNT': 'Conta duplicada',
  'BUSINESS_POLICY': 'Não atende políticas de negócio',
  'OTHER': 'Outros motivos'
};

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
const processedRequests = new Map<string, RejectionResponse>();

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
          action: 'REJECT_SELLER',
          sellerId,
          reason: 'Insufficient permissions for rejection',
          role: adminUser.role
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Permission denied - Only Super Admin and Operations can reject sellers', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    const body: RejectionRequest = await request.json();
    const { reasonCode, reasonText, idempotencyKey } = body;

    // Validações
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'Idempotency-Key is required', code: 'MISSING_IDEMPOTENCY_KEY' },
        { status: 400 }
      );
    }

    if (!reasonCode || !reasonText) {
      return NextResponse.json(
        { error: 'Both reasonCode and reasonText are required for rejection', code: 'MISSING_REJECTION_REASON' },
        { status: 400 }
      );
    }

    if (!REJECTION_REASON_CODES[reasonCode as keyof typeof REJECTION_REASON_CODES]) {
      return NextResponse.json(
        { error: 'Invalid reason code', code: 'INVALID_REASON_CODE', availableCodes: Object.keys(REJECTION_REASON_CODES) },
        { status: 400 }
      );
    }

    if (reasonText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason text must be at least 10 characters', code: 'REASON_TEXT_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Verificar idempotência
    if (processedRequests.has(idempotencyKey)) {
      const cachedResponse = processedRequests.get(idempotencyKey)!;
      console.log(`[REJECT-SELLER] Returning cached response for idempotency key: ${idempotencyKey}`);
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
          action: 'REJECT_SELLER',
          sellerId,
          reason: `Seller status is ${seller.status}, expected PENDING`,
          currentStatus: seller.status
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { 
          error: `Cannot reject seller with status ${seller.status}. Only PENDING sellers can be rejected.`, 
          code: 'INVALID_STATUS_FOR_REJECTION' 
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

    // Executar reprovação
    const auditId = randomUUID();
    const oldStatus = seller.status;
    const newStatus = 'REJECTED';
    const updatedAt = new Date().toISOString();

    // Atualizar seller
    seller.status = newStatus;
    seller.updatedAt = updatedAt;
    seller.reviewedBy = adminUser.id;
    seller.reviewedAt = updatedAt;
    seller.rejectionReason = {
      code: reasonCode,
      text: reasonText,
      reviewedBy: adminUser.id,
      reviewedAt: updatedAt
    };
    seller.version += 1;

    // Log de auditoria
    await auditService.logEvent({
      eventType: 'ACCESS_DENIED', // Será SELLER_REJECTED em produção
      userId: adminUser.id,
      details: {
        action: 'REJECT_SELLER',
        sellerId,
        sellerEmail: seller.email,
        sellerName: seller.name,
        fromStatus: oldStatus,
        toStatus: newStatus,
        reasonCode,
        reasonCodeDescription: REJECTION_REASON_CODES[reasonCode as keyof typeof REJECTION_REASON_CODES],
        reasonText: reasonText.trim(),
        auditId,
        reviewedBy: adminUser.email,
      },
      ipAddress: ip,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[REJECT-SELLER] Rejected seller ${sellerId} in ${responseTime}ms. Reason: ${reasonCode}. Audit ID: ${auditId}`);

    const response: RejectionResponse = {
      sellerId,
      oldStatus,
      newStatus,
      auditId,
      updatedAt,
      message: 'Seller rejected successfully',
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
    console.error(`[REJECT-SELLER] Error rejecting seller ${sellerId} after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to reject seller', code: 'REJECTION_ERROR' },
      { status: 500 }
    );
  }
}

// Endpoint para obter códigos de motivo disponíveis
export async function GET() {
  return NextResponse.json({
    reasonCodes: Object.entries(REJECTION_REASON_CODES).map(([code, description]) => ({
      code,
      description
    }))
  });
}