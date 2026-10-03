import { execSync } from 'child_process';

const testScripts = [
  { name: 'Auth OTP Login Suite', file: 'test-auth-otp.ts' },
  { name: 'Registration Isolation Suite', file: 'test-registration-intact.ts' },
  { name: 'Account Registration (Individual vs Organization) Suite', file: 'test-account-registration.ts' },
  { name: 'Inventor Workflow Suite', file: 'test-inventor-workflow.ts' },
  { name: 'Co-Inventor Workflow Suite', file: 'test-coinventor-workflow.ts' },
  { name: 'Guide Workflow Suite', file: 'test-guide-workflow.ts' },
  { name: 'Patent Expert Workflow Suite', file: 'test-patent-expert-workflow.ts' },
  { name: 'Admin Workflow Suite', file: 'test-admin-workflow.ts' },
  { name: 'Specification Workflow Suite', file: 'test-specification-workflow.ts' },
  { name: 'Next Action Engine Suite', file: 'test-next-action-engine.ts' },
  { name: 'Multi-Tenant & Policy Management Suite', file: 'test-multitenant-policy.ts' },
  { name: 'Free Trial, Pro Subscription & Razorpay Suite', file: 'test-subscription-razorpay.ts' },
  { name: 'Platform Admin Complete Specification Suite', file: 'test-platform-admin-complete.ts' },
];

console.log('\n======================================================');
console.log('🚀 MASTER INTEGRATION RUNNER — ALL ROLES VERIFICATION');
console.log('======================================================\n');

let allPassed = true;

for (const suite of testScripts) {
  process.stdout.write(`Executing [${suite.name}] (${suite.file})... `);
  try {
    const output = execSync(`npx.cmd ts-node ${suite.file}`, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log('✅ PASSED');
  } catch (err: any) {
    console.log('❌ FAILED');
    console.error(err.stdout || err.stderr || err.message);
    allPassed = false;
  }
}

console.log('\n======================================================');
if (allPassed) {
  console.log(`🏆 ALL ${testScripts.length} TEST SUITES PASSED! MASTER INTEGRATION CLEAN!`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.log('💥 SOME TEST SUITES FAILED!');
  console.log('======================================================\n');
  process.exit(1);
}
