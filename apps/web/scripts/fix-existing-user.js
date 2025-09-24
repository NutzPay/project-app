// Script to assign acquirers to existing user
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingUser() {
  console.log('🔧 Assigning acquirers to existing users...\n');

  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, status: true }
    });
    
    console.log('👥 Found users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.status})`);
    });

    // Get all active payment acquirers
    const acquirers = await prisma.paymentAcquirer.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, type: true, status: true }
    });
    
    console.log('\n💳 Active acquirers:');
    acquirers.forEach(acq => {
      console.log(`  - ${acq.name} (${acq.type}) - ${acq.status}`);
    });

    // Assign acquirers to all users
    for (const user of users) {
      console.log(`\n🔗 Processing user: ${user.email}`);
      
      for (const acquirer of acquirers) {
        // Check if assignment already exists
        const existingAssignment = await prisma.userAcquirer.findFirst({
          where: { userId: user.id, acquirerId: acquirer.id }
        });
        
        if (!existingAssignment) {
          await prisma.userAcquirer.create({
            data: {
              userId: user.id,
              acquirerId: acquirer.id,
              priority: acquirer.type === 'PIX' ? 10 : 5,
              dailyLimit: 50000, // R$ 50,000 daily limit
              monthlyLimit: 500000, // R$ 500,000 monthly limit
              isActive: true
            }
          });
          console.log(`  ✅ Assigned ${acquirer.name} (${acquirer.type})`);
        } else {
          // Update existing to make sure it's active
          await prisma.userAcquirer.update({
            where: { id: existingAssignment.id },
            data: { 
              isActive: true,
              priority: acquirer.type === 'PIX' ? 10 : 5,
              dailyLimit: 50000,
              monthlyLimit: 500000
            }
          });
          console.log(`  🔄 Updated ${acquirer.name} (${acquirer.type})`);
        }
      }
    }

    // Show final summary
    console.log('\n📊 FINAL ASSIGNMENTS:');
    const assignments = await prisma.userAcquirer.findMany({
      where: { isActive: true },
      include: {
        user: { select: { email: true } },
        acquirer: { select: { name: true, type: true } }
      }
    });
    
    assignments.forEach(assignment => {
      console.log(`  ${assignment.user.email} → ${assignment.acquirer.name} (${assignment.acquirer.type})`);
    });

    console.log(`\n✅ Total active assignments: ${assignments.length}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixExistingUser().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { fixExistingUser };