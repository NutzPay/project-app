const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function createCommercialTables() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting commercial tables creation...');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'create-commercial-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing full SQL script...');

    try {
      // Execute the entire SQL content as one command
      await prisma.$executeRawUnsafe(sqlContent);
      console.log('✅ SQL script executed successfully!');
    } catch (error) {
      console.error(`❌ Error executing SQL: ${error.message}`);
      // Continue to verification anyway
    }

    console.log('🎉 Commercial tables creation completed!');

    // Verify tables exist
    console.log('🔍 Verifying table creation...');

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

    // Verify enums exist
    console.log('🔍 Verifying enum creation...');

    const enums = ['SalesRepStatus', 'CommissionType'];

    for (const enumName of enums) {
      try {
        const result = await prisma.$queryRaw`
          SELECT typname
          FROM pg_type
          WHERE typname = ${enumName}
        `;

        if (result.length > 0) {
          console.log(`  ✅ Enum ${enumName} exists`);
        } else {
          console.log(`  ❌ Enum ${enumName} not found`);
        }
      } catch (error) {
        console.log(`  ❌ Error checking enum ${enumName}: ${error.message}`);
      }
    }

    console.log('✅ Commercial team database setup completed!');

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
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCommercialTables };