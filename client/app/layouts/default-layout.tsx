import { Outlet } from "react-router";
import type { Route } from "./+types/default-layout";
import { getUser } from "../lib/auth";
import NavHeader from "./header";

export async function clientLoader(_: Route.ClientLoaderArgs) {
  return { user: await getUser() };
}

export default function DefaultLayout() {
  return (
    <>
      <NavHeader />
      <Outlet />
    </>
  );
}
