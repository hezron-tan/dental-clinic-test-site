import http from 'k6/http';
import { check, sleep } from 'k6';

// Run:
//   k6 run tests/k6/clinic-load.js
// With env:
//   k6 run -e SUPABASE_URL=https://xxx.supabase.co -e SUPABASE_ANON_KEY=eyJ... tests/k6/clinic-load.js

const BASE = __ENV.SUPABASE_URL;
const KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

export function setup() {
  if (!BASE || !KEY) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  }
}

export default function () {
  const clinicRes = http.get(`${BASE}/rest/v1/clinic_info?id=eq.1&select=name,phone`, {
    headers: { apikey: KEY }
  });

  check(clinicRes, {
    'clinic status 200': (r) => r.status === 200,
    'clinic has name': (r) => r.json()[0]?.name?.length > 0
  });

  sleep(1);
}
