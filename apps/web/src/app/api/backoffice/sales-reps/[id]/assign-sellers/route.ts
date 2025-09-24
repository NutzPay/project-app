import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AssignSellersRequest {
  sellerIds: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: AssignSellersRequest = await request.json();

    // Verificar se sales rep existe
    const salesRep = await prisma.salesRep.findUnique({
      where: { id: params.id }
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!data.sellerIds || data.sellerIds.length === 0) {
      return NextResponse.json(
        { error: 'Seller IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verificar se todos os sellers existem
    const sellers = await prisma.user.findMany({
      where: {
        id: { in: data.sellerIds },
        role: { in: ['SELLER', 'OWNER', 'MEMBER'] }
      },
      select: { id: true, name: true, email: true }
    });

    if (sellers.length !== data.sellerIds.length) {
      const foundIds = sellers.map(s => s.id);
      const notFoundIds = data.sellerIds.filter(id => !foundIds.includes(id));

      return NextResponse.json(
        {
          error: 'Some sellers not found',
          code: 'VALIDATION_ERROR',
          details: { notFoundIds }
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignments = [];

      for (const sellerId of data.sellerIds) {
        // Verificar se já existe atribuição ativa
        const existingAssignment = await tx.sellerAssignment.findFirst({
          where: {
            sellerId,
            isActive: true
          }
        });

        if (existingAssignment) {
          // Se é para o mesmo sales rep, ignorar
          if (existingAssignment.salesRepId === params.id) {
            continue;
          }

          // Se é para outro sales rep, desativar a anterior
          await tx.sellerAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              isActive: false,
              endDate: new Date()
            }
          });
        }

        // Criar nova atribuição
        const assignment = await tx.sellerAssignment.create({
          data: {
            salesRepId: params.id,
            sellerId,
            isActive: true,
            startDate: new Date()
          },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true
              }
            }
          }
        });

        assignments.push(assignment);
      }

      return assignments;
    });

    console.log(`Assigned ${result.length} sellers to sales rep ${salesRep.name}`);

    return NextResponse.json({
      success: true,
      message: `${result.length} sellers assigned successfully`,
      assignments: result.map(assignment => ({
        sellerId: assignment.sellerId,
        sellerName: assignment.seller.name,
        sellerEmail: assignment.seller.email,
        assignedAt: assignment.startDate.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error assigning sellers:', error);
    return NextResponse.json(
      { error: 'Failed to assign sellers', code: 'ASSIGNMENT_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: AssignSellersRequest = await request.json();

    // Verificar se sales rep existe
    const salesRep = await prisma.salesRep.findUnique({
      where: { id: params.id }
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!data.sellerIds || data.sellerIds.length === 0) {
      return NextResponse.json(
        { error: 'Seller IDs are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Desativar as atribuições
    const result = await prisma.sellerAssignment.updateMany({
      where: {
        salesRepId: params.id,
        sellerId: { in: data.sellerIds },
        isActive: true
      },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    console.log(`Unassigned ${result.count} sellers from sales rep ${salesRep.name}`);

    return NextResponse.json({
      success: true,
      message: `${result.count} sellers unassigned successfully`,
      unassignedCount: result.count
    });

  } catch (error) {
    console.error('Error unassigning sellers:', error);
    return NextResponse.json(
      { error: 'Failed to unassign sellers', code: 'UNASSIGNMENT_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAvailable = searchParams.get('includeAvailable') === 'true';

    // Verificar se sales rep existe
    const salesRep = await prisma.salesRep.findUnique({
      where: { id: params.id },
      select: { id: true, name: true }
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Buscar sellers atribuídos
    const assignedSellers = await prisma.sellerAssignment.findMany({
      where: {
        salesRepId: params.id,
        isActive: true
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response: any = {
      salesRepId: params.id,
      salesRepName: salesRep.name,
      assignedSellers: assignedSellers.map(assignment => ({
        id: assignment.seller.id,
        name: assignment.seller.name,
        email: assignment.seller.email,
        companyName: assignment.seller.companyName,
        status: assignment.seller.status,
        assignedAt: assignment.startDate.toISOString(),
        createdAt: assignment.seller.createdAt.toISOString()
      })),
      totalAssigned: assignedSellers.length
    };

    // Se solicitado, incluir sellers disponíveis para atribuição
    if (includeAvailable) {
      const assignedSellerIds = assignedSellers.map(a => a.sellerId);

      const availableSellers = await prisma.user.findMany({
        where: {
          role: { in: ['SELLER', 'OWNER', 'MEMBER'] },
          status: 'ACTIVE',
          id: { notIn: assignedSellerIds }
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          createdAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      response.availableSellers = availableSellers;
      response.totalAvailable = availableSellers.length;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching seller assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller assignments', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}