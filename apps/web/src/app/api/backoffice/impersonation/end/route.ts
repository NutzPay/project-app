import { NextRequest, NextResponse } from 'next/server';
import { impersonationService } from '@/lib/rbac/impersonation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Session token is required', code: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Encerrar impersonação
    await impersonationService.endImpersonation(token, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended successfully',
    });
  } catch (error: any) {
    console.error('Impersonation end error:', error);

    if (error.message === 'Invalid impersonation session') {
      return NextResponse.json(
        { error: error.message, code: 'INVALID_SESSION' },
        { status: 400 }
      );
    }

    if (error.message === 'Impersonation session already ended') {
      return NextResponse.json(
        { error: error.message, code: 'SESSION_ALREADY_ENDED' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to end impersonation', code: 'IMPERSONATION_ERROR' },
      { status: 500 }
    );
  }
}