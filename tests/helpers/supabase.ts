export const supabaseUrl = process.env.SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

export const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@clinic.test';
export const adminPassword = process.env.ADMIN_PASSWORD ?? '';
export const staffEmail = process.env.STAFF_EMAIL ?? 'staff@clinic.test';
export const staffPassword = process.env.STAFF_PASSWORD ?? '';

/**
 * True when a value is missing or still set to a template placeholder from `.env.example`.
 * @param value - Env string to inspect.
 */
export function isPlaceholderValue(value: string): boolean {
  if (!value) {
    return true;
  }
  return value.startsWith('your-') || value.includes('YOUR_PROJECT');
}

/**
 * Checks that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set to real (non-placeholder) values.
 * @returns `true` when both are usable for API calls; otherwise `false`.
 */
export function requireSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
    return false;
  }
  return true;
}

/**
 * Whether admin login is configured (`ADMIN_PASSWORD` is set and not a placeholder).
 */
export function hasAdminCredentials(): boolean {
  return !isPlaceholderValue(adminPassword);
}

/**
 * Whether staff login is configured (`STAFF_PASSWORD` is set and not a placeholder).
 */
export function hasStaffCredentials(): boolean {
  return !isPlaceholderValue(staffPassword);
}

/**
 * Returns email/password for the given role, or throws if the password env var is empty.
 * @param role - Which clinic role credentials to load.
 * @throws When the matching `*_PASSWORD` env var is unset.
 */
export function requireCredentials(role: 'admin' | 'staff') {
  const email = role === 'admin' ? adminEmail : staffEmail;
  const password = role === 'admin' ? adminPassword : staffPassword;
  if (!password) {
    throw new Error(`Set ${role === 'admin' ? 'ADMIN' : 'STAFF'}_PASSWORD`);
  }
  return { email, password };
}

interface CachedToken {
  token: string;
  /** Epoch ms when the cached token should be treated as expired. */
  expiresAt: number;
}

/** Per-email token cache so parallel cleanup does not spam password-grant auth. */
const tokenCache = new Map<string, CachedToken>();
/** In-flight password grants keyed by email (dedupes concurrent callers). */
const tokenInFlight = new Map<string, Promise<string>>();

const TOKEN_EXPIRY_SKEW_MS = 60_000;
const AUTH_RETRY_ATTEMPTS = 4;
const AUTH_RETRY_BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(message: string, status: number): boolean {
  return status === 429 || /rate limit/i.test(message);
}

/**
 * Fetches a password-grant token from Supabase Auth, with retries on rate limits.
 * @param email - User email.
 * @param password - User password.
 * @returns Bearer access token and absolute expiry time.
 */
async function fetchAccessToken(email: string, password: string): Promise<CachedToken> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < AUTH_RETRY_ATTEMPTS; attempt++) {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const body = await res.json();
    if (res.ok) {
      const expiresInSec = typeof body.expires_in === 'number' ? body.expires_in : 3600;
      return {
        token: body.access_token as string,
        expiresAt: Date.now() + expiresInSec * 1000 - TOKEN_EXPIRY_SKEW_MS
      };
    }

    const message = body.error_description || body.msg || `Auth failed (${res.status})`;
    lastError = new Error(message);
    if (!isRateLimitError(message, res.status) || attempt === AUTH_RETRY_ATTEMPTS - 1) {
      throw lastError;
    }
    await sleep(AUTH_RETRY_BASE_DELAY_MS * 2 ** attempt);
  }

  throw lastError ?? new Error('Auth failed');
}

/**
 * Exchanges email/password for a Supabase Auth access token (password grant).
 * Caches tokens per email and dedupes concurrent requests to avoid auth rate limits
 * during parallel Playwright teardown cleanup.
 * @param email - User email.
 * @param password - User password.
 * @returns Bearer access token for REST calls.
 * @throws When Supabase env is missing/placeholder, or auth fails.
 */
export async function getAccessToken(email: string, password: string): Promise<string> {
  if (!requireSupabaseEnv()) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  }

  const cached = tokenCache.get(email);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const existing = tokenInFlight.get(email);
  if (existing) {
    return existing;
  }

  const pending = fetchAccessToken(email, password)
    .then((entry) => {
      tokenCache.set(email, entry);
      return entry.token;
    })
    .finally(() => {
      tokenInFlight.delete(email);
    });

  tokenInFlight.set(email, pending);
  return pending;
}

/**
 * Builds common Supabase REST headers (`apikey`, JSON content type, optional Bearer token).
 * @param token - Optional access token; when set, adds `Authorization: Bearer …`.
 */
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
