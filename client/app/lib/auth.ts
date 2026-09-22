import { redirect } from 'react-router';
import { api, ApiError } from './api';
import type { User, UserResponse } from '../types';

export async function getUser(): Promise<User | null> {
  try {
    return (await api<UserResponse>('/me')).user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

function loginRedirect(request: Request): Response {
  const url = new URL(request.url);
  return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
}

export async function requireUser(request: Request): Promise<User> {
  const user = await getUser();
  if (!user) throw loginRedirect(request);
  return user;
}

export async function authed<T>(request: Request, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw loginRedirect(request);
    throw e;
  }
}

export function safeRedirect(to: FormDataEntryValue | string | null, fallback = '/'): string {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//') || to.startsWith('/\\')) {
    return fallback;
  }
  return to;
}
