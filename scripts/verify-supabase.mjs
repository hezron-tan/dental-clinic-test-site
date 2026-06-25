/**
 * Verifies Supabase project setup after following docs/SUPABASE_SETUP.md
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... \\
 *   ADMIN_EMAIL=admin@clinic.test ADMIN_PASSWORD=... \\
 *   STAFF_EMAIL=staff@clinic.test STAFF_PASSWORD=... \\
 *   node scripts/verify-supabase.mjs
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@clinic.test';
const adminPassword = process.env.ADMIN_PASSWORD;
const staffEmail = process.env.STAFF_EMAIL || 'staff@clinic.test';
const staffPassword = process.env.STAFF_PASSWORD;

function fail(message) {
  console.error('FAIL:', message);
  process.exitCode = 1;
}

function pass(message) {
  console.log('OK:', message);
}

async function signIn(email, password) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${email}: ${body.error_description || body.msg || res.status}`);
  }
  return body.access_token;
}

async function main() {
  if (!url || !key) {
    fail('Set SUPABASE_URL and SUPABASE_ANON_KEY');
    return;
  }
  if (!adminPassword || !staffPassword) {
    fail('Set ADMIN_PASSWORD and STAFF_PASSWORD');
    return;
  }

  try {
    const clinicRes = await fetch(`${url}/rest/v1/clinic_info?id=eq.1&select=name`, {
      headers: { apikey: key }
    });
    const clinic = await clinicRes.json();
    if (!clinicRes.ok || !clinic[0]?.name) {
      fail('clinic_info not readable — run schema.sql and seed.sql');
    } else {
      pass(`Public clinic_info: ${clinic[0].name}`);
    }

    const adminToken = await signIn(adminEmail, adminPassword);
    pass(`Admin sign-in: ${adminEmail}`);

    const staffToken = await signIn(staffEmail, staffPassword);
    pass(`Staff sign-in: ${staffEmail}`);

    const patientsRes = await fetch(`${url}/rest/v1/patients?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${staffToken}`
      }
    });
    const patients = await patientsRes.json();
    if (!patientsRes.ok) {
      fail('Staff cannot read patients — check RLS and profiles');
    } else if (!patients.length) {
      fail('No patients found — run seed.sql');
    } else {
      pass('Staff can read patients');
    }

    const adminPayload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64url').toString());
    const adminProfileRes = await fetch(
      `${url}/rest/v1/profiles?select=role&id=eq.${adminPayload.sub}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${adminToken}`
        }
      }
    );
    const adminProfile = await adminProfileRes.json();
    if (adminProfile[0]?.role === 'admin') {
      pass('Admin profile role is admin');
    } else {
      fail('Admin profile missing or wrong role — check user metadata and profiles table');
    }

    const staffPayload = JSON.parse(Buffer.from(staffToken.split('.')[1], 'base64url').toString());
    const staffProfileRes = await fetch(
      `${url}/rest/v1/profiles?select=role&id=eq.${staffPayload.sub}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${staffToken}`
        }
      }
    );
    const staffProfile = await staffProfileRes.json();
    if (staffProfile[0]?.role === 'staff') {
      pass('Staff profile role is staff');
    } else {
      fail('Staff profile missing or wrong role');
    }

    console.log('\nSupabase setup looks good. Next: copy keys into js/config.js and run Playwright.');
  } catch (err) {
    fail(err.message);
  }
}

main();
