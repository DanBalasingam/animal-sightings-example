import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout('routes/auth/guest-layout.tsx', [
    route("login", "routes/auth/login.tsx"),
    route("register", "routes/auth/register.tsx")
  ]),

  layout("routes/auth/auth-layout.tsx", { id: 'auth' }, [
    index("routes/home.tsx"),
  ]),

  route("unauthorized", "routes/auth/unauthorised.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
