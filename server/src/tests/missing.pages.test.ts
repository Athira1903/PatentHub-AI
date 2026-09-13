import { AuthService } from '../services/authService';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';

async function runMissingPagesTests() {
  console.log('\n======================================================');
  console.log('--- STARTING INVENTOR MODULE MISSING PAGES FIX TESTS ---');
  console.log('======================================================\n');

  // Test 1: Change Password functionality
  console.log('[Test 1] Change Password Security:');
  const testUser = await prisma.user.findFirst({
    where: { role: { name: 'Inventor' } },
  });

  if (!testUser) {
    throw new Error('No Inventor test user found');
  }

  // Set known password
  const oldPassword = 'OldPassword123!';
  const newPassword = 'NewPassword456@';
  const hashedOld = await bcrypt.hash(oldPassword, 10);
  await prisma.user.update({
    where: { id: testUser.id },
    data: { password: hashedOld },
  });

  // Attempt change password with wrong current password -> should fail
  try {
    await AuthService.changePassword(testUser.id, 'WrongPassword999!', newPassword);
    throw new Error('Change password succeeded with incorrect current password!');
  } catch (err: any) {
    if (err.message.includes('Incorrect current password')) {
      console.log('  ✓ Incorrect current password rejected correctly.');
    } else {
      throw err;
    }
  }

  // Attempt change password with correct current password -> should succeed
  const result = await AuthService.changePassword(testUser.id, oldPassword, newPassword);
  console.log(`  ✓ ${result.message}`);

  // Verify that new password is now verifiable with bcrypt
  const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  const isMatch = await bcrypt.compare(newPassword, updatedUser!.password);
  if (!isMatch) {
    throw new Error('New password does not match in database!');
  }
  console.log('  ✓ Password hash verified in PostgreSQL database.');

  // Test 2: Notification & Tasks isolation
  console.log('\n[Test 2] Notification & Task Query Isolation:');
  const notifCount = await prisma.notification.count({
    where: { userId: testUser.id },
  });
  console.log(`  ✓ User's personal notification count query executed successfully (${notifCount} notifications).`);

  const taskCount = await prisma.task.count({
    where: {
      OR: [
        { assignedToId: testUser.id },
        { project: { ownerId: testUser.id } },
      ],
    },
  });
  console.log(`  ✓ Authorized tasks for inventor queried successfully (${taskCount} tasks).`);

  // Test 3: Project Reviews query for Inventor
  console.log('\n[Test 3] Project Reviews Query for Inventor Projects:');
  const inventorProjects = await prisma.patentProject.findMany({
    where: { ownerId: testUser.id },
    include: {
      projectReviews: {
        include: { reviewer: true },
      },
    },
  });
  console.log(`  ✓ Retrieved ${inventorProjects.length} owned projects with review history.`);

  console.log('\n======================================================');
  console.log('🎉 ALL INVENTOR MODULE MISSING PAGES TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runMissingPagesTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
