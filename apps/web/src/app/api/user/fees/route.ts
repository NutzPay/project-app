import { NextRequest, NextResponse } from 'next/server';
import { getSellerFees } from '@/lib/fee-calculator';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fee API called');

    // Try to get the current user (if authenticated)
    let user = await getCurrentUser(request);

    // For testing: if no authenticated user, use the known user with custom fees
    if (!user) {
      console.log('⚠️ No authenticated user, using test user for development');
      user = {
        id: 'cmgrcvfvq0004jtq7zxiu0m2d',
        email: 'owner@exemplo.com',
        name: 'Test User',
        role: 'OWNER' as any
      };
    }

    console.log('✅ Using user:', user.id);

    // Get real user fees from database
    const userFees = await getSellerFees(user.id);

    if (!userFees) {
      console.log('⚠️ No custom fees found for user, returning default');
      // Return default fees if no custom fees are set
      const defaultFees = {
        success: true,
        fees: {
          pixPayIn: {
            percentage: 0.01, // 1%
            fixed: 0.00,
          },
          pixPayOut: {
            percentage: 0.015, // 1.5%
            fixed: 0.00,
          },
          withdrawal: {
            percentage: 0.02, // 2%
            fixed: 0.00,
          },
          usdt: {
            percentage: 0.015, // 1.5%
            fixed: 0.00,
          },
        },
      };
      return NextResponse.json(defaultFees);
    }

    console.log('📊 Database fees for user:', user.id, userFees);
    console.log('🔍 RAW pixPayinFeePercent:', userFees.pixPayinFeePercent, typeof userFees.pixPayinFeePercent);
    console.log('🔍 RAW pixPayinFeeFixed:', userFees.pixPayinFeeFixed, typeof userFees.pixPayinFeeFixed);

    // Map database fees to response format
    const fees = {
      success: true,
      fees: {
        pixPayIn: {
          percentage: userFees.pixPayinFeePercent || 0, // Database already stores as decimal
          fixed: userFees.pixPayinFeeFixed || 0.00,
        },
        pixPayOut: {
          percentage: (userFees.pixPayoutFeePercent || 0) / 100,
          fixed: userFees.pixPayoutFeeFixed || 0.00,
        },
        withdrawal: {
          percentage: (userFees.manualWithdrawFeePercent || 0) / 100,
          fixed: userFees.manualWithdrawFeeFixed || 0.00,
        },
        usdt: {
          percentage: (userFees.usdtPurchaseFeePercent || 0) / 100,
          fixed: userFees.usdtPurchaseFeeFixed || 0.00,
        },
      },
    };

    console.log('✅ Returning user fees:', fees);
    return NextResponse.json(fees);
  } catch (error) {
    console.error('❌ Error fetching user fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}