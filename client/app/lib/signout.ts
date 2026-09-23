import { api, ApiError } from './api';
import type { ApiResponse } from '../types';



export async function logout() {
  try {
    await api<ApiResponse>('/logout', { method: 'POST' });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  return window.location.reload();
}
