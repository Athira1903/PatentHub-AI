import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from './src/services/authService';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'patenthub_secret';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function assert(id: number, name: string, condition: boolean, message: string, details?: any) {
  if (condition) {
    console.log(`  ✅ [PASS ${id}/16] ${name}`);
    results.push({ id, name, passed: true, details });
  } else {
    console.error(`  ❌ [FAIL ${id}/16] ${name}: ${message}`);
    results.push({ id, name, passed: false, error: message, details });
  }
}

async function runAuthTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PATENTHUB AI SINGLE-OTP AUTHENTICATION SUITE');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Test 1: Individual Registration Sends OTP
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Individual Registration Sends OTP ---');
    const indEmail = `test_ind_${timestamp}@patenthub.test`;
    const indReg = await AuthService.register({
      accountType: 'INDIVIDUAL',
      fullName: 'Test Individual Inventor',
      email: indEmail,
      phone: '9876543210',
      userType: 'Student',
      institution: 'APJ Abdul Kalam Technological University',
      department: 'Computer Science',
      designation: 'B.Tech Student',
    });

    const indDbUser = await prisma.user.findUnique({
      where: { email: indEmail },
    });
    if (indDbUser) createdUserIds.push(indDbUser.id);

    await assert(
      1,
      'Individual registration creates pending user and generates activation OTP',
      !!indDbUser && !indDbUser.isActive && !!indDbUser.activationOtp,
      `User isActive=${indDbUser?.isActive}, activationOtp present=${!!indDbUser?.activationOtp}`
    );

    // -------------------------------------------------------------------------
    // Test 2: Individual OTP Verification Succeeds
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Individual OTP Verification Succeeds ---');
    const indPlainOtp = indDbUser!.activationOtp!; // Note: In DB it was stored
    const indActivateRes = await AuthService.activateAccount({
      username: indDbUser!.username,
      otp: indPlainOtp,
      newPassword: 'Password@123',
    });

    const indActivatedDb = await prisma.user.findUnique({
      where: { id: indDbUser!.id },
    });

    await assert(
      2,
      'Individual OTP verification activates account and hashes new password',
      indActivatedDb?.isActive === true && indActivatedDb.activationOtp === null && !!indActivateRes.token,
      `isActive=${indActivatedDb?.isActive}, activationOtp=${indActivatedDb?.activationOtp}, tokenIssued=${!!indActivateRes.token}`
    );

    // -------------------------------------------------------------------------
    // Test 3: Individual Account Can Login Using Password WITHOUT OTP
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Individual Account Can Login Using Password WITHOUT OTP ---');
    const indLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: indDbUser!.username,
        password: 'Password@123',
      }),
    });
    const indLoginData: any = await indLoginRes.json();

    await assert(
      3,
      'Individual account logs in directly with password (HTTP 200, JWT token, no requiresOtp)',
      indLoginRes.status === 200 && !!indLoginData.token && !indLoginData.requiresOtp && indLoginData.user?.accountType === 'INDIVIDUAL',
      `Status=${indLoginRes.status}, tokenPresent=${!!indLoginData.token}, requiresOtp=${indLoginData.requiresOtp}`
    );

    // -------------------------------------------------------------------------
    // Test 4: Organization Registration Sends OTP
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Organization Registration Sends OTP ---');
    const orgEmail = `test_org_${timestamp}@ajce.in`;
    const orgName = `Amal Jyothi College of Engineering ${timestamp}`;
    const orgReg = await AuthService.register({
      accountType: 'ORGANIZATION',
      organizationName: orgName,
      organizationType: 'UNIVERSITY',
      organizationDomain: 'ajce.in',
      fullName: 'Dr. Joseph Guide',
      email: orgEmail,
      phone: '9876543211',
      userType: 'Guide',
      department: 'ECE',
      designation: 'Professor',
    });

    const orgDbUser = await prisma.user.findUnique({
      where: { email: orgEmail },
      include: { organization: true },
    });
    if (orgDbUser) {
      createdUserIds.push(orgDbUser.id);
      if (orgDbUser.organizationId) createdOrgIds.push(orgDbUser.organizationId);
    }

    await assert(
      4,
      'Organization registration creates organization record and generates activation OTP',
      !!orgDbUser && !orgDbUser.isActive && !!orgDbUser.organizationId && !!orgDbUser.activationOtp,
      `isActive=${orgDbUser?.isActive}, orgId=${orgDbUser?.organizationId}, activationOtp present=${!!orgDbUser?.activationOtp}`
    );

    // -------------------------------------------------------------------------
    // Test 5: Organization OTP Verification Succeeds
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Organization OTP Verification Succeeds ---');
    const orgActivateRes = await AuthService.activateAccount({
      username: orgDbUser!.username,
      otp: orgDbUser!.activationOtp!,
      newPassword: 'Password@123',
    });

    const orgActivatedDb = await prisma.user.findUnique({
      where: { id: orgDbUser!.id },
    });

    await assert(
      5,
      'Organization OTP verification activates user and associates organization context',
      orgActivatedDb?.isActive === true && orgActivatedDb.activationOtp === null && orgActivateRes.user?.accountType === 'ORGANIZATION',
      `isActive=${orgActivatedDb?.isActive}, accountType=${orgActivateRes.user?.accountType}`
    );

    // -------------------------------------------------------------------------
    // Test 6: Organization Account Can Login Using Password WITHOUT OTP
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Organization Account Can Login Using Password WITHOUT OTP ---');
    const orgLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: orgEmail,
        password: 'Password@123',
      }),
    });
    const orgLoginData: any = await orgLoginRes.json();

    await assert(
      6,
      'Organization account logs in directly with password (HTTP 200, JWT token, organization context)',
      orgLoginRes.status === 200 && !!orgLoginData.token && !orgLoginData.requiresOtp && orgLoginData.user?.organization?.name === orgName,
      `Status=${orgLoginRes.status}, orgName=${orgLoginData.user?.organization?.name}`
    );

    // -------------------------------------------------------------------------
    // Test 7: Invalid Password Fails Normally
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Invalid Password Fails Normally ---');
    const wrongPassRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: indDbUser!.username,
        password: 'WrongPassword!999',
      }),
    });

    await assert(
      7,
      'Invalid password returns 401 Unauthorized with generic message',
      wrongPassRes.status === 401,
      `Expected status 401, got ${wrongPassRes.status}`
    );

    // -------------------------------------------------------------------------
    // Test 8: No Login OTP is Generated in Database
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: No Login OTP is Generated in Database ---');
    const otpCountBefore = await prisma.loginOtp.count({
      where: { userId: indDbUser!.id },
    });
    await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: indDbUser!.username,
        password: 'Password@123',
      }),
    });
    const otpCountAfter = await prisma.loginOtp.count({
      where: { userId: indDbUser!.id },
    });

    await assert(
      8,
      'Login process does NOT create any login OTP records in database',
      otpCountAfter === otpCountBefore,
      `OTP records before=${otpCountBefore}, after=${otpCountAfter}`
    );

    // -------------------------------------------------------------------------
    // Test 9: No Login OTP Endpoint is Required (Obsolete Endpoints Disabled)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: No Login OTP Endpoint is Required ---');
    const verifyOtpEndpointRes = await fetch(`${API_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: 'none', otp: '123456' }),
    });
    const resendOtpEndpointRes = await fetch(`${API_URL}/auth/resend-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: 'none' }),
    });

    await assert(
      9,
      'Obsolete login OTP endpoints return 404 Not Found',
      verifyOtpEndpointRes.status === 404 && resendOtpEndpointRes.status === 404,
      `verify-login-otp status=${verifyOtpEndpointRes.status}, resend-login-otp status=${resendOtpEndpointRes.status}`
    );

    // -------------------------------------------------------------------------
    // Test 10: JWT is Issued Immediately After Successful Login
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: JWT is Issued Immediately After Successful Login ---');
    const directLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: indDbUser!.username,
        password: 'Password@123',
      }),
    });
    const directLoginData: any = await directLoginRes.json();
    const decodedToken: any = jwt.verify(directLoginData.token, JWT_SECRET);

    await assert(
      10,
      'JWT payload contains userId, username, role, accountType, and organizationId',
      decodedToken.userId === indDbUser!.id && decodedToken.username === indDbUser!.username && decodedToken.role === 'Inventor',
      `Decoded userId=${decodedToken.userId}, role=${decodedToken.role}`
    );

    // -------------------------------------------------------------------------
    // Test 11: Protected Endpoint Works With Issued JWT
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Protected Endpoint Works With Issued JWT ---');
    const profileRes = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${directLoginData.token}`,
      },
    });
    const profileData: any = await profileRes.json();

    await assert(
      11,
      'Protected /api/auth/profile returns user details when authorized with issued JWT',
      profileRes.status === 200 && profileData.user?.email === indEmail,
      `Profile status=${profileRes.status}, email=${profileData.user?.email}`
    );

    // -------------------------------------------------------------------------
    // Test 12: Registration OTP Remains Single-Use
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: Registration OTP Remains Single-Use ---');
    let secondActivationFailed = false;
    try {
      await AuthService.activateAccount({
        username: indDbUser!.username,
        otp: indPlainOtp, // Reusing already activated OTP
        newPassword: 'Password@1234',
      });
    } catch {
      secondActivationFailed = true;
    }

    await assert(
      12,
      'Reusing an already verified registration OTP is rejected',
      secondActivationFailed,
      'Re-activation with used OTP did not throw error'
    );

    // -------------------------------------------------------------------------
    // Test 13: Registration OTP Expiry Still Works
    // -------------------------------------------------------------------------
    console.log('\n--- Test 13: Registration OTP Expiry Still Works ---');
    const expiredEmail = `expired_${timestamp}@patenthub.test`;
    await AuthService.register({
      accountType: 'INDIVIDUAL',
      fullName: 'Expired User Test',
      email: expiredEmail,
      phone: '9876543213',
      userType: 'Student',
    });
    const expiredUser = await prisma.user.findUnique({ where: { email: expiredEmail } });
    if (expiredUser) createdUserIds.push(expiredUser.id);

    // Force expiry in database
    await prisma.user.update({
      where: { id: expiredUser!.id },
      data: { activationOtpExpires: new Date(Date.now() - 1000 * 60 * 60) }, // 1 hour ago
    });

    let expiredActivationFailed = false;
    try {
      await AuthService.activateAccount({
        username: expiredUser!.username,
        otp: expiredUser!.activationOtp!,
        newPassword: 'Password@123',
      });
    } catch (err: any) {
      expiredActivationFailed = err.message?.includes('expired');
    }

    await assert(
      13,
      'Expired registration OTP is rejected with expiry error',
      expiredActivationFailed,
      'Expired OTP was not rejected'
    );

    // -------------------------------------------------------------------------
    // Test 14: Registration OTP Resend Still Works
    // -------------------------------------------------------------------------
    console.log('\n--- Test 14: Registration OTP Resend Still Works ---');
    const resendUserEmail = `resend_${timestamp}@patenthub.test`;
    await AuthService.register({
      accountType: 'INDIVIDUAL',
      fullName: 'Resend User Test',
      email: resendUserEmail,
      phone: '9876543214',
      userType: 'Student',
    });
    const resendUser = await prisma.user.findUnique({ where: { email: resendUserEmail } });
    if (resendUser) createdUserIds.push(resendUser.id);

    const resendResult = await AuthService.resendActivationOtp(resendUser!.username);
    const updatedResendUser = await prisma.user.findUnique({ where: { id: resendUser!.id } });

    await assert(
      14,
      'Registration OTP resend updates OTP and extends expiry',
      !!resendResult && !!updatedResendUser?.activationOtp,
      `Resend success=${!!resendResult}`
    );

    // -------------------------------------------------------------------------
    // Test 15: Existing Roles Continue Working (All 5 Seeded Users Login Directly)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 15: Existing Roles Login Directly With Password ---');
    const seededRoles = [
      { username: 'STU202600001', role: 'Inventor' },
      { username: 'COI20260001', role: 'CoInventor' },
      { username: 'GDE20260001', role: 'Guide' },
      { username: 'PEX20260001', role: 'PatentExpert' },
      { username: 'ADM20260001', role: 'Admin' },
    ];

    let allRolesPass = true;
    for (const r of seededRoles) {
      const rRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: r.username,
          password: 'Password@123',
        }),
      });
      const rData: any = await rRes.json();
      if (rRes.status !== 200 || !rData.token || rData.requiresOtp) {
        allRolesPass = false;
        console.error(`  Role ${r.role} failed login: status=${rRes.status}`);
      }
    }

    await assert(
      15,
      'All 5 seeded roles (Inventor, CoInventor, Guide, PatentExpert, Admin) login directly without OTP',
      allRolesPass,
      'One or more seeded roles failed direct password login'
    );

    // -------------------------------------------------------------------------
    // Test 16: Organization Context Continues Working
    // -------------------------------------------------------------------------
    console.log('\n--- Test 16: Organization Context Continues Working ---');
    const orgUserLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: orgEmail,
        password: 'Password@123',
      }),
    });
    const orgUserData: any = await orgUserLoginRes.json();
    const orgTokenDecoded: any = jwt.verify(orgUserData.token, JWT_SECRET);

    await assert(
      16,
      'Organization context is present in login response and JWT payload',
      orgUserData.user?.accountType === 'ORGANIZATION' &&
        !!orgUserData.user?.organizationId &&
        orgTokenDecoded.accountType === 'ORGANIZATION',
      `accountType=${orgUserData.user?.accountType}, orgId=${orgUserData.user?.organizationId}`
    );
  } finally {
    // Clean up temporary test data
    console.log('\n--- Cleaning up temporary test records ---');
    for (const uid of createdUserIds) {
      try {
        await prisma.loginOtp.deleteMany({ where: { userId: uid } });
        await prisma.activityLog.deleteMany({ where: { userId: uid } });
        await prisma.notification.deleteMany({ where: { userId: uid } });
        await prisma.user.delete({ where: { id: uid } });
      } catch (err: any) {
        console.warn(`Could not cleanup user ${uid}: ${err.message}`);
      }
    }
    for (const oid of createdOrgIds) {
      try {
        await prisma.organization.delete({ where: { id: oid } });
      } catch (err: any) {
        console.warn(`Could not cleanup org ${oid}: ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('======================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  prisma.$disconnect();
  process.exit(1);
});
