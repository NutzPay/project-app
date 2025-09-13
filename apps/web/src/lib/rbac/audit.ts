import { AuditEvent } from '@/types/rbac';
import { randomUUID } from 'crypto';

interface CreateAuditEventInput {
  eventType: AuditEvent['eventType'];
  userId: string;
  adminUserId?: string;
  sellerUserId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

class AuditService {
  private events: AuditEvent[] = [];

  async logEvent(input: CreateAuditEventInput): Promise<void> {
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      eventType: input.eventType,
      userId: input.userId,
      adminUserId: input.adminUserId,
      sellerUserId: input.sellerUserId,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      timestamp: new Date(),
    };

    // Em produção, isso seria salvo no banco de dados
    this.events.push(auditEvent);
    
    // Log para console em desenvolvimento
    console.log('[AUDIT]', JSON.stringify(auditEvent, null, 2));

    // Em produção, também poderia enviar para serviços de logging como DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      await this.persistToDatabase(auditEvent);
      await this.sendToLoggingService(auditEvent);
    }
  }

  async getEvents(filters?: {
    eventType?: AuditEvent['eventType'];
    userId?: string;
    adminUserId?: string;
    sellerUserId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditEvent[]> {
    let filtered = [...this.events];

    if (filters) {
      if (filters.eventType) {
        filtered = filtered.filter(event => event.eventType === filters.eventType);
      }
      if (filters.userId) {
        filtered = filtered.filter(event => event.userId === filters.userId);
      }
      if (filters.adminUserId) {
        filtered = filtered.filter(event => event.adminUserId === filters.adminUserId);
      }
      if (filters.sellerUserId) {
        filtered = filtered.filter(event => event.sellerUserId === filters.sellerUserId);
      }
      if (filters.startDate) {
        filtered = filtered.filter(event => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(event => event.timestamp <= filters.endDate!);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async logLoginBlocked(
    email: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'LOGIN_BLOCKED',
      userId: 'unknown',
      details: {
        email,
        reason,
        blockType: 'ROLE_CONFLICT_OR_ACCESS_DENIED'
      },
      ipAddress,
      userAgent,
    });
  }

  async logImpersonationStart(
    adminUserId: string,
    sellerUserId: string,
    sellerEmail: string,
    sessionToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'IMPERSONATION_START',
      userId: adminUserId,
      adminUserId,
      sellerUserId,
      details: {
        sellerEmail,
        sessionToken,
        action: 'impersonation_started'
      },
      ipAddress,
      userAgent,
    });
  }

  async logImpersonationEnd(
    adminUserId: string,
    sellerUserId: string,
    sellerEmail: string,
    sessionToken: string,
    duration: number,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'IMPERSONATION_END',
      userId: adminUserId,
      adminUserId,
      sellerUserId,
      details: {
        sellerEmail,
        sessionToken,
        durationSeconds: duration,
        action: 'impersonation_ended'
      },
      ipAddress,
      userAgent,
    });
  }

  async logAccessDenied(
    userId: string,
    reason: string,
    resource: string,
    action: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'ACCESS_DENIED',
      userId,
      details: {
        reason,
        resource,
        action,
        deniedAccess: true
      },
      ipAddress,
      userAgent,
    });
  }

  private async persistToDatabase(event: AuditEvent): Promise<void> {
    try {
      // Em produção, salvar no banco de dados
      // Exemplo: await prisma.auditLog.create({ data: event });
      console.log('[AUDIT] Would persist to database:', event.id);
    } catch (error) {
      console.error('[AUDIT] Failed to persist to database:', error);
    }
  }

  private async sendToLoggingService(event: AuditEvent): Promise<void> {
    try {
      // Em produção, enviar para serviço de logging externo
      // Exemplo: await datadog.log(event);
      console.log('[AUDIT] Would send to logging service:', event.id);
    } catch (error) {
      console.error('[AUDIT] Failed to send to logging service:', error);
    }
  }

  // Método para exportar logs em formato CSV
  async exportAuditLogs(filters?: Parameters<typeof this.getEvents>[0]): Promise<string> {
    const events = await this.getEvents(filters);
    
    const headers = [
      'ID',
      'Event Type',
      'User ID',
      'Admin User ID',
      'Seller User ID',
      'IP Address',
      'User Agent',
      'Timestamp',
      'Details'
    ].join(',');

    const rows = events.map(event => [
      event.id,
      event.eventType,
      event.userId,
      event.adminUserId || '',
      event.sellerUserId || '',
      event.ipAddress,
      `"${event.userAgent}"`,
      event.timestamp.toISOString(),
      `"${JSON.stringify(event.details).replace(/"/g, '""')}"`
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  // Método para limpar logs antigos (manter apenas últimos X dias)
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const initialCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
    
    const removedCount = initialCount - this.events.length;
    console.log(`[AUDIT] Cleaned up ${removedCount} old audit logs (keeping ${daysToKeep} days)`);
    
    return removedCount;
  }
}

export const auditService = new AuditService();