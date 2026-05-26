/**
 * api.ts — Secure fetch wrapper
 *
 * Auth strategy: HttpOnly cookies (sh_access + sh_refresh)
 * - Tokens are NEVER stored in localStorage or JS-readable storage
 * - The browser sends cookies automatically on every request
 * - credentials: 'include' is required for cross-origin cookie sending
 * - Non-sensitive user data (name, role) is cached in localStorage for instant UI
 */

// In production the frontend and backend are on different domains (e.g. Vercel + Render).
// Set NEXT_PUBLIC_API_URL to the full backend URL e.g. https://skillhub-u918.onrender.com
// In local dev it falls back to the relative path which next.config.ts proxies to localhost:5000.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

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
    credentials: 'include',
  });

  if (res.status === 401) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      const retry = await fetch(url, { ...options, headers, credentials: 'include' });
      if (retry.ok) return retry.json();
      if (retry.status === 401) {
        clearCachedUser();
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      clearCachedUser();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json();
}

async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.data?.user) setCachedUser(data.data.user);
    return true;
  } catch {
    return false;
  }
}

const USER_KEY = 'sh_user';

export function setCachedUser(user: any) {
  if (typeof window === 'undefined') return;
  const safe = {
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
  };
  localStorage.setItem(USER_KEY, JSON.stringify(safe));
}

export function getCachedUser(): any | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY);
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