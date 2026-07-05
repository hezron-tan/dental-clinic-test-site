const PLACEHOLDER_PREFIXES = ['your-', 'YOUR_PROJECT'];

export function isPlaceholderValue(value) {
  if (!value) {
    return true;
  }
  return PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix) || value.includes(prefix));
}

export function requireSupabaseEnv() {
  const base = __ENV.SUPABASE_URL;
  const key = __ENV.SUPABASE_ANON_KEY;

  if (!base || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  }
  if (isPlaceholderValue(base) || isPlaceholderValue(key)) {
    throw new Error('Replace placeholder SUPABASE_URL / SUPABASE_ANON_KEY values');
  }

  return { base, key };
}

export function hasStaffCredentials() {
  const email = __ENV.STAFF_EMAIL;
  const password = __ENV.STAFF_PASSWORD;
  return Boolean(email && password && !isPlaceholderValue(password));
}

export function staffCredentials() {
  return {
    email: __ENV.STAFF_EMAIL ?? 'staff@clinic.test',
    password: __ENV.STAFF_PASSWORD ?? ''
  };
}
