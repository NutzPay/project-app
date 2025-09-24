import { prisma } from '@/lib/prisma';
import { AuditAction, AuditSeverity, AuditCategory } from '@prisma/client';

export interface AuditLogInput {
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  description?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  severity?: AuditSeverity;
  category?: AuditCategory;
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  duration?: number;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  metadata?: Record<string, any>;
  location?: string;
  deviceId?: string;
  deviceType?: string;
  riskScore?: number;
  userId?: string;
  companyId?: string;
}

export interface SecurityEvent {
  type: 'SUSPICIOUS_LOGIN' | 'MULTIPLE_FAILED_LOGINS' | 'UNUSUAL_TRANSACTION' | 'FRAUD_PATTERN' | 'API_ABUSE';
  severity: AuditSeverity;
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  timestamp: Date;
}

class AuditService {
  /**
   * Log a comprehensive audit event to the database
   */
  async logEvent(input: AuditLogInput): Promise<void> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          description: input.description,
          details: input.details ? JSON.stringify(input.details) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          requestId: input.requestId,
          sessionId: input.sessionId,
          severity: input.severity || AuditSeverity.INFO,
          category: input.category || AuditCategory.SYSTEM,
          success: input.success,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          duration: input.duration,
          beforeData: input.beforeData ? JSON.stringify(input.beforeData) : null,
          afterData: input.afterData ? JSON.stringify(input.afterData) : null,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          location: input.location,
          deviceId: input.deviceId,
          deviceType: input.deviceType,
          riskScore: input.riskScore,
          flagged: (input.severity === AuditSeverity.CRITICAL || input.severity === AuditSeverity.HIGH) ||
                   (input.riskScore && input.riskScore > 75),
          userId: input.userId,
          companyId: input.companyId,
        },
      });

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUDIT] ${input.action}:`, {
          id: auditLog.id,
          severity: input.severity,
          success: input.success,
          userId: input.userId,
          description: input.description,
        });
      }

      // Send critical events to external monitoring
      if (input.severity === AuditSeverity.CRITICAL) {
        await this.sendCriticalAlert(auditLog.id, input);
      }

    } catch (error) {
      console.error('[AUDIT] Failed to log audit event:', error);
      // Fallback logging to prevent audit loss
      console.log('[AUDIT-FALLBACK]', JSON.stringify(input, null, 2));
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(params: {
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE';
    userId?: string;
    email?: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const severity = params.success
      ? AuditSeverity.INFO
      : (params.action === 'LOGIN_FAILED' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM);

    await this.logEvent({
      action: params.action as AuditAction,
      category: AuditCategory.AUTHENTICATION,
      severity,
      description: `${params.action}: ${params.email || 'Unknown user'}`,
      success: params.success,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      details: {
        email: params.email,
        reason: params.reason,
        ...params.metadata,
      },
      deviceType: this.detectDeviceType(params.userAgent),
      riskScore: await this.calculateRiskScore({
        action: params.action,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: params.success,
      }),
    });
  }

  /**
   * Log financial transactions
   */
  async logTransaction(params: {
    action: 'TRANSACTION_CREATE' | 'PAYMENT_PROCESSED' | 'EXCHANGE_TRANSACTION' | 'WITHDRAWAL_REQUEST';
    transactionId: string;
    userId: string;
    amount?: number;
    currency?: string;
    fromCurrency?: string;
    toCurrency?: string;
    success: boolean;
    errorCode?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const riskScore = await this.calculateTransactionRisk({
      amount: params.amount,
      userId: params.userId,
      ipAddress: params.ipAddress,
    });

    await this.logEvent({
      action: params.action as AuditAction,
      category: AuditCategory.FINANCIAL,
      severity: riskScore > 50 ? AuditSeverity.HIGH : AuditSeverity.INFO,
      resource: 'transaction',
      resourceId: params.transactionId,
      description: `${params.action}: ${params.amount} ${params.currency || ''}`,
      success: params.success,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      errorCode: params.errorCode,
      riskScore,
      details: {
        amount: params.amount,
        currency: params.currency,
        fromCurrency: params.fromCurrency,
        toCurrency: params.toCurrency,
        ...params.metadata,
      },
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(params: {
    action: AuditAction;
    adminUserId: string;
    targetUserId?: string;
    resource?: string;
    resourceId?: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }): Promise<void> {
    await this.logEvent({
      action: params.action,
      category: AuditCategory.ADMINISTRATIVE,
      severity: AuditSeverity.MEDIUM,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description || `Admin action: ${params.action}`,
      success: true,
      userId: params.adminUserId,
      beforeData: params.beforeData,
      afterData: params.afterData,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        targetUserId: params.targetUserId,
        adminAction: true,
      },
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.logEvent({
      action: AuditAction.SECURITY_ALERT,
      category: AuditCategory.SECURITY,
      severity: event.severity,
      description: `Security Alert: ${event.type}`,
      success: false,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: {
        alertType: event.type,
        ...event.details,
      },
      riskScore: 90, // Security events are always high risk
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(filters: {
    userId?: string;
    action?: AuditAction;
    severity?: AuditSeverity;
    category?: AuditCategory;
    flagged?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      userId,
      action,
      severity,
      category,
      flagged,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (flagged !== undefined) where.flagged = flagged;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        beforeData: log.beforeData ? JSON.parse(log.beforeData) : null,
        afterData: log.afterData ? JSON.parse(log.afterData) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get audit statistics
   */
  async getStats(period: 'today' | 'week' | 'month' = 'today') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const [total, todayCount, alerts, errors, flaggedCount, criticalCount] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          severity: AuditSeverity.HIGH,
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          success: false,
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          flagged: true,
        },
      }),
      prisma.auditLog.count({
        where: {
          severity: AuditSeverity.CRITICAL,
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    return {
      total,
      today: todayCount,
      alerts,
      errors,
      flagged: flaggedCount,
      critical: criticalCount,
    };
  }

  /**
   * Calculate risk score based on various factors
   */
  private async calculateRiskScore(params: {
    action: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    amount?: number;
    userId?: string;
  }): Promise<number> {
    let score = 0;

    // Base score for failed actions
    if (!params.success) {
      score += 30;
    }

    // Check for suspicious IP patterns
    if (params.ipAddress) {
      const recentFailures = await prisma.auditLog.count({
        where: {
          ipAddress: params.ipAddress,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });
      score += Math.min(recentFailures * 10, 40);
    }

    // Check for high-value transactions
    if (params.amount && params.amount > 10000) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate transaction-specific risk
   */
  private async calculateTransactionRisk(params: {
    amount?: number;
    userId: string;
    ipAddress?: string;
  }): Promise<number> {
    let score = 0;

    if (params.amount) {
      // High amounts are riskier
      if (params.amount > 50000) score += 40;
      else if (params.amount > 10000) score += 25;
      else if (params.amount > 1000) score += 10;

      // Check user's recent transaction patterns
      const recentTransactions = await prisma.auditLog.count({
        where: {
          userId: params.userId,
          category: AuditCategory.FINANCIAL,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentTransactions > 10) score += 30; // Too many transactions
    }

    return Math.min(score, 100);
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Send critical alerts to external monitoring
   */
  private async sendCriticalAlert(auditId: string, event: AuditLogInput): Promise<void> {
    // This would integrate with external services like:
    // - Slack/Discord webhooks
    // - Email alerts
    // - SMS notifications
    // - External monitoring services (DataDog, New Relic)

    console.log(`[CRITICAL-ALERT] ${auditId}:`, {
      action: event.action,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: new Date().toISOString(),
    });

    // In production, implement actual alerting
    // await sendSlackAlert(event);
    // await sendEmailAlert(event);
  }

  /**
   * Export audit logs to CSV
   */
  async exportLogs(filters: Parameters<typeof this.getLogs>[0] = {}): Promise<string> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 });

    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Category',
      'Severity',
      'User Email',
      'IP Address',
      'Description',
      'Success',
      'Risk Score',
      'Flagged',
    ].join(',');

    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.action,
      log.category,
      log.severity,
      log.user?.email || '',
      log.ipAddress || '',
      `"${log.description || ''}"`,
      log.success?.toString() || '',
      log.riskScore?.toString() || '',
      log.flagged.toString(),
    ].join(','));

    return [headers, ...rows].join('\n');
  }
}

export const auditService = new AuditService();