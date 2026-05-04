const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface FetchOptions extends RequestInit {
  tenant?: string;
}

/**
 * Typed API client for communicating with the gov-platform API.
 */
export async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { tenant = 'portal', ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenant,
    ...(fetchOpts.headers as Record<string, string>),
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.error?.code ?? 'UNKNOWN', data.error?.message ?? '未知錯誤');
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Convenience methods
export const apiGet = <T>(path: string, opts?: FetchOptions) => api<T>(path, { method: 'GET', ...opts });
export const apiPost = <T>(path: string, body: unknown, opts?: FetchOptions) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts });
export const apiPatch = <T>(path: string, body: unknown, opts?: FetchOptions) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts });
export const apiPut = <T>(path: string, body?: unknown, opts?: FetchOptions) =>
  api<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...opts });
export const apiDelete = <T>(path: string, opts?: FetchOptions) =>
  api<T>(path, { method: 'DELETE', ...opts });
