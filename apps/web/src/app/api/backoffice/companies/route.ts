import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Get companies with related data
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            }
          },
          apiKeys: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          },
          webhooks: {
            select: {
              id: true,
              url: true,
              status: true,
            }
          },
          _count: {
            select: {
              users: true,
              apiKeys: true,
              webhooks: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    // Get stats by status
    const statsData = await prisma.company.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats = {
      total: totalCount,
      active: statsData.find(s => s.status === 'ACTIVE')?._count || 0,
      pending: statsData.find(s => s.status === 'PENDING_VERIFICATION')?._count || 0,
      suspended: statsData.find(s => s.status === 'SUSPENDED')?._count || 0,
      blocked: statsData.find(s => s.status === 'BLOCKED')?._count || 0,
    };

    // Format companies data
    const companiesFormatted = companies.map(company => ({
      id: company.id,
      name: company.name,
      document: company.document,
      email: company.email,
      status: company.status,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      users: company.users,
      apiKeys: company.apiKeys,
      webhooks: company.webhooks,
      counts: {
        users: company._count.users,
        apiKeys: company._count.apiKeys,
        webhooks: company._count.webhooks,
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      companies: companiesFormatted,
      pagination: {
        total: totalCount,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });

  } catch (error) {
    console.error('❌ Error loading companies:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}