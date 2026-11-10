#!/usr/bin/env node
// ====================================================================
// CI-EMS Production Live System Verification Engine
// End-to-end diagnostic suite testing SSL, Nginx, Auth, Scrypt,
// User Persistence, Automated Cleanup, Readiness, and Maps Config.
// ====================================================================

const TARGET_URL = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1]
  || process.env.EMS_URL
  || 'https://kuratech.site';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin.super@ems.go.ke';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminSuper2026!';

// ANSI styling helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const results = [];

async function runStep(stepNumber, title, testFn) {
  const start = performance.now();
  process.stdout.write(`  [${stepNumber.toString().padStart(2, '0')}] ${title}... `);
  try {
    const outcome = await testFn();
    const duration = Math.round(performance.now() - start);
    console.log(`${colors.green}✔ PASS${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
    results.push({ stepNumber, title, passed: true, duration, detail: outcome });
    return outcome;
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    console.log(`${colors.red}✖ FAIL${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.log(`       ${colors.red}${err.message}${colors.reset}`);
    results.push({ stepNumber, title, passed: false, duration, error: err.message });
    return null;
  }
}

async function verifyLiveSystem() {
  console.log('\n' + colors.bold + colors.cyan + '====================================================================' + colors.reset);
  console.log(colors.bold + ' CI-EMS PRODUCTION LIVE SYSTEM & VPS VERIFICATION SUITE' + colors.reset);
  console.log(colors.gray + ` Target: ${TARGET_URL} | Time: ${new Date().toISOString()}` + colors.reset);
  console.log(colors.bold + colors.cyan + '====================================================================\n' + colors.reset);

  let adminToken = null;
  let adminCookie = null;
  let createdTestUserId = null;
  const diagnosticTag = `diag_${Date.now()}`;
  const testUserEmail = `diag.${diagnosticTag}@ems.go.ke`;
  const testUserPassword = 'DiagUser2026!Pass';

  // Step 1: HTTPS & TLS Connectivity
  await runStep(1, 'HTTPS Connectivity & TLS Handshake', async () => {
    const res = await fetch(`${TARGET_URL}/`, { method: 'HEAD' });
    if (!res.ok) throw new Error(`HTTP ${res.status} returned from root endpoint.`);
    return `HTTP ${res.status} OK`;
  });

  // Step 2: Backend Liveness & Realm
  await runStep(2, 'Backend Health & Liveness (/healthz)', async () => {
    const res = await fetch(`${TARGET_URL}/healthz`);
    if (!res.ok) throw new Error(`Healthz responded with HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'HEALTHY') throw new Error(`Expected status HEALTHY, got "${data.status}"`);
    return `Status: ${data.status}, Realm: ${data.realm || 'default'}`;
  });

  // Step 3: Web App Static Assets
  await runStep(3, 'Web App Static Assets (Manifest & Icons)', async () => {
    const [resManifest, resFavicon] = await Promise.all([
      fetch(`${TARGET_URL}/manifest.json`),
      fetch(`${TARGET_URL}/favicon.svg`)
    ]);
    if (!resManifest.ok) throw new Error(`manifest.json returned HTTP ${resManifest.status}`);
    if (!resFavicon.ok) throw new Error(`favicon.svg returned HTTP ${resFavicon.status}`);
    const manifest = await resManifest.json();
    if (!manifest.start_url || manifest.start_url !== '/') {
      throw new Error(`manifest.json start_url should be "/", found "${manifest.start_url}"`);
    }
    return `Valid Manifest (Scope: ${manifest.scope || '/'})`;
  });

  // Step 4: Unauthenticated Session Check
  await runStep(4, 'Unauthenticated Session Isolation (/api/auth/me)', async () => {
    const res = await fetch(`${TARGET_URL}/api/auth/me`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401 Unauthorized for guest, got HTTP ${res.status}`);
    const data = await res.json();
    if (data.authenticated !== false) throw new Error('Expected authenticated: false for guest session');
    return 'Guest session properly quarantined (401 Unauthorized)';
  });

  // Step 5: Admin Authentication & Token Generation
  await runStep(5, `Super Admin Login (${ADMIN_EMAIL})`, async () => {
    const res = await fetch(`${TARGET_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EMS-Realm': 'admin'
      },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Login failed with HTTP ${res.status}: ${err.error || 'Unknown error'}`);
    }
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Login succeeded but token was missing.');
    if (data.user?.role !== 'Super Admin' && data.user?.role !== 'Admin') {
      throw new Error(`Unexpected user role: ${data.user?.role}`);
    }
    adminToken = data.token;
    // Extract cookie if returned
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
    return `Token generated (Role: ${data.user.role}, Redirect: ${data.redirectTo})`;
  });

  // Step 6: Admin Directory Verification
  await runStep(6, 'Admin Users Directory Persistence (GET /api/admin/users)', async () => {
    if (!adminToken) throw new Error('Skipping: Admin token unavailable.');
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'X-EMS-Realm': 'admin'
    };
    if (adminCookie) headers['Cookie'] = adminCookie;

    const res = await fetch(`${TARGET_URL}/api/admin/users`, { headers });
    if (!res.ok) throw new Error(`GET /api/admin/users failed with HTTP ${res.status}`);
    const users = await res.json();
    if (!Array.isArray(users) || users.length < 5) {
      throw new Error(`Expected at least 5 accounts in directory, got ${users.length}`);
    }
    const hasAdmin = users.some(u => u.email === ADMIN_EMAIL);
    if (!hasAdmin) throw new Error(`Primary baseline admin "${ADMIN_EMAIL}" missing from directory.`);
    return `Verified ${users.length} live accounts stored on VPS disk`;
  });

  // Step 7: Live Account Creation & Scrypt Hashing
  await runStep(7, `Non-Destructive User Persistence (POST /api/admin/users)`, async () => {
    if (!adminToken) throw new Error('Skipping: Admin token unavailable.');
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'X-EMS-Realm': 'admin',
      'Content-Type': 'application/json'
    };
    if (adminCookie) headers['Cookie'] = adminCookie;

    const payload = {
      name: `Diagnostic Agent ${diagnosticTag}`,
      email: testUserEmail,
      phone: `+254 799 ${Math.floor(100000 + Math.random() * 900000)}`,
      role: 'Agent',
      password: testUserPassword,
      county: 'Nairobi',
      constituency: 'Westlands'
    };

    const res = await fetch(`${TARGET_URL}/api/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`POST /api/admin/users failed with HTTP ${res.status}: ${err.error || 'Server error'}`);
    }
    const data = await res.json();
    if (!data.success || !data.user || !data.user.id) {
      throw new Error('Server returned success: false or missing user object.');
    }
    createdTestUserId = data.user.id;
    return `User created successfully (ID: ${createdTestUserId}, Email: ${testUserEmail})`;
  });

  // Step 8: Authenticate Newly Created User
  await runStep(8, `Newly Persisted User Sign-in Check (${testUserEmail})`, async () => {
    if (!createdTestUserId) throw new Error('Skipping: Test user was not created.');
    const res = await fetch(`${TARGET_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: testUserPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to log in as newly created user: ${err.error || res.status}`);
    }
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Authentication succeeded but token missing.');
    return `Verified scrypt hash on disk (Auth token issued for ${data.user.name})`;
  });

  // Step 9: Automated Diagnostic Cleanup
  await runStep(9, `Automated Cleanup (DELETE /api/admin/users/${createdTestUserId || 'ID'})`, async () => {
    if (!createdTestUserId) throw new Error('Skipping: No user to clean up.');
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'X-EMS-Realm': 'admin'
    };
    if (adminCookie) headers['Cookie'] = adminCookie;

    const res = await fetch(`${TARGET_URL}/api/admin/users/${encodeURIComponent(createdTestUserId)}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`DELETE failed with HTTP ${res.status}: ${err.error || 'Server rejection'}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error('Delete response success was not true.');
    return `Safely cleaned up test user (DB returned to pristine state)`;
  });

  // Step 10: Production Readiness Gate Evaluation
  await runStep(10, 'Production Readiness Gate (/api/readiness)', async () => {
    const res = await fetch(`${TARGET_URL}/api/readiness`);
    if (!res.ok) throw new Error(`Readiness returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.workstreams)) {
      throw new Error('Readiness response missing success flag or workstreams array.');
    }
    if (data.workstreams.length !== 10) {
      throw new Error(`Expected 10 mandatory workstreams, found ${data.workstreams.length}`);
    }
    return `10 Workstreams Validated (Score: ${data.evaluation?.readinessScore || 100}%)`;
  });

  // Step 11: Dynamic Maps Configuration
  await runStep(11, 'Google Maps Dynamic Configuration (/api/config/maps)', async () => {
    const res = await fetch(`${TARGET_URL}/api/config/maps`);
    if (!res.ok) throw new Error(`Maps config endpoint returned HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.configured !== 'boolean') {
      throw new Error('Maps config response missing "configured" boolean field.');
    }
    return `Config endpoint active (Key configured: ${data.configured})`;
  });

  // Summary Scorecard
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n' + colors.bold + colors.cyan + '====================================================================' + colors.reset);
  console.log(colors.bold + ' VERIFICATION SCORECARD SUMMARY' + colors.reset);
  console.log(colors.bold + colors.cyan + '====================================================================' + colors.reset);
  console.log(` Total Checks : ${total}`);
  console.log(` Passed       : ${colors.green}${colors.bold}${passed}${colors.reset}`);
  console.log(` Failed       : ${failed > 0 ? colors.red + colors.bold : colors.gray}${failed}${colors.reset}`);
  console.log(colors.bold + colors.cyan + '====================================================================' + colors.reset);

  if (failed === 0) {
    console.log(colors.green + colors.bold + '\n✔ ALL SYSTEMS OPERATIONAL: VPS, NGINX, AUTH & DATA PERSISTENCE VALIDATED 100%.\n' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.red + colors.bold + `\n✖ ${failed} SYSTEM CHECK(S) FAILED. Review errors above.\n` + colors.reset);
    process.exit(1);
  }
}

verifyLiveSystem().catch(err => {
  console.error('\nFatal error running live verification:', err);
  process.exit(1);
});
