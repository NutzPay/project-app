import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { auditService } from '@/lib/rbac/audit';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface ApprovalRequest {
  note?: string;
  exchangeRateFeePercent: number;
  exchangeRateFeeFixed: number;
  pixPayinFeePercent: number;
  pixPayinFeeFixed: number;
  pixPayoutFeePercent: number;
  pixPayoutFeeFixed: number;
  manualWithdrawFeePercent: number;
  manualWithdrawFeeFixed: number;
  usdtPurchaseFeePercent: number;
  usdtPurchaseFeeFixed: number;
  idempotencyKey: string;
}

interface ApprovalResponse {
  sellerId: string;
  oldStatus: string;
  newStatus: string;
  auditId: string;
  updatedAt: string;
  message: string;
}

// Mock data para desenvolvimento - em produção viria do banco
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
const processedRequests = new Map<string, ApprovalResponse>();

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

    // Mock admin user - em produção viria do token JWT
    const adminUser = {
      id: 'admin-1',
      email: 'admin@nutz.com',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    // Verificar permissões - apenas Super Admin e Operations podem aprovar
    if (!adminUser.isAdmin || 
        ![UserRole.SUPER_ADMIN, UserRole.OPERATIONS].includes(adminUser.role)) {
      await auditService.logEvent({
        eventType: 'ACCESS_DENIED',
        userId: adminUser.id,
        details: {
          action: 'APPROVE_SELLER',
          sellerId,
          reason: 'Insufficient permissions for approval',
          role: adminUser.role
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Permission denied - Only Super Admin and Operations can approve sellers', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    const body: ApprovalRequest = await request.json();
    const {
      note,
      exchangeRateFeePercent,
      exchangeRateFeeFixed,
      pixPayinFeePercent,
      pixPayinFeeFixed,
      pixPayoutFeePercent,
      pixPayoutFeeFixed,
      manualWithdrawFeePercent,
      manualWithdrawFeeFixed,
      usdtPurchaseFeePercent,
      usdtPurchaseFeeFixed,
      idempotencyKey
    } = body;

    // Validar taxas de câmbio
    if (exchangeRateFeePercent < 0 || exchangeRateFeePercent > 1) {
      return NextResponse.json(
        { error: 'Exchange rate percentage must be between 0% and 100%', code: 'INVALID_EXCHANGE_RATE_PERCENT' },
        { status: 400 }
      );
    }

    if (exchangeRateFeeFixed < 0) {
      return NextResponse.json(
        { error: 'Exchange rate fixed fee must be positive', code: 'INVALID_EXCHANGE_RATE_FIXED' },
        { status: 400 }
      );
    }

    // Validar taxas percentuais (devem estar entre 0 e 1)
    const percentageFields = [
      { name: 'pixPayinFeePercent', value: pixPayinFeePercent },
      { name: 'pixPayoutFeePercent', value: pixPayoutFeePercent },
      { name: 'manualWithdrawFeePercent', value: manualWithdrawFeePercent },
      { name: 'usdtPurchaseFeePercent', value: usdtPurchaseFeePercent }
    ];

    for (const field of percentageFields) {
      if (field.value < 0 || field.value > 1) {
        return NextResponse.json(
          { error: `Invalid ${field.name}. Must be between 0 and 1 (0% to 100%)`, code: 'INVALID_PERCENTAGE_FEE' },
          { status: 400 }
        );
      }
    }

    // Validar taxas fixas (devem ser positivas)
    const fixedFields = [
      { name: 'pixPayinFeeFixed', value: pixPayinFeeFixed },
      { name: 'pixPayoutFeeFixed', value: pixPayoutFeeFixed },
      { name: 'manualWithdrawFeeFixed', value: manualWithdrawFeeFixed },
      { name: 'usdtPurchaseFeeFixed', value: usdtPurchaseFeeFixed }
    ];

    for (const field of fixedFields) {
      if (field.value < 0) {
        return NextResponse.json(
          { error: `Invalid ${field.name}. Must be positive`, code: 'INVALID_FIXED_FEE' },
          { status: 400 }
        );
      }
    }

    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'Idempotency-Key is required', code: 'MISSING_IDEMPOTENCY_KEY' },
        { status: 400 }
      );
    }

    // Verificar idempotência
    if (processedRequests.has(idempotencyKey)) {
      const cachedResponse = processedRequests.get(idempotencyKey)!;
      console.log(`[APPROVE-SELLER] Returning cached response for idempotency key: ${idempotencyKey}`);
      return NextResponse.json(cachedResponse);
    }

    // Buscar seller do banco
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });
    
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
          action: 'APPROVE_SELLER',
          sellerId,
          reason: `Seller status is ${seller.status}, expected PENDING`,
          currentStatus: seller.status
        },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { 
          error: `Cannot approve seller with status ${seller.status}. Only PENDING sellers can be approved.`, 
          code: 'INVALID_STATUS_FOR_APPROVAL' 
        },
        { status: 422 }
      );
    }

    // Simular controle de concorrência com updatedAt
    const requestTime = new Date();
    const sellerUpdatedAt = new Date(seller.updatedAt);
    
    // Se seller foi atualizado recentemente por outra operação
    if (requestTime.getTime() - sellerUpdatedAt.getTime() < 1000 && seller.version > 1) {
      return NextResponse.json(
        { error: 'Seller was recently modified by another operation. Please refresh and try again.', code: 'CONCURRENT_MODIFICATION' },
        { status: 409 }
      );
    }

    // Executar aprovação no banco
    const auditId = randomUUID();
    const oldStatus = seller.status;
    const newStatus = 'ACTIVE';

    // Atualizar seller com todas as configurações de taxa
    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        status: 'ACTIVE',
        exchangeRateFeePercent: exchangeRateFeePercent,
        exchangeRateFeeFixed: exchangeRateFeeFixed,
        pixPayinFeePercent: pixPayinFeePercent,
        pixPayinFeeFixed: pixPayinFeeFixed,
        pixPayoutFeePercent: pixPayoutFeePercent,
        pixPayoutFeeFixed: pixPayoutFeeFixed,
        manualWithdrawFeePercent: manualWithdrawFeePercent,
        manualWithdrawFeeFixed: manualWithdrawFeeFixed,
        usdtPurchaseFeePercent: usdtPurchaseFeePercent,
        usdtPurchaseFeeFixed: usdtPurchaseFeeFixed,
        updatedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });

    const updatedAt = updatedSeller.updatedAt.toISOString();

    // Log de auditoria
    await auditService.logEvent({
      eventType: 'ACCESS_DENIED', // Será SELLER_APPROVED em produção
      userId: adminUser.id,
      details: {
        action: 'APPROVE_SELLER',
        sellerId,
        sellerEmail: seller.email,
        sellerName: seller.name,
        fromStatus: oldStatus,
        toStatus: newStatus,
        note: note || null,
        exchangeRateFeePercent: exchangeRateFeePercent,
        exchangeRateFeeFixed: exchangeRateFeeFixed,
        pixPayinFeePercent: pixPayinFeePercent,
        pixPayinFeeFixed: pixPayinFeeFixed,
        pixPayoutFeePercent: pixPayoutFeePercent,
        pixPayoutFeeFixed: pixPayoutFeeFixed,
        manualWithdrawFeePercent: manualWithdrawFeePercent,
        manualWithdrawFeeFixed: manualWithdrawFeeFixed,
        usdtPurchaseFeePercent: usdtPurchaseFeePercent,
        usdtPurchaseFeeFixed: usdtPurchaseFeeFixed,
        auditId,
        reviewedBy: adminUser.email,
      },
      ipAddress: ip,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[APPROVE-SELLER] Approved seller ${sellerId} in ${responseTime}ms. Audit ID: ${auditId}`);

    const response: ApprovalResponse = {
      sellerId,
      oldStatus,
      newStatus,
      auditId,
      updatedAt,
      message: 'Seller approved successfully',
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
    console.error(`[APPROVE-SELLER] Error approving seller ${sellerId} after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to approve seller', code: 'APPROVAL_ERROR' },
      { status: 500 }
    );
  }
}