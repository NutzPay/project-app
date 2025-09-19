-- Add Commission Cycle enums and tables

-- Commission Cycle Type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionCycleType') THEN
        CREATE TYPE "CommissionCycleType" AS ENUM ('WEEKLY', 'MONTHLY');
    END IF;
END
$$;

-- Commission Cycle Status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionCycleStatus') THEN
        CREATE TYPE "CommissionCycleStatus" AS ENUM ('ACTIVE', 'PROCESSING', 'COMPLETED', 'PAID');
    END IF;
END
$$;

-- Commission Cycles table
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

-- Commission Period Earnings table (replaces individual transaction commissions)
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

-- Create indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionCycle_dates_idx') THEN
        CREATE INDEX "CommissionCycle_dates_idx" ON "CommissionCycle"("startDate", "endDate");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionCycle_status_idx') THEN
        CREATE INDEX "CommissionCycle_status_idx" ON "CommissionCycle"("status");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_cycle_idx') THEN
        CREATE INDEX "CommissionPeriodEarning_cycle_idx" ON "CommissionPeriodEarning"("cycleId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_salesRep_idx') THEN
        CREATE INDEX "CommissionPeriodEarning_salesRep_idx" ON "CommissionPeriodEarning"("salesRepId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionPeriodEarning_seller_idx') THEN
        CREATE INDEX "CommissionPeriodEarning_seller_idx" ON "CommissionPeriodEarning"("sellerId");
    END IF;
END
$$;

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_cycleId_fkey') THEN
        ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CommissionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_salesRepId_fkey') THEN
        ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionPeriodEarning_sellerId_fkey') THEN
        ALTER TABLE "CommissionPeriodEarning" ADD CONSTRAINT "CommissionPeriodEarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;