// Minimal API client for Django backend (JWT auth)

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiErrorShape = {
  detail?: string;
  message?: string;
  non_field_errors?: string[];
  errors?: Record<string, string[]>;
  [key: string]: unknown;
};

const ACCESS_TOKEN_KEY = 'billflow_access_token';
const REFRESH_TOKEN_KEY = 'billflow_refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(tokens: { access: string; refresh: string }) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('billflow_auth');
  },
};

function getApiBaseUrl() {
  const env = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return (env || 'http://localhost:8000/api').replace(/\/$/, '');
}

function joinUrl(base: string, endpoint: string) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;

  try {
    const data = JSON.parse(text) as ApiErrorShape;
    return (
      data.detail ||
      data.message ||
      (Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : undefined) ||
      (data.errors ? Object.values(data.errors).flat().join(', ') : undefined) ||
      `Request failed (${response.status})`
    );
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) return null;

  const base = getApiBaseUrl();
  const url = joinUrl(base, '/auth/token/refresh/');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }

    const data = (await res.json()) as { access: string; refresh?: string };
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh ?? refresh });
    return data.access;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    auth?: boolean;
  } = {},
  retry = true,
): Promise<T> {
  const base = getApiBaseUrl();
  const url = joinUrl(base, endpoint);

  const authEnabled = options.auth !== false;
  const access = authEnabled ? tokenStorage.getAccessToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.status === 401 && retry && authEnabled) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return apiRequest<T>(endpoint, options, false);
  }

  if (!res.ok) {
    const errorMsg = await parseError(res);
    console.error(`API Error [${res.status}] ${url}:`, errorMsg);
    throw new Error(errorMsg);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(endpoint: string, opts?: Omit<Parameters<typeof apiRequest<T>>[1], 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...(opts ?? {}), method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, opts?: Omit<Parameters<typeof apiRequest<T>>[1], 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...(opts ?? {}), method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown, opts?: Omit<Parameters<typeof apiRequest<T>>[1], 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...(opts ?? {}), method: 'PUT', body }),
  patch: <T>(endpoint: string, body: unknown, opts?: Omit<Parameters<typeof apiRequest<T>>[1], 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...(opts ?? {}), method: 'PATCH', body }),
  delete: <T>(endpoint: string, opts?: Omit<Parameters<typeof apiRequest<T>>[1], 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...(opts ?? {}), method: 'DELETE' }),
};
