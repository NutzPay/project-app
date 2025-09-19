import { prisma } from './prisma';
import { CommissionType, TransactionType } from '@prisma/client';

interface TransactionInput {
  transactionType: TransactionType;
  amount: number;
  sellerId: string;
  transactionId: string;
  createdAt: Date;
}

interface CycleCreationInput {
  cycleType: 'WEEKLY' | 'MONTHLY';
  startDate: Date;
  endDate: Date;
}

interface PeriodEarningInput {
  cycleId: string;
  salesRepId: string;
  sellerId: string;
  pixPayinVolume?: number;
  pixPayoutVolume?: number;
  usdtPurchaseVolume?: number;
  usdtInvestmentVolume?: number;
}

class CommissionService {

  // Get commission type from transaction type
  private getCommissionTypeFromTransaction(transactionType: TransactionType): CommissionType {
    switch (transactionType) {
      case 'PIX_PAYIN':
        return CommissionType.PIX_PAYIN;
      case 'PIX_PAYOUT':
        return CommissionType.PIX_PAYOUT;
      case 'USDT_PURCHASE':
        return CommissionType.USDT_PURCHASE;
      case 'USDT_INVESTMENT':
        return CommissionType.USDT_INVESTMENT;
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }
  }

  // Create a new commission cycle (weekly or monthly)
  async createCommissionCycle(input: CycleCreationInput) {
    try {
      const cycle = await prisma.$executeRaw`
        INSERT INTO "CommissionCycle" ("cycleType", "startDate", "endDate", "status")
        VALUES (${input.cycleType}, ${input.startDate}, ${input.endDate}, 'ACTIVE')
        RETURNING *
      `;

      console.log(`Created ${input.cycleType} commission cycle from ${input.startDate} to ${input.endDate}`);
      return cycle;
    } catch (error) {
      console.error('Error creating commission cycle:', error);
      throw error;
    }
  }

  // Get the current active cycle for a date
  async getCurrentCycle(date: Date = new Date()) {
    const cycle = await prisma.$queryRaw`
      SELECT * FROM "CommissionCycle"
      WHERE "startDate" <= ${date}
      AND "endDate" >= ${date}
      AND "status" = 'ACTIVE'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return Array.isArray(cycle) && cycle.length > 0 ? cycle[0] : null;
  }

  // Process a transaction and add to volume tracking (not calculate commission yet)
  async processTransactionVolume(transaction: TransactionInput): Promise<void> {
    try {
      // Find the current active cycle
      const currentCycle = await this.getCurrentCycle(transaction.createdAt);

      if (!currentCycle) {
        console.log('No active commission cycle found for transaction date:', transaction.createdAt);
        return;
      }

      // Find the sales rep responsible for this seller
      const sellerAssignment = await prisma.sellerAssignment.findFirst({
        where: {
          sellerId: transaction.sellerId,
          isActive: true
        },
        include: {
          salesRep: true
        }
      });

      if (!sellerAssignment) {
        console.log(`No active sales rep found for seller ${transaction.sellerId}`);
        return;
      }

      // Find or create period earning record for this cycle/salesRep/seller combination
      let periodEarning = await prisma.$queryRaw`
        SELECT * FROM "CommissionPeriodEarning"
        WHERE "cycleId" = ${currentCycle.id}
        AND "salesRepId" = ${sellerAssignment.salesRepId}
        AND "sellerId" = ${transaction.sellerId}
        LIMIT 1
      `;

      periodEarning = Array.isArray(periodEarning) && periodEarning.length > 0 ? periodEarning[0] : null;

      // Volume field mapping
      const volumeFields = {
        'PIX_PAYIN': 'pixPayinVolume',
        'PIX_PAYOUT': 'pixPayoutVolume',
        'USDT_PURCHASE': 'usdtPurchaseVolume',
        'USDT_INVESTMENT': 'usdtInvestmentVolume'
      };

      const volumeField = volumeFields[transaction.transactionType];

      if (!volumeField) {
        console.log(`Unknown transaction type: ${transaction.transactionType}`);
        return;
      }

      if (periodEarning) {
        // Update existing record - add to the volume
        await prisma.$executeRaw`
          UPDATE "CommissionPeriodEarning"
          SET "${volumeField}" = "${volumeField}" + ${transaction.amount},
              "totalVolume" = "totalVolume" + ${transaction.amount},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${periodEarning.id}
        `;

        console.log(`Updated ${volumeField} for sales rep ${sellerAssignment.salesRepId}, added ${transaction.amount}`);
      } else {
        // Create new period earning record
        const volumeData = {
          pixPayinVolume: transaction.transactionType === 'PIX_PAYIN' ? transaction.amount : 0,
          pixPayoutVolume: transaction.transactionType === 'PIX_PAYOUT' ? transaction.amount : 0,
          usdtPurchaseVolume: transaction.transactionType === 'USDT_PURCHASE' ? transaction.amount : 0,
          usdtInvestmentVolume: transaction.transactionType === 'USDT_INVESTMENT' ? transaction.amount : 0,
        };

        await prisma.$executeRaw`
          INSERT INTO "CommissionPeriodEarning"
          ("cycleId", "salesRepId", "sellerId", "pixPayinVolume", "pixPayoutVolume", "usdtPurchaseVolume", "usdtInvestmentVolume", "totalVolume")
          VALUES (
            ${currentCycle.id},
            ${sellerAssignment.salesRepId},
            ${transaction.sellerId},
            ${volumeData.pixPayinVolume},
            ${volumeData.pixPayoutVolume},
            ${volumeData.usdtPurchaseVolume},
            ${volumeData.usdtInvestmentVolume},
            ${transaction.amount}
          )
        `;

        console.log(`Created new period earning for sales rep ${sellerAssignment.salesRepId}, seller ${transaction.sellerId}`);
      }

    } catch (error) {
      console.error('Error processing transaction volume:', error);
      throw error;
    }
  }

  // Calculate commissions for a specific cycle
  async calculateCycleCommissions(cycleId: string): Promise<void> {
    try {
      // Get all period earnings for this cycle
      const periodEarnings = await prisma.$queryRaw`
        SELECT * FROM "CommissionPeriodEarning"
        WHERE "cycleId" = ${cycleId}
      `;

      if (!Array.isArray(periodEarnings) || periodEarnings.length === 0) {
        console.log('No period earnings found for cycle:', cycleId);
        return;
      }

      for (const earning of periodEarnings) {
        // Get commission rules for this sales rep
        const commissionRules = await prisma.commissionRule.findMany({
          where: {
            salesRepId: earning.salesRepId,
            isActive: true
          }
        });

        let totalCommission = 0;
        const commissionByType = {
          pixPayinCommission: 0,
          pixPayoutCommission: 0,
          usdtPurchaseCommission: 0,
          usdtInvestmentCommission: 0
        };

        // Calculate commission for each transaction type
        for (const rule of commissionRules) {
          const rate = rule.percentage.toNumber();

          switch (rule.transactionType) {
            case 'PIX_PAYIN':
              commissionByType.pixPayinCommission = earning.pixPayinVolume * rate;
              break;
            case 'PIX_PAYOUT':
              commissionByType.pixPayoutCommission = earning.pixPayoutVolume * rate;
              break;
            case 'USDT_PURCHASE':
              commissionByType.usdtPurchaseCommission = earning.usdtPurchaseVolume * rate;
              break;
            case 'USDT_INVESTMENT':
              commissionByType.usdtInvestmentCommission = earning.usdtInvestmentVolume * rate;
              break;
          }
        }

        totalCommission = Object.values(commissionByType).reduce((sum, amount) => sum + amount, 0);

        // Update the period earning with calculated commissions
        await prisma.$executeRaw`
          UPDATE "CommissionPeriodEarning"
          SET "pixPayinCommission" = ${commissionByType.pixPayinCommission},
              "pixPayoutCommission" = ${commissionByType.pixPayoutCommission},
              "usdtPurchaseCommission" = ${commissionByType.usdtPurchaseCommission},
              "usdtInvestmentCommission" = ${commissionByType.usdtInvestmentCommission},
              "totalCommission" = ${totalCommission},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${earning.id}
        `;

        console.log(`Calculated commission for sales rep ${earning.salesRepId}: ${totalCommission}`);
      }

      // Mark cycle as processing
      await prisma.$executeRaw`
        UPDATE "CommissionCycle"
        SET "status" = 'PROCESSING',
            "processingDate" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${cycleId}
      `;

      console.log(`Commission calculation completed for cycle: ${cycleId}`);

    } catch (error) {
      console.error('Error calculating cycle commissions:', error);
      throw error;
    }
  }

  // Complete a cycle (mark as COMPLETED)
  async completeCycle(cycleId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE "CommissionCycle"
        SET "status" = 'COMPLETED',
            "completedDate" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${cycleId}
      `;

      console.log(`Cycle completed: ${cycleId}`);
    } catch (error) {
      console.error('Error completing cycle:', error);
      throw error;
    }
  }

  // Get sales rep performance for a cycle
  async getSalesRepCyclePerformance(salesRepId: string, cycleId?: string) {
    let whereClause = `"salesRepId" = '${salesRepId}'`;

    if (cycleId) {
      whereClause += ` AND "cycleId" = '${cycleId}'`;
    }

    const earnings = await prisma.$queryRaw`
      SELECT
        cpe.*,
        cc."cycleType",
        cc."startDate",
        cc."endDate",
        cc."status" as cycleStatus,
        u."name" as sellerName,
        u."email" as sellerEmail,
        u."companyName" as sellerCompanyName
      FROM "CommissionPeriodEarning" cpe
      JOIN "CommissionCycle" cc ON cpe."cycleId" = cc."id"
      LEFT JOIN "User" u ON cpe."sellerId" = u."id"
      WHERE ${whereClause}
      ORDER BY cc."startDate" DESC
    `;

    return earnings;
  }

  // Get overall commission stats
  async getCommissionStats(salesRepId?: string) {
    let whereClause = '';

    if (salesRepId) {
      whereClause = `WHERE cpe."salesRepId" = '${salesRepId}'`;
    }

    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int as totalRecords,
        COALESCE(SUM(cpe."totalCommission"), 0)::decimal as totalEarnings,
        COALESCE(SUM(CASE WHEN cpe."isPaid" = true THEN cpe."totalCommission" ELSE 0 END), 0)::decimal as paidEarnings,
        COALESCE(SUM(CASE WHEN cpe."isPaid" = false THEN cpe."totalCommission" ELSE 0 END), 0)::decimal as pendingEarnings,
        COALESCE(SUM(cpe."totalVolume"), 0)::decimal as totalVolume
      FROM "CommissionPeriodEarning" cpe
      ${whereClause}
    `;

    const result = Array.isArray(stats) && stats.length > 0 ? stats[0] : {
      totalRecords: 0,
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      totalVolume: 0
    };

    return {
      totalRecords: parseInt(result.totalRecords) || 0,
      totalEarnings: parseFloat(result.totalEarnings) || 0,
      paidEarnings: parseFloat(result.paidEarnings) || 0,
      pendingEarnings: parseFloat(result.pendingEarnings) || 0,
      totalVolume: parseFloat(result.totalVolume) || 0
    };
  }

  // Mark period earnings as paid
  async markPeriodEarningAsPaid(periodEarningId: string, paymentReference?: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE "CommissionPeriodEarning"
        SET "isPaid" = true,
            "paidAt" = CURRENT_TIMESTAMP,
            "paymentReference" = ${paymentReference || null},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${periodEarningId}
      `;

      console.log(`Period earning marked as paid: ${periodEarningId}`);
    } catch (error) {
      console.error('Error marking period earning as paid:', error);
      throw error;
    }
  }

  // Get current active cycles
  async getActiveCycles() {
    const cycles = await prisma.$queryRaw`
      SELECT * FROM "CommissionCycle"
      WHERE "status" IN ('ACTIVE', 'PROCESSING')
      ORDER BY "startDate" DESC
    `;

    return cycles;
  }

  // Auto-create cycles for missing periods
  async createMissingCycles(cycleType: 'WEEKLY' | 'MONTHLY' = 'WEEKLY'): Promise<void> {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (cycleType === 'WEEKLY') {
        // Create cycle for current week (Monday to Sunday)
        const today = new Date(now);
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

        startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Create cycle for current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      // Check if cycle already exists
      const existingCycle = await prisma.$queryRaw`
        SELECT * FROM "CommissionCycle"
        WHERE "startDate" = ${startDate}
        AND "endDate" = ${endDate}
        AND "cycleType" = ${cycleType}
        LIMIT 1
      `;

      if (!Array.isArray(existingCycle) || existingCycle.length === 0) {
        await this.createCommissionCycle({
          cycleType,
          startDate,
          endDate
        });

        console.log(`Created missing ${cycleType} cycle: ${startDate} to ${endDate}`);
      }

    } catch (error) {
      console.error('Error creating missing cycles:', error);
      throw error;
    }
  }
}

export const commissionService = new CommissionService();