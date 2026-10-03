import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function testRegistrationIntact() {
  console.log('\n--- Testing Registration & Activation Flow Isolation ---');
  const uniqueEmail = `testuser_${Date.now()}@patenthub.test`;
  
  // 1. Register new user
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Verification User',
      email: uniqueEmail,
      phone: '9876543210',
      department: 'Computer Science',
      designation: 'Student',
      userType: 'Student',
    }),
  });
  const regData: any = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  console.log('✅ Registration succeeded for generated username:', regData.user.username);

  // Retrieve activation OTP from DB
  const user = await prisma.user.findUnique({
    where: { username: regData.user.username },
  });
  if (!user?.activationOtp) {
    throw new Error('Activation OTP not set on user');
  }
  console.log('✅ Found registration activationOtp in User model');

  // 2. Activate Account
  const actRes = await fetch(`${API_URL}/auth/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: user.username,
      otp: user.activationOtp,
      password: 'Password@123',
    }),
  });
  const actData: any = await actRes.json();
  if (actRes.status !== 200 || !actData.token) {
    throw new Error(`Activation failed: ${JSON.stringify(actData)}`);
  }
  console.log('✅ Initial account activation succeeded and issued initial setup token');

  // 3. Now attempt Login with the activated account -> immediately succeeds with password, issues JWT without OTP!
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrUsername: user.username,
      password: 'Password@123',
    }),
  });
  const loginData: any = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token || loginData.requiresOtp) {
    throw new Error(`Subsequent login failed to issue JWT or incorrectly requested OTP: ${JSON.stringify(loginData)}`);
  }
  console.log('✅ Subsequent login succeeded immediately with password, issued JWT without OTP!');

  // Clean up test user
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✅ Test user cleaned up');
  console.log('🎉 REGISTRATION & ACTIVATION FLOW FULLY VERIFIED INTACT!\n');

  await prisma.$disconnect();
}

testRegistrationIntact().catch(err => {
  console.error('Registration flow test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
