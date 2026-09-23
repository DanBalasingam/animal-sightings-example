import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="container-center">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Click Here</Link><span>to return to the home page</span>
    </div>
  );
}
