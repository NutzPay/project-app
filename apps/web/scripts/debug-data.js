// Script to debug users and acquirers
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugData() {
  console.log('🔍 Debugging users and acquirers data...\n');

  try {
    // Check all users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${users.length} total users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.status}) - ${user.id.substring(0,8)}...`);
    });

    // Check all payment acquirers
    console.log('\n💳 PAYMENT ACQUIRERS:');
    const acquirers = await prisma.paymentAcquirer.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${acquirers.length} total acquirers:`);
    acquirers.forEach(acq => {
      console.log(`  - ${acq.name} (${acq.slug}) - ${acq.type} - ${acq.status}`);
    });

    // Check user-acquirer assignments
    console.log('\n🔗 USER-ACQUIRER ASSIGNMENTS:');
    const assignments = await prisma.userAcquirer.findMany({
      include: {
        user: { select: { email: true } },
        acquirer: { select: { name: true, type: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${assignments.length} total assignments:`);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.user.email} → ${assignment.acquirer.name} (${assignment.acquirer.type}) - ${assignment.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });

    console.log('\n✅ Debug completed!');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  debugData().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { debugData };