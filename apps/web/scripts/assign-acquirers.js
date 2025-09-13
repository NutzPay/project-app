// Script to assign payment acquirers to users
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignAcquirers() {
  console.log('🔄 Assigning payment acquirers to users...');

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' }
    });

    console.log(`👥 Found ${users.length} active users`);

    // Get all active payment acquirers
    const acquirers = await prisma.paymentAcquirer.findMany({
      where: { status: 'ACTIVE' }
    });

    console.log(`💳 Found ${acquirers.length} active payment acquirers`);

    // Assign all acquirers to all users
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);

      for (const acquirer of acquirers) {
        // Check if assignment already exists
        const existingAssignment = await prisma.userAcquirer.findFirst({
          where: {
            userId: user.id,
            acquirerId: acquirer.id
          }
        });

        if (!existingAssignment) {
          // Create new assignment
          await prisma.userAcquirer.create({
            data: {
              userId: user.id,
              acquirerId: acquirer.id,
              priority: acquirer.type === 'PIX' ? 10 : 5, // PIX gets higher priority
              dailyLimit: 10000, // R$ 10,000 daily limit
              monthlyLimit: 100000, // R$ 100,000 monthly limit
              isActive: true
            }
          });

          console.log(`  ✅ Assigned ${acquirer.name} (${acquirer.type}) to ${user.email}`);
        } else {
          console.log(`  ⚠️  ${acquirer.name} already assigned to ${user.email}`);
        }
      }
    }

    // Show summary
    const totalAssignments = await prisma.userAcquirer.count({
      where: { isActive: true }
    });

    console.log('\n📊 Summary:');
    console.log(`Total active assignments: ${totalAssignments}`);

    // Show assignments by user
    const assignmentsByUser = await prisma.userAcquirer.groupBy({
      by: ['userId'],
      where: { isActive: true },
      _count: { id: true }
    });

    for (const assignment of assignmentsByUser) {
      const user = await prisma.user.findUnique({
        where: { id: assignment.userId },
        select: { email: true }
      });
      console.log(`👤 ${user?.email}: ${assignment._count.id} acquirers`);
    }

    console.log('\n✅ Acquirer assignment completed successfully!');

  } catch (error) {
    console.error('❌ Error assigning acquirers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  assignAcquirers().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { assignAcquirers };