import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/backoffice/user-acquirers/[id] - Update user acquirer assignment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const userAcquirerId = params.id;
    const {
      isActive,
      priority,
      dailyLimit,
      monthlyLimit,
      customFeeConfig
    } = await request.json();

    const userAcquirer = await prisma.userAcquirer.findUnique({
      where: { id: userAcquirerId },
      include: {
        user: true,
        acquirer: true
      }
    });

    if (!userAcquirer) {
      return NextResponse.json(
        { success: false, error: 'Atribuição não encontrada' },
        { status: 404 }
      );
    }

    const updatedUserAcquirer = await prisma.userAcquirer.update({
      where: { id: userAcquirerId },
      data: {
        isActive: isActive ?? userAcquirer.isActive,
        priority: priority ?? userAcquirer.priority,
        dailyLimit: dailyLimit !== undefined ? (dailyLimit ? parseFloat(dailyLimit.toString()) : null) : userAcquirer.dailyLimit,
        monthlyLimit: monthlyLimit !== undefined ? (monthlyLimit ? parseFloat(monthlyLimit.toString()) : null) : userAcquirer.monthlyLimit,
        customFeeConfig: customFeeConfig !== undefined ? (customFeeConfig ? JSON.stringify(customFeeConfig) : null) : userAcquirer.customFeeConfig,
        updatedAt: new Date()
      },
      include: {
        acquirer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Updated acquirer assignment for ${userAcquirer.user.name} - ${userAcquirer.acquirer.name}`);

    return NextResponse.json({
      success: true,
      userAcquirer: updatedUserAcquirer
    });

  } catch (error) {
    console.error('❌ Error updating user acquirer:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/backoffice/user-acquirers/[id] - Remove acquirer assignment from user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const userAcquirerId = params.id;

    const userAcquirer = await prisma.userAcquirer.findUnique({
      where: { id: userAcquirerId },
      include: {
        user: true,
        acquirer: true
      }
    });

    if (!userAcquirer) {
      return NextResponse.json(
        { success: false, error: 'Atribuição não encontrada' },
        { status: 404 }
      );
    }

    // Check if user has pending transactions with this acquirer
    const pendingTransactions = await prisma.pIXTransaction.count({
      where: {
        acquirerId: userAcquirer.acquirerId,
        wallet: {
          userId: userAcquirer.userId
        },
        status: 'PENDING'
      }
    });

    if (pendingTransactions > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível remover adquirente com transações pendentes',
          details: { pendingTransactions }
        },
        { status: 400 }
      );
    }

    await prisma.userAcquirer.delete({
      where: { id: userAcquirerId }
    });

    console.log(`✅ Removed acquirer ${userAcquirer.acquirer.name} from user ${userAcquirer.user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Atribuição removida com sucesso'
    });

  } catch (error) {
    console.error('❌ Error removing user acquirer:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}