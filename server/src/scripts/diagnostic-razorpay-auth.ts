import dotenv from 'dotenv';
dotenv.config();

async function checkRazorpayCredentials() {
  console.log('=== RAZORPAY CREDENTIALS DIAGNOSTIC ===');
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const proPlanId = process.env.RAZORPAY_PRO_PLAN_ID;

  // 1. Environment Variable Integrity Checks
  const keyIdPresent = !!keyId;
  const keySecretPresent = !!keySecret;
  const webhookSecretPresent = !!webhookSecret;

  console.log('RAZORPAY_KEY_ID present:        ', keyIdPresent);
  console.log('RAZORPAY_KEY_SECRET present:    ', keySecretPresent);
  console.log('RAZORPAY_WEBHOOK_SECRET present:', webhookSecretPresent);
  console.log('RAZORPAY_PRO_PLAN_ID present:   ', !!proPlanId);

  if (!keyId || !keySecret) {
    console.log('FATAL: Razorpay credentials missing.');
    return;
  }

  // Whitespace checks
  const keyIdHasWhitespace = keyId !== keyId.trim() || /\s/.test(keyId);
  const keySecretHasWhitespace = keySecret !== keySecret.trim() || /\s/.test(keySecret);
  console.log('RAZORPAY_KEY_ID has whitespace:    ', keyIdHasWhitespace);
  console.log('RAZORPAY_KEY_SECRET has whitespace:', keySecretHasWhitespace);

  // Key Mode check
  const isTestKey = keyId.startsWith('rzp_test_');
  const isLiveKey = keyId.startsWith('rzp_live_');
  console.log('Key ID starts with rzp_test_:      ', isTestKey);
  console.log('Key ID starts with rzp_live_:      ', isLiveKey);

  // 2. Safe API Authentication Ping against Razorpay REST API
  // Call GET https://api.razorpay.com/v1/plans using Basic Auth
  const authHeader = 'Basic ' + Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
  
  try {
    const res = await fetch('https://api.razorpay.com/v1/plans?count=10', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('Razorpay API HTTP Status:          ', res.status);
    console.log('Razorpay Auth Successful (200):    ', res.status === 200);

    if (res.status === 200) {
      const data: any = await res.json();
      console.log('Razorpay API Authentication:       VALID & MATCHED KEY PAIR');
      console.log('Total Plans in Razorpay Account:   ', data.count || (data.items ? data.items.length : 0));
      
      if (Array.isArray(data.items)) {
        console.log('\nPlans found in this Razorpay account:');
        for (const plan of data.items) {
          console.log(`- Plan ID: ${plan.id}, Name: ${plan.item?.name}, Period: ${plan.period}, Interval: ${plan.interval}, Amount: ${plan.item?.amount / 100} ${plan.item?.currency}`);
        }
      }

      // Check if RAZORPAY_PRO_PLAN_ID exists in this account
      if (proPlanId) {
        const found = data.items?.some((p: any) => p.id === proPlanId);
        console.log(`Configured RAZORPAY_PRO_PLAN_ID (${proPlanId}) exists in this account:`, found);
      }
    } else if (res.status === 401) {
      console.log('Razorpay API Authentication:       FAILED (401 Unauthorized - Key ID & Secret mismatch or invalid)');
    } else {
      const errText = await res.text();
      console.log(`Razorpay API Error (${res.status}):`, errText);
    }
  } catch (err: any) {
    console.error('Network error reaching Razorpay API:', err.message);
  }
}

checkRazorpayCredentials();
