const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'https://api.orthoalignsolution.com';

const TOKEN_KEY = 'orthoalign_token';
export const USER_KEY = 'orthoalign_user';

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function clearAuthStorage(): void {
  setStoredToken(null);
  localStorage.removeItem(USER_KEY);
}

function handleUnauthorized(status: number, auth: boolean): void {
  if (status === 401 && auth) {
    clearAuthStorage();
    unauthorizedHandler?.();
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options;

  const headers = new Headers(initHeaders);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) || response.statusText || 'Request failed';
    const details =
      payload && typeof payload === 'object' && 'details' in payload
        ? (payload as { details: unknown }).details
        : undefined;
    handleUnauthorized(response.status, auth);
    throw new ApiError(message, response.status, details);
  }

  return payload as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'DELETE' = 'POST',
  auth = true,
): Promise<T> {
  const headers = new Headers();
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) || response.statusText || 'Request failed';
    const details =
      payload && typeof payload === 'object' && 'details' in payload
        ? (payload as { details: unknown }).details
        : undefined;
    handleUnauthorized(response.status, auth);
    throw new ApiError(message, response.status, details);
  }

  return payload as T;
}

export const api = {
  // Default auth=true; login/register pass auth=false explicitly.
  post: <T>(path: string, body: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  get: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'GET', auth }),
  put: <T>(path: string, body: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) =>
    apiRequest<T>(path, { method: 'DELETE', auth }),
  upload: apiUpload,
};

export { API_BASE, TOKEN_KEY };
