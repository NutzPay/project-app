import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    console.log(`🔄 Zerando saldo PIX para: ${email}`);
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        pixWallet: true,
        usdtWallet: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    let result;

    if (user.pixWallet) {
      // Se tem PIX Wallet, zerar o saldo
      const oldBalance = Number(user.pixWallet.balance);
      
      result = await prisma.pIXWallet.update({
        where: { userId: user.id },
        data: {
          balance: 0,
          frozenBalance: 0,
          totalReceived: 0,
          totalSent: 0
        }
      });

      console.log(`✅ PIX Wallet zerado: R$ ${oldBalance} → R$ 0,00`);
      
      // Criar log da transação de reset
      await prisma.pIXTransaction.create({
        data: {
          walletId: user.pixWallet.id,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          amount: -oldBalance,
          balanceAfter: 0,
          description: `Reset saldo PIX - valor anterior: R$ ${oldBalance}`,
          processedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `Saldo PIX zerado para ${email}`,
        oldBalance: oldBalance,
        newBalance: 0,
        walletType: 'PIX'
      });
      
    } else {
      // Se não tem PIX Wallet, criar com saldo zero
      result = await prisma.pIXWallet.create({
        data: {
          userId: user.id,
          balance: 0,
          frozenBalance: 0,
          totalReceived: 0,
          totalSent: 0
        }
      });

      console.log(`✅ PIX Wallet criado com saldo zero para ${email}`);

      return NextResponse.json({
        success: true,
        message: `PIX Wallet criado com saldo zero para ${email}`,
        oldBalance: null,
        newBalance: 0,
        walletType: 'PIX_CREATED'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao zerar saldo PIX:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'felixelmada@gmail.com';
    
    // Verificar saldo PIX atual
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        pixWallet: true,
        usdtWallet: true,
        investmentWallet: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        wallets: {
          pix: user.pixWallet ? {
            balance: Number(user.pixWallet.balance),
            totalReceived: Number(user.pixWallet.totalReceived),
            totalSent: Number(user.pixWallet.totalSent)
          } : null,
          usdt: user.usdtWallet ? {
            balance: Number(user.usdtWallet.balance),
            totalDeposited: Number(user.usdtWallet.totalDeposited)
          } : null,
          investment: user.investmentWallet ? {
            totalInvested: Number(user.investmentWallet.totalInvested),
            activeInvestments: Number(user.investmentWallet.activeInvestments)
          } : null
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar saldo:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}