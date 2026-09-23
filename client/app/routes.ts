import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout('layouts/default-layout.tsx', { id: 'auth' }, [
    index("routes/home.tsx"),
    route("sightings", "routes/sightings.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
  layout('layouts/auth-layout.tsx', [
    route("login", "routes/auth/login.tsx"),
    route("register", "routes/auth/register.tsx"),
    route("unauthorized", "routes/auth/unauthorised.tsx"),
  ]),
] satisfies RouteConfig;
