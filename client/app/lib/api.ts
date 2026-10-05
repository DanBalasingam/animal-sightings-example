export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T>(
  path: string,
  { method = 'GET', body }: { method?: Method; body?: unknown } = {},
): Promise<T> {
  // FormData sets its own multipart Content-Type (with boundary), so only JSON needs the header
  const isForm = body instanceof FormData;
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : res.statusText;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}
