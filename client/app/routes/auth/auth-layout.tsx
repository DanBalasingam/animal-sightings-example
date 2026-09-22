import { Outlet } from 'react-router';
import type { Route } from './+types/auth-layout';
import { requireUser } from '../../lib/auth';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  return { user: await requireUser(request) };
}

export default function AuthLayout() {
  return <Outlet />;
}
