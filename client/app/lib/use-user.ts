import { useRouteLoaderData } from 'react-router';
import type { clientLoader } from '../routes/auth/auth-layout';

export function useUser() {
  const data = useRouteLoaderData<typeof clientLoader>('auth');
  if (!data) throw new Error('useUser must be used under the auth layout');
  return data.user;
}
