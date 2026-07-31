let _token: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function setToken(t: string | null) {
  _token = t;
}

export function getToken() {
  return _token;
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    _token = data.accessToken;
    return _token;
  } catch {
    return null;
  }
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  issues?: unknown[];
}

export async function api<T = unknown>(
  url: string,
  opts: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (_token) headers["authorization"] = `Bearer ${_token}`;

  let res = await fetch(url, {
    ...opts,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && _token) {
    // Try a single refresh, deduplicate concurrent refreshes
    if (!_refreshPromise) _refreshPromise = refreshToken();
    const newToken = await _refreshPromise;
    _refreshPromise = null;

    if (newToken) {
      headers["authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...opts, headers, credentials: "include" });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const issues: unknown[] = body?.issues ?? [];
    const err: ApiError = {
      status: res.status,
      error: body?.error ?? "ERROR",
      message:
        issues.length > 0
          ? String((issues[0] as { message?: string }).message ?? body?.message ?? res.statusText)
          : (body?.message ?? res.statusText),
      issues,
    };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
