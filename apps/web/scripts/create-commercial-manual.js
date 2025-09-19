const { PrismaClient } = require('@prisma/client');

async function createCommercialTables() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting commercial tables creation manually...');

    // Create SalesRepStatus enum if not exists
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SalesRepStatus') THEN
                CREATE TYPE "SalesRepStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
            END IF;
        END
        $$;
      `;
      console.log('✅ SalesRepStatus enum created/verified');
    } catch (error) {
      console.log('⚠️ SalesRepStatus enum error:', error.message);
    }

    // Create CommissionType enum if not exists
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionType') THEN
                CREATE TYPE "CommissionType" AS ENUM ('PIX_PAYIN', 'PIX_PAYOUT', 'USDT_PURCHASE', 'USDT_INVESTMENT');
            END IF;
        END
        $$;
      `;
      console.log('✅ CommissionType enum created/verified');
    } catch (error) {
      console.log('⚠️ CommissionType enum error:', error.message);
    }

    // Create SalesRep table
    try {
      await prisma.$executeRaw`
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
      `;
      console.log('✅ SalesRep table created');
    } catch (error) {
      console.log('⚠️ SalesRep table error:', error.message);
    }

    // Create CommissionRule table
    try {
      await prisma.$executeRaw`
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
      `;
      console.log('✅ CommissionRule table created');
    } catch (error) {
      console.log('⚠️ CommissionRule table error:', error.message);
    }

    // Create SellerAssignment table
    try {
      await prisma.$executeRaw`
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
      `;
      console.log('✅ SellerAssignment table created');
    } catch (error) {
      console.log('⚠️ SellerAssignment table error:', error.message);
    }

    // Create CommissionEarning table
    try {
      await prisma.$executeRaw`
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
      `;
      console.log('✅ CommissionEarning table created');
    } catch (error) {
      console.log('⚠️ CommissionEarning table error:', error.message);
    }

    // Create indexes
    console.log('🔍 Creating indexes...');
    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "SalesRep_email_key" ON "SalesRep"("email")',
      'CREATE INDEX IF NOT EXISTS "CommissionRule_salesRepId_idx" ON "CommissionRule"("salesRepId")',
      'CREATE INDEX IF NOT EXISTS "SellerAssignment_salesRepId_idx" ON "SellerAssignment"("salesRepId")',
      'CREATE INDEX IF NOT EXISTS "SellerAssignment_sellerId_idx" ON "SellerAssignment"("sellerId")',
      'CREATE INDEX IF NOT EXISTS "CommissionEarning_salesRepId_idx" ON "CommissionEarning"("salesRepId")',
      'CREATE INDEX IF NOT EXISTS "CommissionEarning_sellerId_idx" ON "CommissionEarning"("sellerId")',
      'CREATE INDEX IF NOT EXISTS "CommissionEarning_transactionId_idx" ON "CommissionEarning"("transactionId")'
    ];

    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        console.log(`  ✅ Index created`);
      } catch (error) {
        console.log(`  ⚠️ Index error: ${error.message}`);
      }
    }

    // Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');

    const constraints = [
      'ALTER TABLE "CommissionRule" ADD CONSTRAINT IF NOT EXISTS "CommissionRule_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "SellerAssignment" ADD CONSTRAINT IF NOT EXISTS "SellerAssignment_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "SellerAssignment" ADD CONSTRAINT IF NOT EXISTS "SellerAssignment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "CommissionEarning" ADD CONSTRAINT IF NOT EXISTS "CommissionEarning_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
      'ALTER TABLE "CommissionEarning" ADD CONSTRAINT IF NOT EXISTS "CommissionEarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    ];

    for (const constraintSql of constraints) {
      try {
        await prisma.$executeRawUnsafe(constraintSql);
        console.log(`  ✅ Foreign key added`);
      } catch (error) {
        console.log(`  ⚠️ Foreign key error: ${error.message}`);
      }
    }

    // Verify tables exist
    console.log('🔍 Final verification...');
    const tables = ['SalesRep', 'CommissionRule', 'SellerAssignment', 'CommissionEarning'];

    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        `;

        if (result.length > 0) {
          console.log(`  ✅ Table ${table} exists`);
        } else {
          console.log(`  ❌ Table ${table} not found`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking table ${table}: ${error.message}`);
      }
    }

    console.log('🎉 Commercial team database setup completed successfully!');

  } catch (error) {
    console.error('❌ Failed to create commercial tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createCommercialTables()
    .then(() => {
      console.log('🏁 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCommercialTables };