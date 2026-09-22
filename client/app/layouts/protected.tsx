import { Outlet } from "react-router";
// import { getCurrentUser } from "~/auth/session";

// export async function clientLoader({ request }: Route.ClientLoaderArgs) {
//   const user = await getCurrentUser();
//   if (!user) {
//     const from = new URL(request.url).pathname;
//     throw redirect(`/login?redirectTo=${encodeURIComponent(from)}`);
//   }
//   return { user };
// }

export default function ProtectedLayout() {
  return (
    <div>
      {/*<nav>{loaderData.user.name}</nav>*/}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
