const { PrismaClient } = require('@prisma/client');

async function initializeCycles() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Initializing commission cycles...');

    // Get current date
    const now = new Date();

    // Create current week cycle (Monday to Sunday)
    const today = new Date(now);
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysToMonday);
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Create current month cycle
    const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log(`Week cycle: ${weekStartDate} to ${weekEndDate}`);
    console.log(`Month cycle: ${monthStartDate} to ${monthEndDate}`);

    // Check if weekly cycle already exists
    const existingWeeklyCycle = await prisma.$queryRaw`
      SELECT * FROM "CommissionCycle"
      WHERE "startDate" = ${weekStartDate}
      AND "endDate" = ${weekEndDate}
      AND "cycleType" = 'WEEKLY'
      LIMIT 1
    `;

    if (!Array.isArray(existingWeeklyCycle) || existingWeeklyCycle.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO "CommissionCycle" ("cycleType", "startDate", "endDate", "status")
        VALUES ('WEEKLY', ${weekStartDate}, ${weekEndDate}, 'ACTIVE')
      `;
      console.log('✅ Created weekly commission cycle');
    } else {
      console.log('⚠️ Weekly cycle already exists');
    }

    // Check if monthly cycle already exists
    const existingMonthlyCycle = await prisma.$queryRaw`
      SELECT * FROM "CommissionCycle"
      WHERE "startDate" = ${monthStartDate}
      AND "endDate" = ${monthEndDate}
      AND "cycleType" = 'MONTHLY'
      LIMIT 1
    `;

    if (!Array.isArray(existingMonthlyCycle) || existingMonthlyCycle.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO "CommissionCycle" ("cycleType", "startDate", "endDate", "status")
        VALUES ('MONTHLY', ${monthStartDate}, ${monthEndDate}, 'ACTIVE')
      `;
      console.log('✅ Created monthly commission cycle');
    } else {
      console.log('⚠️ Monthly cycle already exists');
    }

    // List all current cycles
    console.log('🔍 Current active cycles:');
    const activeCycles = await prisma.$queryRaw`
      SELECT * FROM "CommissionCycle"
      WHERE "status" = 'ACTIVE'
      ORDER BY "startDate" DESC
    `;

    for (const cycle of activeCycles) {
      console.log(`  - ${cycle.cycleType}: ${cycle.startDate} to ${cycle.endDate} (${cycle.id})`);
    }

    console.log('🎉 Commission cycles initialization completed!');

  } catch (error) {
    console.error('❌ Failed to initialize commission cycles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeCycles()
    .then(() => {
      console.log('🏁 Cycles initialization script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cycles initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeCycles };