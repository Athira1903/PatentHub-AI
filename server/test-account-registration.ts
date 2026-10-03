import { prisma } from './src/config/db';
import { AuthService } from './src/services/authService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING ACCOUNT REGISTRATION (INDIVIDUAL vs ORGANIZATION) TESTS');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // Test 1: Individual Registration Flow
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Individual Registration Flow ---');
    const indEmail = `ind_${timestamp}@example.com`;
    const indReg = await AuthService.register({
      accountType: 'INDIVIDUAL',
      fullName: 'Alice Individual',
      email: indEmail,
      phone: '9876543210',
      userType: 'Inventor',
      institution: 'Independent Lab',
      department: 'R&D',
      designation: 'Researcher',
    });

    assert(!!indReg.user.id, 'Individual user registered successfully');
    assert(indReg.user.accountType === 'INDIVIDUAL', 'User accountType is INDIVIDUAL');
    assert(indReg.user.organizationId === null, 'User organizationId is null');
    assert(indReg.user.role === 'Inventor', 'User role is Inventor');

    // Fetch user from DB to check OTP
    const indDbUser = await prisma.user.findUnique({
      where: { email: indEmail },
    });
    assert(!!indDbUser?.activationOtp, 'Activation OTP generated for individual user');

    // Activate Account
    const indActivated = await AuthService.activateAccount({
      username: indDbUser!.username,
      otp: indDbUser!.activationOtp!,
      newPassword: 'Password@123',
    });
    assert(indActivated.user.accountType === 'INDIVIDUAL', 'Activated user has accountType INDIVIDUAL');
    assert(indActivated.user.organizationId === null, 'Activated user has null organizationId');
    assert(indActivated.user.organization === null, 'Activated user has null organization context');

    // Login
    const indLoginRes = await AuthService.login({
      emailOrUsername: indEmail,
      password: 'Password@123',
    });
    assert(!!indLoginRes.token, 'JWT issued immediately upon password login without OTP');
    assert(indLoginRes.user.accountType === 'INDIVIDUAL', 'Login returns accountType INDIVIDUAL');
    assert(indLoginRes.user.organization === null, 'Login returns null organization');

    const decodedInd: any = jwt.verify(indLoginRes.token, process.env.JWT_SECRET || 'patenthub_secret');
    assert(decodedInd.accountType === 'INDIVIDUAL', 'JWT token payload contains accountType INDIVIDUAL');
    assert(decodedInd.organizationId === null, 'JWT token payload contains null organizationId');

    // -------------------------------------------------------------
    // Test 2: Organization Registration Flow
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Organization Registration Flow ---');
    const orgEmail = `guide_${timestamp}@ajce.in`;
    const orgName = `Amal Jyothi College of Engineering ${timestamp}`;
    const orgReg = await AuthService.register({
      accountType: 'ORGANIZATION',
      organizationName: orgName,
      organizationType: 'UNIVERSITY',
      organizationDomain: 'ajce.in',
      fullName: 'Dr. Arun Guide',
      email: orgEmail,
      phone: '9876543211',
      userType: 'Guide',
      department: 'Computer Science and Engineering',
      designation: 'Associate Professor',
    });

    assert(!!orgReg.user.id, 'Organization user registered successfully');
    assert(orgReg.user.accountType === 'ORGANIZATION', 'User accountType is ORGANIZATION');
    assert(!!orgReg.user.organizationId, 'User organizationId is populated');
    assert(orgReg.user.role === 'Guide', 'User role is Guide');
    assert(orgReg.user.organization?.name === orgName, 'User is linked to the created Organization');

    // Verify Organization in DB
    const dbOrg = await prisma.organization.findUnique({
      where: { id: orgReg.user.organizationId! },
      include: { users: true },
    });
    assert(!!dbOrg, 'Organization record exists in database');
    assert(dbOrg!.users.some(u => u.id === orgReg.user.id), 'Organization users relation includes the registered user');

    // Fetch user for activation OTP
    const orgDbUser = await prisma.user.findUnique({
      where: { email: orgEmail },
    });

    // Activate Account
    const orgActivated = await AuthService.activateAccount({
      username: orgDbUser!.username,
      otp: orgDbUser!.activationOtp!,
      newPassword: 'Password@123',
    });
    assert(orgActivated.user.accountType === 'ORGANIZATION', 'Activated user has accountType ORGANIZATION');
    assert(orgActivated.user.organizationId === dbOrg!.id, 'Activated user has correct organizationId');
    assert(orgActivated.user.organization?.name === orgName, 'Activated user receives organization context');

    // Direct password login for Organization user
    const orgLoginRes = await AuthService.login({
      emailOrUsername: orgEmail,
      password: 'Password@123',
    });
    assert(!!orgLoginRes.token, 'JWT issued immediately upon org password login without OTP');
    assert(orgLoginRes.user.accountType === 'ORGANIZATION', 'Org login returns accountType ORGANIZATION');
    assert(orgLoginRes.user.organization?.id === dbOrg!.id, 'Org login returns organization object');
    assert(orgLoginRes.user.role === 'Guide', 'Org user role remains Guide');

    const decodedOrg: any = jwt.verify(orgLoginRes.token, process.env.JWT_SECRET || 'patenthub_secret');
    assert(decodedOrg.accountType === 'ORGANIZATION', 'JWT token payload contains accountType ORGANIZATION');
    assert(decodedOrg.organizationId === dbOrg!.id, 'JWT token payload contains organizationId');

    // -------------------------------------------------------------
    // Test 3: Multiple Users under Same Organization (Deduplication)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Multiple Users Under Same Organization ---');
    const secondUserEmail = `expert_${timestamp}@ajce.in`;
    const secondReg = await AuthService.register({
      accountType: 'ORGANIZATION',
      organizationName: orgName, // Exact same organization name
      fullName: 'Dr. Suresh Patent Expert',
      email: secondUserEmail,
      phone: '9876543212',
      userType: 'PatentExpert',
      department: 'IPR Cell',
      designation: 'Patent Counsel',
    });

    assert(secondReg.user.organizationId === dbOrg!.id, 'Second user was attached to existing Organization (no duplication)');
    assert(secondReg.user.role === 'PatentExpert', 'Second user assigned role PatentExpert');

    // Verify Organization has multiple users now
    const updatedOrg = await prisma.organization.findUnique({
      where: { id: dbOrg!.id },
      include: { users: true },
    });
    assert(updatedOrg!.users.length >= 2, `Organization now has ${updatedOrg!.users.length} associated users`);

    // -------------------------------------------------------------
    // Test 4: Role & Account Type Decoupling
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Role & Account Type Decoupling ---');
    // Organization + Inventor
    const studentOrgEmail = `student_${timestamp}@ajce.in`;
    const studentOrgReg = await AuthService.register({
      accountType: 'ORGANIZATION',
      organizationName: orgName,
      fullName: 'Student Inventor',
      email: studentOrgEmail,
      phone: '9876543213',
      userType: 'Inventor',
      department: 'CSE',
      designation: 'Student',
    });
    assert(studentOrgReg.user.accountType === 'ORGANIZATION' && studentOrgReg.user.role === 'Inventor',
      'Organization + Inventor is valid and decoupled');

    // Individual + Guide
    const indGuideEmail = `ind_guide_${timestamp}@example.com`;
    const indGuideReg = await AuthService.register({
      accountType: 'INDIVIDUAL',
      fullName: 'Independent Advisor',
      email: indGuideEmail,
      phone: '9876543214',
      userType: 'Guide',
      department: 'Consulting',
      designation: 'Advisor',
    });
    assert(indGuideReg.user.accountType === 'INDIVIDUAL' && indGuideReg.user.role === 'Guide',
      'Individual + Guide is valid and decoupled');

    // -------------------------------------------------------------
    // Test 5: Profile Context (/me) Verification
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Profile Context ---');
    const indProfile = await AuthService.getUserProfile(indDbUser!.id);
    assert(indProfile.accountType === 'INDIVIDUAL', 'Individual profile has accountType INDIVIDUAL');
    assert(indProfile.organization === null, 'Individual profile organization is null');

    const orgProfile = await AuthService.getUserProfile(orgDbUser!.id);
    assert(orgProfile.accountType === 'ORGANIZATION', 'Org profile has accountType ORGANIZATION');
    assert(orgProfile.organization?.name === orgName, 'Org profile organization is populated');

    // -------------------------------------------------------------
    // Test 6: Duplicate Email Rejection
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Duplicate Email Rejection ---');
    let emailRejected = false;
    try {
      await AuthService.register({
        accountType: 'INDIVIDUAL',
        fullName: 'Duplicate Tester',
        email: indEmail, // Already registered
        phone: '9876543215',
        userType: 'Inventor',
      });
    } catch (e: any) {
      emailRejected = true;
    }
    assert(emailRejected, 'Duplicate email registration was correctly rejected');

    // -------------------------------------------------------------
    // Test 7: Existing Users Preservation
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Existing Users Preservation ---');
    const existingUsers = await prisma.user.findMany({
      where: {
        accountType: 'INDIVIDUAL',
        email: { notIn: [indEmail, orgEmail, secondUserEmail, studentOrgEmail, indGuideEmail] }
      },
      take: 5,
    });
    assert(existingUsers.length > 0, `Found ${existingUsers.length} existing pre-migration users in database`);
    for (const u of existingUsers) {
      assert(u.accountType === 'INDIVIDUAL', `Existing user ${u.email} safely defaults to INDIVIDUAL`);
    }

    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: [indEmail, orgEmail, secondUserEmail, studentOrgEmail, indGuideEmail] }
      }
    });
    await prisma.organization.deleteMany({
      where: { id: dbOrg!.id }
    });

    console.log('\n===============================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error running tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
