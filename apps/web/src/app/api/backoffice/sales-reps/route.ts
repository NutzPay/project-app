import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { commissionService } from '@/lib/commissionService';
import { SalesRepStatus, CommissionType } from '@prisma/client';

interface CreateSalesRepRequest {
  name: string;
  email: string;
  phone?: string;
  territoryArea?: string;
  monthlyTarget?: number;
  commissionRules: {
    transactionType: CommissionType;
    percentage: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') as SalesRepStatus | null;
    const search = searchParams.get('search');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { territoryArea: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [salesReps, totalCount] = await Promise.all([
      prisma.salesRep.findMany({
        where,
        include: {
          commissionRules: {
            where: { isActive: true }
          },
          sellerAssignments: {
            where: { isActive: true },
            include: {
              seller: {
                select: {
                  name: true,
                  email: true,
                  companyName: true
                }
              }
            }
          },
          _count: {
            select: {
              sellerAssignments: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.salesRep.count({ where })
    ]);

    // Calcular estatísticas de comissão para cada sales rep
    const salesRepsWithStats = await Promise.all(
      salesReps.map(async (salesRep) => {
        const commissionStats = await commissionService.getCommissionStats(salesRep.id);

        return {
          id: salesRep.id,
          name: salesRep.name,
          email: salesRep.email,
          phone: salesRep.phone,
          status: salesRep.status,
          startDate: salesRep.startDate.toISOString(),
          monthlyTarget: salesRep.monthlyTarget?.toNumber(),
          territoryArea: salesRep.territoryArea,
          assignedSellers: salesRep._count.sellerAssignments,
          monthlyEarnings: commissionStats.pendingEarnings, // Comissões do mês atual
          totalEarnings: commissionStats.totalEarnings,
          createdAt: salesRep.createdAt.toISOString(),
          updatedAt: salesRep.updatedAt.toISOString(),
          commissionRules: salesRep.commissionRules.map(rule => ({
            transactionType: rule.transactionType,
            percentage: rule.percentage.toNumber()
          })),
          sellers: salesRep.sellerAssignments.map(assignment => ({
            id: assignment.sellerId,
            name: assignment.seller.name,
            email: assignment.seller.email,
            companyName: assignment.seller.companyName,
            assignedAt: assignment.createdAt.toISOString()
          }))
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    // Estatísticas gerais
    const stats = await Promise.all([
      prisma.salesRep.count({ where: { status: 'ACTIVE' } }),
      prisma.salesRep.count({ where: { status: 'INACTIVE' } }),
      prisma.salesRep.count({ where: { status: 'SUSPENDED' } }),
      commissionService.getCommissionStats()
    ]);

    const response = {
      salesReps: salesRepsWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        totalReps: totalCount,
        activeReps: stats[0],
        inactiveReps: stats[1],
        suspendedReps: stats[2],
        totalEarnings: stats[3].totalEarnings,
        pendingPayments: stats[3].pendingEarnings,
        totalTransactions: stats[3].transactionCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching sales reps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales reps', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateSalesRepRequest = await request.json();

    // Validações
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!data.commissionRules || data.commissionRules.length === 0) {
      return NextResponse.json(
        { error: 'At least one commission rule is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingSalesRep = await prisma.salesRep.findUnique({
      where: { email: data.email }
    });

    if (existingSalesRep) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Criar sales rep com regras de comissão em uma transação
    const result = await prisma.$transaction(async (tx) => {
      const salesRep = await tx.salesRep.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: 'ACTIVE',
          startDate: new Date(),
          monthlyTarget: data.monthlyTarget,
          territoryArea: data.territoryArea
        }
      });

      // Criar regras de comissão
      await tx.commissionRule.createMany({
        data: data.commissionRules.map(rule => ({
          salesRepId: salesRep.id,
          transactionType: rule.transactionType,
          percentage: rule.percentage,
          isActive: true
        }))
      });

      return salesRep;
    });

    console.log(`Sales rep created: ${result.name} (${result.email})`);

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
    console.error('Error creating sales rep:', error);
    return NextResponse.json(
      { error: 'Failed to create sales rep', code: 'CREATION_ERROR' },
      { status: 500 }
    );
  }
}