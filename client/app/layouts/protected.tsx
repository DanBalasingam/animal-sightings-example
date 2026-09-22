import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/protected";
// import { getCurrentUser } from "~/auth/session";

// export async function clientLoader({ request }: Route.ClientLoaderArgs) {
//   const user = await getCurrentUser();
//   if (!user) {
//     const from = new URL(request.url).pathname;
//     throw redirect(`/login?redirectTo=${encodeURIComponent(from)}`);
//   }
//   return { user };
// }

export default function ProtectedLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      {/*<nav>{loaderData.user.name}</nav>*/}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
