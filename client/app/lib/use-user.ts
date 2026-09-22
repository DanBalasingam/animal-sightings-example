import { useRouteLoaderData } from 'react-router';
import type { clientLoader } from '../layouts/default-layout';

export function useUser() {
  const data = useRouteLoaderData<typeof clientLoader>('auth');
  if (!data) return null;
  return data.user;
}
