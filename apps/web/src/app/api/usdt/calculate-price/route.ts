import { NextRequest, NextResponse } from 'next/server';
import { priceCalculator } from '@/lib/priceCalculator';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usdtAmount = parseFloat(searchParams.get('usdt') || '0');
    const brlAmount = parseFloat(searchParams.get('brl') || '0');

    if (!usdtAmount && !brlAmount) {
      return NextResponse.json({
        success: false,
        error: 'Provide either usdt or brl amount'
      }, { status: 400 });
    }

    if (usdtAmount && brlAmount) {
      return NextResponse.json({
        success: false,
        error: 'Provide either usdt OR brl amount, not both'
      }, { status: 400 });
    }

    // Tentar obter usuário logado (opcional)
    let currentUser = null;
    try {
      currentUser = await getCurrentUser(request);
    } catch (error) {
      // Usuário não logado, usar taxa padrão
    }

    let calculation;

    if (usdtAmount > 0) {
      // Calcular preço em BRL para quantidade de USDT
      calculation = await priceCalculator.calculatePrice(usdtAmount, currentUser?.id);
    } else {
      // Calcular quanto USDT por valor em BRL
      calculation = await priceCalculator.calculateUSDTAmount(brlAmount, currentUser?.id);
    }

    const response = {
      success: true,
      calculation: {
        usdtAmount: calculation.usdtAmount,
        brlAmount: calculation.brlAmount,
        finalPrice: calculation.finalPrice,
        usdtPrice: calculation.usdtPrice,
        sellerFee: calculation.sellerFee,
        pricePerUsdt: calculation.pricePerUsdt
      },
      formatted: {
        usdtAmount: priceCalculator.formatUSDT(calculation.usdtAmount),
        brlAmount: priceCalculator.formatPrice(calculation.brlAmount),
        finalPrice: priceCalculator.formatPrice(calculation.finalPrice),
        pricePerUsdt: priceCalculator.formatPrice(calculation.pricePerUsdt)
      },
      details: {
        basePrice: `1 USDT = ${priceCalculator.formatPrice(calculation.usdtPrice)}`,
        withFee: `1 USDT = ${priceCalculator.formatPrice(calculation.pricePerUsdt)} (taxa ${calculation.sellerFee}%)`,
        isLoggedIn: !!currentUser,
        userId: currentUser?.id || null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error calculating USDT price:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate price',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { usdtAmount, brlAmount } = await request.json();

    if (!usdtAmount && !brlAmount) {
      return NextResponse.json({
        success: false,
        error: 'Provide either usdtAmount or brlAmount'
      }, { status: 400 });
    }

    // Obter usuário logado
    const currentUser = await getCurrentUser(request);
    
    let calculation;

    if (usdtAmount > 0) {
      calculation = await priceCalculator.calculatePrice(usdtAmount, currentUser?.id);
    } else {
      calculation = await priceCalculator.calculateUSDTAmount(brlAmount, currentUser?.id);
    }

    return NextResponse.json({
      success: true,
      calculation,
      formatted: {
        usdtAmount: priceCalculator.formatUSDT(calculation.usdtAmount),
        finalPrice: priceCalculator.formatPrice(calculation.finalPrice),
        pricePerUsdt: priceCalculator.formatPrice(calculation.pricePerUsdt)
      },
      user: currentUser ? {
        id: currentUser.id,
        email: currentUser.email
      } : null
    });

  } catch (error) {
    console.error('Error in POST calculate price:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate price'
    }, { status: 500 });
  }
}