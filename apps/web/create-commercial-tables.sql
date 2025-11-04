-- Create enums first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SalesRepStatus') THEN
        CREATE TYPE "SalesRepStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionType') THEN
        CREATE TYPE "CommissionType" AS ENUM ('PIX_PAYIN', 'PIX_PAYOUT', 'USDT_PURCHASE', 'USDT_INVESTMENT');
    END IF;
END
$$;

-- Create SalesRep table
CREATE TABLE IF NOT EXISTS "SalesRep" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "SalesRepStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "monthlyTarget" DECIMAL(65,30),
    "territoryArea" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRep_pkey" PRIMARY KEY ("id")
);

-- Create CommissionRule table
CREATE TABLE IF NOT EXISTS "CommissionRule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "salesRepId" TEXT NOT NULL,
    "transactionType" "CommissionType" NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- Create SellerAssignment table
CREATE TABLE IF NOT EXISTS "SellerAssignment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "salesRepId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerAssignment_pkey" PRIMARY KEY ("id")
);

-- Create CommissionEarning table
CREATE TABLE IF NOT EXISTS "CommissionEarning" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "salesRepId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionType" "CommissionType" NOT NULL,
    "transactionAmount" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionEarning_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SalesRep_email_key') THEN
        CREATE UNIQUE INDEX "SalesRep_email_key" ON "SalesRep"("email");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionRule_salesRepId_idx') THEN
        CREATE INDEX "CommissionRule_salesRepId_idx" ON "CommissionRule"("salesRepId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SellerAssignment_salesRepId_idx') THEN
        CREATE INDEX "SellerAssignment_salesRepId_idx" ON "SellerAssignment"("salesRepId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SellerAssignment_sellerId_idx') THEN
        CREATE INDEX "SellerAssignment_sellerId_idx" ON "SellerAssignment"("sellerId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionEarning_salesRepId_idx') THEN
        CREATE INDEX "CommissionEarning_salesRepId_idx" ON "CommissionEarning"("salesRepId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionEarning_sellerId_idx') THEN
        CREATE INDEX "CommissionEarning_sellerId_idx" ON "CommissionEarning"("sellerId");
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CommissionEarning_transactionId_idx') THEN
        CREATE INDEX "CommissionEarning_transactionId_idx" ON "CommissionEarning"("transactionId");
    END IF;
END
$$;

-- Add foreign key constraints with error handling
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionRule_salesRepId_fkey') THEN
        ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'SellerAssignment_salesRepId_fkey') THEN
        ALTER TABLE "SellerAssignment" ADD CONSTRAINT "SellerAssignment_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'SellerAssignment_sellerId_fkey') THEN
        ALTER TABLE "SellerAssignment" ADD CONSTRAINT "SellerAssignment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionEarning_salesRepId_fkey') THEN
        ALTER TABLE "CommissionEarning" ADD CONSTRAINT "CommissionEarning_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CommissionEarning_sellerId_fkey') THEN
        ALTER TABLE "CommissionEarning" ADD CONSTRAINT "CommissionEarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;