export const supabaseUrl = process.env.SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

export const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@clinic.test';
export const adminPassword = process.env.ADMIN_PASSWORD ?? '';
export const staffEmail = process.env.STAFF_EMAIL ?? 'staff@clinic.test';
export const staffPassword = process.env.STAFF_PASSWORD ?? '';

export function requireSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  return true;
}

export function requireCredentials(role: 'admin' | 'staff') {
  const email = role === 'admin' ? adminEmail : staffEmail;
  const password = role === 'admin' ? adminPassword : staffPassword;
  if (!password) {
    throw new Error(`Set ${role === 'admin' ? 'ADMIN' : 'STAFF'}_PASSWORD`);
  }
  return { email, password };
}

export async function getAccessToken(email: string, password: string): Promise<string> {
  if (!requireSupabaseEnv()) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  }
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error_description || body.msg || `Auth failed (${res.status})`);
  }
  return body.access_token as string;
}

export function supabaseHeaders(token?: string) {
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
