// import type { Route } from './+types/home';
// import { authed } from '../lib/auth';
// import { api } from '../lib/api';
import { useUser } from '../lib/use-user';

// export async function clientLoader({ request }: Route.ClientLoaderArgs) {
//   return authed(request, () => api<{ items: string[] }>('/items'));
// }

export default function Home() {
  const user = useUser();

  return (
    <div className="container">
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}
