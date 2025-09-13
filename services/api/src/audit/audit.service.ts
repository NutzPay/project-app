import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

export interface AuditLogData {
  action: AuditAction;
  userId?: string;
  companyId?: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    const requestId = data.requestId || crypto.randomUUID();
    
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId,
        userId: data.userId,
        companyId: data.companyId,
      },
    });
  }

  async findAll(params: {
    companyId?: string;
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      companyId,
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = params;

    const where: any = {};
    
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      total,
      limit,
      offset,
    };
  }

  async findById(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!log) return null;

    return {
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    };
  }

  async getStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [
      totalLogs,
      recentLogins,
      apiKeyOperations,
      webhookOperations,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: AuditAction.LOGIN,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: {
            in: [
              AuditAction.API_KEY_GENERATE,
              AuditAction.API_KEY_REVOKE,
              AuditAction.API_KEY_ROTATE,
            ],
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          resource: 'webhook',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalLogs,
      recentLogins,
      apiKeyOperations,
      webhookOperations,
    };
  }
}