const { PrismaClient } = require('@prisma/client');

async function createCommissionCycles() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting commission cycles creation...');

    // Commission Cycle Type enum
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionCycleType') THEN
                CREATE TYPE "CommissionCycleType" AS ENUM ('WEEKLY', 'MONTHLY');
            END IF;
        END
        $$;
      `;
      console.log('✅ CommissionCycleType enum created/verified');
    } catch (error) {
      console.log('⚠️ CommissionCycleType enum error:', error.message);
    }

    // Commission Cycle Status enum
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionCycleStatus') THEN
                CREATE TYPE "CommissionCycleStatus" AS ENUM ('ACTIVE', 'PROCESSING', 'COMPLETED', 'PAID');
            END IF;
        END
        $$;
      `;
      console.log('✅ CommissionCycleStatus enum created/verified');
    } catch (error) {
      console.log('⚠️ CommissionCycleStatus enum error:', error.message);
    }

    // Commission Cycles table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "CommissionCycle" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
            "cycleType" "CommissionCycleType" NOT NULL,
            "status" "CommissionCycleStatus" NOT NULL DEFAULT 'ACTIVE',
            "startDate" TIMESTAMP(3) NOT NULL,
            "endDate" TIMESTAMP(3) NOT NULL,
            "processingDate" TIMESTAMP(3),
            "completedDate" TIMESTAMP(3),
            "paidDate" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "CommissionCycle_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ CommissionCycle table created');
    } catch (error) {
      console.log('⚠️ CommissionCycle table error:', error.message);
    }

    // Commission Period Earnings table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "CommissionPeriodEarning" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
            "cycleId" TEXT NOT NULL,
            "salesRepId" TEXT NOT NULL,
            "sellerId" TEXT NOT NULL,

            -- Volume totals by transaction type in the period
            "pixPayinVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "pixPayoutVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "usdtPurchaseVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "usdtInvestmentVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,

            -- Commission amounts by transaction type
            "pixPayinCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "pixPayoutCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "usdtPurchaseCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "usdtInvestmentCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,

            -- Totals
            "totalVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "totalCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,

            "isPaid" BOOLEAN NOT NULL DEFAULT false,
            "paidAt" TIMESTAMP(3),
            "paymentReference" TEXT,
            "notes" TEXT,

            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "CommissionPeriodEarning_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ CommissionPeriodEarning table created');
    } catch (error) {
      console.log('⚠️ CommissionPeriodEarning table error:', error.message);
    }

    // Create indexes
    console.log('🔍 Creating indexes...');

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionCycle_dates_idx') THEN
                CREATE INDEX "CommissionCycle_dates_idx" ON "CommissionCycle"("startDate", "endDate");
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionCycle dates index created');
    } catch (error) {
      console.log('  ⚠️ CommissionCycle dates index error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionCycle_status_idx') THEN
                CREATE INDEX "CommissionCycle_status_idx" ON "CommissionCycle"("status");
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionCycle status index created');
    } catch (error) {
      console.log('  ⚠️ CommissionCycle status index error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_cycle_idx') THEN
                CREATE INDEX "CommissionPeriodEarning_cycle_idx" ON "CommissionPeriodEarning"("cycleId");
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning cycle index created');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning cycle index error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_salesRep_idx') THEN
                CREATE INDEX "CommissionPeriodEarning_salesRep_idx" ON "CommissionPeriodEarning"("salesRepId");
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning salesRep index created');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning salesRep index error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_seller_idx') THEN
                CREATE INDEX "CommissionPeriodEarning_seller_idx" ON "CommissionPeriodEarning"("sellerId");
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning seller index created');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning seller index error:', error.message);
    }

    // Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_cycleId_fkey') THEN
                ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CommissionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning cycleId foreign key added');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning cycleId foreign key error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_salesRepId_fkey') THEN
                ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning salesRepId foreign key added');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning salesRepId foreign key error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_sellerId_fkey') THEN
                ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END
        $$;
      `;
      console.log('  ✅ CommissionPeriodEarning sellerId foreign key added');
    } catch (error) {
      console.log('  ⚠️ CommissionPeriodEarning sellerId foreign key error:', error.message);
    }

    console.log('🎉 Commission cycles database setup completed successfully!');

  } catch (error) {
    console.error('❌ Failed to create commission cycles tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createCommissionCycles()
    .then(() => {
      console.log('🏁 Commission cycles script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Commission cycles script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCommissionCycles };