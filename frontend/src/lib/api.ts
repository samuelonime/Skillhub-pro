/**
 * api.ts — Secure fetch wrapper
 *
 * Auth strategy: HttpOnly cookies (sh_access + sh_refresh)
 * - Tokens are NEVER stored in localStorage or JS-readable storage
 * - The browser sends cookies automatically on every request
 * - credentials: 'include' is required for cross-origin cookie sending
 * - Non-sensitive user data (name, role) is cached in memory for instant UI
 */

// Always use the same-origin proxy path — Next.js rewrites /api/v1/* to the backend.
// Never set NEXT_PUBLIC_API_URL; use BACKEND_URL (server-side) in next.config.ts instead.
export const API_BASE = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?:   T;
  message?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options:  RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HttpOnly cookies automatically
  });

  // Token expired — try silent refresh then retry once
  if (res.status === 401) {
    // Don't attempt refresh for the refresh endpoint itself (avoid loop)
    const isRefreshEndpoint = endpoint.includes('/auth/refresh');
    if (!isRefreshEndpoint) {
      const refreshed = await silentRefresh();
      if (refreshed) {
        const retry = await fetch(url, { ...options, headers, credentials: 'include' });
        if (retry.ok) return retry.json();
      }
    }
    // Refresh failed — clear cached user and redirect to login
    clearCachedUser();
    if (typeof window !== 'undefined') {
      // Small delay so any in-flight requests can settle before redirect
      setTimeout(() => { window.location.href = '/login'; }, 100);
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Ask the backend to refresh the access cookie using the refresh cookie.
 * Both cookies are HttpOnly so JS never touches the token values directly.
 *
 * Deduped: if several requests 401 at the same time (e.g. dashboard firing
 * several endpoints in parallel), they all await the SAME refresh call
 * instead of each firing its own — this was causing the 429 storm.
 */
let _refreshInFlight: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      // If server returned fresh user data, update the UI cache
      if (data.data?.user) setCachedUser(data.data.user);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await _refreshInFlight;
  } finally {
    _refreshInFlight = null;
  }
}

/* ── Non-sensitive user cache (in-memory; no localStorage) ── */

let _cachedUser: any | null = null;

export function setCachedUser(user: any) {
  _cachedUser = {
    id:              user.id,
    firstName:       user.firstName,
    lastName:        user.lastName,
    email:           user.email,
    role:            user.role,
    avatar:          user.avatar,
    title:           user.title,
    company:         user.company,
    meritCoins:      user.meritCoins,
    profileStrength: user.profileStrength,
    interestNiche:   user.interestNiche || null,
  };
}

export function getCachedUser(): any | null {
  return _cachedUser;
}

export function clearCachedUser() {
  _cachedUser = null;
}


export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
    });
  } catch {}
  clearCachedUser();
  window.location.href = '/login';
}