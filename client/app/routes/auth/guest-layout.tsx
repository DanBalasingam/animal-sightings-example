import { Outlet, redirect } from 'react-router';
import type { Route } from './+types/guest-layout';
import { getUser, safeRedirect } from '../../lib/auth';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  if (await getUser()) {
    throw redirect(safeRedirect(new URL(request.url).searchParams.get('redirectTo')));
  }
  return null;
}

export default function GuestLayout() {
  return <Outlet />;
}
