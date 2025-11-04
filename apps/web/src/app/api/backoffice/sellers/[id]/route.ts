import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { auditService } from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity, AuditCategory } from '@prisma/client';

interface SellerDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountType?: string;
  document?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  // Fee Configuration
  exchangeRate?: number;
  pixPayinFeePercent?: number;
  pixPayinFeeFixed?: number;
  pixPayoutFeePercent?: number;
  pixPayoutFeeFixed?: number;
  manualWithdrawFeePercent?: number;
  manualWithdrawFeeFixed?: number;
  usdtPurchaseFeePercent?: number;
  usdtPurchaseFeeFixed?: number;
  company?: {
    id: string;
    name: string;
    status: string;
    document: string;
    email: string;
    planId?: string;
    subscriptionId?: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    createdAt: string;
  };
  dealSummary: {
    totalVolume: number;
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    cancelledDeals: number;
    lastDealDate?: string;
    averageDealSize: number;
    topCategories: Array<{
      category: string;
      volume: number;
      count: number;
    }>;
  };
  usdtWallet?: {
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalTransacted: number;
    lastTransactionDate?: string;
    walletAddress?: string;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    keyPreview: string;
    status: string;
    lastUsedAt?: string;
    createdAt: string;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    lastTriggeredAt?: string;
    createdAt: string;
  }>;
  activitySummary: {
    totalLogins: number;
    lastLoginDaysAgo: number;
    averageSessionDuration: number;
    mostUsedFeatures: string[];
  };
  riskAnalysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    lastReviewDate: string;
  };
}

// Real seller data is now fetched directly from database

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const sellerId = params.id;
  
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

    if (!adminUser.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'NOT_ADMIN' },
        { status: 403 }
      );
    }

    // Buscar seller do banco de dados
    const sellerDetail = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        accountType: true,
        document: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        companyName: true,
        // Fee fields
        exchangeRateFeePercent: true,
        exchangeRateFeeFixed: true,
        pixPayinFeePercent: true,
        pixPayinFeeFixed: true,
        pixPayoutFeePercent: true,
        pixPayoutFeeFixed: true,
        manualWithdrawFeePercent: true,
        manualWithdrawFeeFixed: true,
        usdtPurchaseFeePercent: true,
        usdtPurchaseFeeFixed: true,
      },
    });

    if (!sellerDetail) {
      return NextResponse.json(
        { error: 'Seller not found', code: 'SELLER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Format response with fee data
    const formattedSeller = {
      id: sellerDetail.id,
      name: sellerDetail.name,
      email: sellerDetail.email,
      role: sellerDetail.role,
      status: sellerDetail.status,
      accountType: sellerDetail.accountType || undefined,
      document: sellerDetail.document || undefined,
      emailVerified: sellerDetail.emailVerified,
      emailVerifiedAt: sellerDetail.emailVerifiedAt?.toISOString(),
      lastLoginAt: sellerDetail.lastLoginAt?.toISOString(),
      createdAt: sellerDetail.createdAt.toISOString(),
      updatedAt: sellerDetail.updatedAt.toISOString(),
      // Fee Configuration
      exchangeRateFeePercent: sellerDetail.exchangeRateFeePercent ? parseFloat(sellerDetail.exchangeRateFeePercent.toString()) : undefined,
      exchangeRateFeeFixed: sellerDetail.exchangeRateFeeFixed ? parseFloat(sellerDetail.exchangeRateFeeFixed.toString()) : undefined,
      pixPayinFeePercent: sellerDetail.pixPayinFeePercent ? parseFloat(sellerDetail.pixPayinFeePercent.toString()) : undefined,
      pixPayinFeeFixed: sellerDetail.pixPayinFeeFixed ? parseFloat(sellerDetail.pixPayinFeeFixed.toString()) : undefined,
      pixPayoutFeePercent: sellerDetail.pixPayoutFeePercent ? parseFloat(sellerDetail.pixPayoutFeePercent.toString()) : undefined,
      pixPayoutFeeFixed: sellerDetail.pixPayoutFeeFixed ? parseFloat(sellerDetail.pixPayoutFeeFixed.toString()) : undefined,
      manualWithdrawFeePercent: sellerDetail.manualWithdrawFeePercent ? parseFloat(sellerDetail.manualWithdrawFeePercent.toString()) : undefined,
      manualWithdrawFeeFixed: sellerDetail.manualWithdrawFeeFixed ? parseFloat(sellerDetail.manualWithdrawFeeFixed.toString()) : undefined,
      usdtPurchaseFeePercent: sellerDetail.usdtPurchaseFeePercent ? parseFloat(sellerDetail.usdtPurchaseFeePercent.toString()) : undefined,
      usdtPurchaseFeeFixed: sellerDetail.usdtPurchaseFeeFixed ? parseFloat(sellerDetail.usdtPurchaseFeeFixed.toString()) : undefined,
      company: sellerDetail.companyName ? {
        id: 'temp',
        name: sellerDetail.companyName,
        status: 'ACTIVE',
        document: sellerDetail.document || '',
      } : undefined,
      // Mock data for UI compatibility - in production these would come from related tables
      dealSummary: {
        totalVolume: 0,
        totalDeals: 0,
        activeDeals: 0,
        completedDeals: 0,
        cancelledDeals: 0,
        averageDealSize: 0,
        topCategories: [],
      },
      usdtWallet: {
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalTransacted: 0,
      },
      apiKeys: [],
      webhooks: [],
      activitySummary: {
        totalLogins: 0,
        lastLoginDaysAgo: 0,
        averageSessionDuration: 0,
        mostUsedFeatures: [],
      },
      riskAnalysis: {
        riskLevel: 'LOW' as const,
        factors: ['Email verificado'],
        lastReviewDate: new Date().toISOString(),
      },
    };

    const responseTime = Date.now() - startTime;
    console.log(`[SELLER-DETAIL] Fetched seller ${sellerId} in ${responseTime}ms`);

    return NextResponse.json(formattedSeller);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[SELLER-DETAIL] Error fetching seller ${sellerId} after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to fetch seller details', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

interface FeeUpdateRequest {
  exchangeRateFeePercent?: number;
  exchangeRateFeeFixed?: number;
  pixPayinFeePercent?: number;
  pixPayinFeeFixed?: number;
  pixPayoutFeePercent?: number;
  pixPayoutFeeFixed?: number;
  manualWithdrawFeePercent?: number;
  manualWithdrawFeeFixed?: number;
  usdtPurchaseFeePercent?: number;
  usdtPurchaseFeeFixed?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const sellerId = params.id;
    const body: FeeUpdateRequest = await request.json();

    console.log(`📝 Updating fees for seller ${sellerId}:`, body);

    // Get current admin user for audit
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores podem editar sellers.' },
        { status: 403 }
      );
    }

    // Get current seller data for audit comparison
    const currentSeller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        exchangeRateFeePercent: true,
        exchangeRateFeeFixed: true,
        pixPayinFeePercent: true,
        pixPayinFeeFixed: true,
        pixPayoutFeePercent: true,
        pixPayoutFeeFixed: true,
        manualWithdrawFeePercent: true,
        manualWithdrawFeeFixed: true,
        usdtPurchaseFeePercent: true,
        usdtPurchaseFeeFixed: true,
      },
    });

    if (!currentSeller) {
      return NextResponse.json(
        { success: false, error: 'Seller não encontrado' },
        { status: 404 }
      );
    }

    // Update seller fees
    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        exchangeRateFeePercent: body.exchangeRateFeePercent,
        exchangeRateFeeFixed: body.exchangeRateFeeFixed,
        pixPayinFeePercent: body.pixPayinFeePercent,
        pixPayinFeeFixed: body.pixPayinFeeFixed,
        pixPayoutFeePercent: body.pixPayoutFeePercent,
        pixPayoutFeeFixed: body.pixPayoutFeeFixed,
        manualWithdrawFeePercent: body.manualWithdrawFeePercent,
        manualWithdrawFeeFixed: body.manualWithdrawFeeFixed,
        usdtPurchaseFeePercent: body.usdtPurchaseFeePercent,
        usdtPurchaseFeeFixed: body.usdtPurchaseFeeFixed,
      },
    });

    // Create audit log
    await auditService.log({
      userId: currentUser.id,
      action: AuditAction.SELLER_FEE_UPDATED,
      category: AuditCategory.SELLER_MANAGEMENT,
      severity: AuditSeverity.MEDIUM,
      metadata: {
        sellerId: sellerId,
        sellerEmail: currentSeller.email,
        updatedFields: body,
        previousValues: {
          exchangeRateFeePercent: currentSeller.exchangeRateFeePercent?.toString(),
          pixPayinFeePercent: currentSeller.pixPayinFeePercent?.toString(),
          pixPayoutFeePercent: currentSeller.pixPayoutFeePercent?.toString(),
        },
      },
      ipAddress,
      userAgent,
    });

    console.log(`✅ Fees updated successfully for seller ${sellerId}`);

    return NextResponse.json({
      success: true,
      message: 'Taxas atualizadas com sucesso',
      seller: updatedSeller
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error updating seller fees after ${responseTime}ms:`, error);

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: 'Seller não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}