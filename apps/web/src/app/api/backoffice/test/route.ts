import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simplified test endpoint - no auth for now
    const dashboardToken = request.cookies.get('auth-token')?.value;
    const backofficeToken = request.cookies.get('backoffice-auth-token')?.value;
    
    console.log('🏗️ BACKOFFICE: Test endpoint accessed:', {
      hasDashboardToken: !!dashboardToken,
      hasBackofficeToken: !!backofficeToken,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Backoffice API test endpoint working',
      data: {
        sessionInfo: {
          isolatedFromDashboard: true,
          cookieName: 'backoffice-auth-token',
          dashboardTokenPresent: !!dashboardToken,
          backofficeTokenPresent: !!backofficeToken,
          timestamp: new Date().toISOString()
        },
        security: {
          whitelist: 'configured',
          featureFlag: process.env.BACKOFFICE_ENABLED || 'not-set',
          middleware: 'disabled-for-testing'
        }
      }
    });

  } catch (error) {
    console.error('❌ BACKOFFICE: Test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}