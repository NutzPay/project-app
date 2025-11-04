import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma, Company, CompanyStatus, AuditAction } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    data: Prisma.CompanyCreateInput,
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<Company> {
    const company = await this.prisma.company.create({
      data,
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Audit log
    if (auditInfo.userId) {
      await this.auditService.log({
        action: AuditAction.CREATE,
        userId: auditInfo.userId,
        companyId: company.id,
        resource: 'company',
        resourceId: company.id,
        details: {
          companyName: company.name,
          document: company.document,
          planId: company.planId,
        },
        ipAddress: auditInfo.ip,
        userAgent: auditInfo.userAgent,
      });
    }

    return company;
  }

  async findAll(params: {
    status?: CompanyStatus;
    planId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, planId, limit = 100, offset = 0 } = params;

    const where: any = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              monthlyFee: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              apiKeys: true,
              webhooks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      total,
      limit,
      offset,
    };
  }

  async findById(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            lastUsedAt: true,
          },
          where: {
            status: { not: 'REVOKED' },
          },
        },
        webhooks: {
          select: {
            id: true,
            url: true,
            status: true,
            events: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            requestLogs: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<Company> {
    const existingCompany = await this.findById(id);

    try {
      const updatedCompany = await this.prisma.company.update({
        where: { id },
        data,
        include: {
          plan: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Audit log
      if (auditInfo.userId) {
        await this.auditService.log({
          action: AuditAction.UPDATE,
          userId: auditInfo.userId,
          companyId: id,
          resource: 'company',
          resourceId: id,
          details: {
            changes: data,
            previousValues: {
              name: existingCompany.name,
              status: existingCompany.status,
              planId: existingCompany.planId,
            },
          },
          ipAddress: auditInfo.ip,
          userAgent: auditInfo.userAgent,
        });
      }

      return updatedCompany;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Company not found');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: CompanyStatus,
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<Company> {
    return this.update(id, { status }, auditInfo);
  }

  async updatePlan(
    id: string,
    planId: string,
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<Company> {
    // Get plan details to update limits
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.update(
      id,
      {
        plan: { connect: { id: planId } },
        monthlyLimit: plan.monthlyLimit,
        dailyLimit: plan.dailyLimit,
        requestsPerMinute: plan.requestsPerMinute,
      },
      auditInfo,
    );
  }

  async delete(
    id: string,
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ): Promise<void> {
    const company = await this.findById(id);

    try {
      await this.prisma.company.delete({
        where: { id },
      });

      // Audit log
      if (auditInfo.userId) {
        await this.auditService.log({
          action: AuditAction.DELETE,
          userId: auditInfo.userId,
          resource: 'company',
          resourceId: id,
          details: {
            companyName: company.name,
            document: company.document,
            deletedAt: new Date(),
          },
          ipAddress: auditInfo.ip,
          userAgent: auditInfo.userAgent,
        });
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Company not found');
      }
      throw error;
    }
  }

  async getStats(companyId?: string) {
    const where = companyId ? { id: companyId } : {};

    const [
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      suspendedCompanies,
    ] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.count({ where: { ...where, status: CompanyStatus.ACTIVE } }),
      this.prisma.company.count({ where: { ...where, status: CompanyStatus.PENDING_VERIFICATION } }),
      this.prisma.company.count({ where: { ...where, status: CompanyStatus.SUSPENDED } }),
    ]);

    return {
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      suspendedCompanies,
    };
  }

  async getFees(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      success: true,
      fees: {
        pixPayIn: {
          percentage: 0,
          fixed: 0,
        },
        pixPayOut: {
          percentage: 0,
          fixed: 0,
        },
        withdrawal: {
          percentage: 0,
          fixed: 0,
        },
      },
    };
  }
}