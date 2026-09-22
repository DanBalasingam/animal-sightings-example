import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/auth/login.tsx"),
  route("unauthorized", "routes/auth/unauthorized.tsx"),

  layout("layouts/protected.tsx", [
    index("routes/home.tsx"),
    // route("settings", "routes/settings.tsx"), etc.
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
