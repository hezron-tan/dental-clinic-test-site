import http from 'k6/http';
import { check, sleep } from 'k6';
import { requireSupabaseEnv, hasStaffCredentials, staffCredentials } from './lib/config.js';
import { publicHeaders, authHeaders } from './lib/headers.js';

// Local run:
//   k6 run -e SUPABASE_URL=https://xxx.supabase.co -e SUPABASE_ANON_KEY=eyJ... tests/k6/clinic-load.js
// Grafana Cloud:
//   k6 cloud run tests/k6/clinic-load.js -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=...

export const options = {
  scenarios: {
    clinic_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    'checks{scenario:clinic_info}': ['rate>0.99'],
    'checks{scenario:patients_public}': ['rate>0.99']
  }
};

function fetchStaffToken(base, key) {
  const { email, password } = staffCredentials();
  const res = http.post(
    `${base}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email, password }),
    {
      headers: {
        apikey: key,
        'Content-Type': 'application/json'
      }
    }
  );

  if (res.status !== 200) {
    throw new Error(`Staff auth failed (${res.status}): ${res.body}`);
  }

  return res.json('access_token');
}

export function setup() {
  const { base, key } = requireSupabaseEnv();
  const data = { base, key, staffToken: null };

  if (hasStaffCredentials()) {
    data.staffToken = fetchStaffToken(base, key);
  }

  return data;
}

function getClinicInfo(data) {
  const res = http.get(`${data.base}/rest/v1/clinic_info?id=eq.1&select=name,phone`, {
    headers: publicHeaders(data.key),
    tags: { scenario: 'clinic_info' }
  });

  check(
    res,
    {
      'clinic status 200': (r) => r.status === 200,
      'clinic has name': (r) => r.json()[0]?.name?.length > 0
    },
    { scenario: 'clinic_info' }
  );
}

function getPatientsPublic(data) {
  const res = http.get(`${data.base}/rest/v1/patients?select=id&limit=1`, {
    headers: publicHeaders(data.key),
    tags: { scenario: 'patients_public' }
  });

  check(
    res,
    {
      'patients public status 200': (r) => r.status === 200,
      'patients public empty': (r) => Array.isArray(r.json()) && r.json().length === 0
    },
    { scenario: 'patients_public' }
  );
}

function listPatientsStaff(data) {
  if (!data.staffToken) {
    return;
  }

  const res = http.get(
    `${data.base}/rest/v1/patients?select=first_name,last_name&order=last_name&limit=10`,
    {
      headers: authHeaders(data.key, data.staffToken),
      tags: { scenario: 'patients_staff' }
    }
  );

  check(
    res,
    {
      'staff patients status 200': (r) => r.status === 200,
      'staff patients non-empty': (r) => Array.isArray(r.json()) && r.json().length > 0
    },
    { scenario: 'patients_staff' }
  );
}

export default function (data) {
  const roll = Math.random();

  if (roll < 0.5) {
    getClinicInfo(data);
  } else if (roll < 0.8 || !data.staffToken) {
    getPatientsPublic(data);
  } else {
    listPatientsStaff(data);
  }

  sleep(1);
}
