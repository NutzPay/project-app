import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commissionService } from '@/lib/commissionService';
import { SalesRepStatus, CommissionType } from '@prisma/client';

interface UpdateSalesRepRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: SalesRepStatus;
  territoryArea?: string;
  monthlyTarget?: number;
  commissionRules?: {
    transactionType: CommissionType;
    percentage: number;
  }[];
}

interface AssignSellersRequest {
  sellerIds: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesRep = await prisma.salesRep.findUnique({
      where: { id: params.id },
      include: {
        commissionRules: {
          where: { isActive: true }
        },
        sellerAssignments: {
          where: { isActive: true },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Buscar estatísticas de comissão
    const commissionStats = await commissionService.getSalesRepCommissions(params.id);

    const response = {
      id: salesRep.id,
      name: salesRep.name,
      email: salesRep.email,
      phone: salesRep.phone,
      status: salesRep.status,
      startDate: salesRep.startDate.toISOString(),
      monthlyTarget: salesRep.monthlyTarget?.toNumber(),
      territoryArea: salesRep.territoryArea,
      createdAt: salesRep.createdAt.toISOString(),
      updatedAt: salesRep.updatedAt.toISOString(),
      commissionRules: salesRep.commissionRules.map(rule => ({
        id: rule.id,
        transactionType: rule.transactionType,
        percentage: rule.percentage.toNumber(),
        isActive: rule.isActive
      })),
      assignedSellers: salesRep.sellerAssignments.map(assignment => ({
        id: assignment.seller.id,
        name: assignment.seller.name,
        email: assignment.seller.email,
        companyName: assignment.seller.companyName,
        status: assignment.seller.status,
        assignedAt: assignment.createdAt.toISOString(),
        createdAt: assignment.seller.createdAt.toISOString()
      })),
      commissionStats: {
        totalEarnings: commissionStats.summary.totalEarnings,
        totalPaid: commissionStats.summary.totalPaid,
        totalPending: commissionStats.summary.totalPending,
        transactionCount: commissionStats.summary.transactionCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching sales rep:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales rep', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateSalesRepRequest = await request.json();

    // Verificar se sales rep existe
    const existingSalesRep = await prisma.salesRep.findUnique({
      where: { id: params.id }
    });

    if (!existingSalesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Se email está sendo alterado, verificar se não existe outro com mesmo email
    if (data.email && data.email !== existingSalesRep.email) {
      const emailExists = await prisma.salesRep.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Atualizar sales rep
      const updatedSalesRep = await tx.salesRep.update({
        where: { id: params.id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
          territoryArea: data.territoryArea,
          monthlyTarget: data.monthlyTarget
        }
      });

      // Se commission rules foram fornecidas, atualizar
      if (data.commissionRules) {
        // Desativar regras existentes
        await tx.commissionRule.updateMany({
          where: {
            salesRepId: params.id,
            isActive: true
          },
          data: { isActive: false }
        });

        // Criar novas regras
        await tx.commissionRule.createMany({
          data: data.commissionRules.map(rule => ({
            salesRepId: params.id,
            transactionType: rule.transactionType,
            percentage: rule.percentage,
            isActive: true
          }))
        });
      }

      return updatedSalesRep;
    });

    console.log(`Sales rep updated: ${result.name} (${result.email})`);

    return NextResponse.json({
      success: true,
      salesRep: {
        id: result.id,
        name: result.name,
        email: result.email,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Error updating sales rep:', error);
    return NextResponse.json(
      { error: 'Failed to update sales rep', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se sales rep existe
    const existingSalesRep = await prisma.salesRep.findUnique({
      where: { id: params.id }
    });

    if (!existingSalesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verificar se há comissões associadas
    const hasCommissions = await prisma.commissionEarning.findFirst({
      where: { salesRepId: params.id }
    });

    if (hasCommissions) {
      // Se há comissões, apenas desativar em vez de deletar
      await prisma.salesRep.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' }
      });

      return NextResponse.json({
        success: true,
        message: 'Sales rep deactivated due to existing commissions'
      });
    } else {
      // Se não há comissões, pode deletar
      await prisma.$transaction(async (tx) => {
        // Remover atribuições de sellers
        await tx.sellerAssignment.deleteMany({
          where: { salesRepId: params.id }
        });

        // Remover regras de comissão
        await tx.commissionRule.deleteMany({
          where: { salesRepId: params.id }
        });

        // Deletar sales rep
        await tx.salesRep.delete({
          where: { id: params.id }
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Sales rep deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting sales rep:', error);
    return NextResponse.json(
      { error: 'Failed to delete sales rep', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}