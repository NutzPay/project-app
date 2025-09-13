import { NextRequest, NextResponse } from 'next/server';
import { impersonationService } from '@/lib/rbac/impersonation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', code: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    // Validar token de impersonação
    const session = await impersonationService.validateImpersonationToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired impersonation token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Mock seller data - em produção viria do banco de dados
    const mockSeller = {
      id: session.sellerUserId,
      email: session.sellerEmail,
      name: `Seller ${session.sellerEmail}`,
      role: 'SELLER',
      companyId: 'company-1',
    };

    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        adminUserId: session.adminUserId,
        sellerUserId: session.sellerUserId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },
      seller: mockSeller,
      isImpersonating: true,
    });
  } catch (error) {
    console.error('Impersonation validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate impersonation token', code: 'VALIDATION_ERROR' },
      { status: 500 }
    );
  }
}