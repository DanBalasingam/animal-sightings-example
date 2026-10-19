import { Link } from "react-router";

export function meta() {
  return [{ title: 'Page not found | NZ Animal Sightings' }];
}

export default function NotFound() {
  return (
    <div className="container-center">
      <h1>404</h1>
      <p>Page not found.</p>
      <p><Link to="/">Return to the home page</Link></p>
    </div>
  );
}
