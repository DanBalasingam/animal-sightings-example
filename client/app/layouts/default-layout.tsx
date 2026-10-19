import { Outlet } from "react-router";
import type { Route } from "./+types/default-layout";
import { getUser } from "../lib/auth";
import NavHeader from "./header";
import "./layout.css";

export async function clientLoader(_: Route.ClientLoaderArgs) {
  return { user: await getUser() };
}

export default function DefaultLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <NavHeader />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
