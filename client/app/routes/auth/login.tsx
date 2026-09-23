import { Form, redirect, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/login';
import { api, ApiError } from '../../lib/api';
import { getUser, safeRedirect } from '../../lib/auth';
import type { LoginRequest, UserResponse } from '../../types';
import { Link } from 'react-router';

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await getUser();
  if (user) {
    const url = new URL(request.url);
    return redirect(safeRedirect(url.searchParams.get('redirectTo')));
  }
  return null;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const body: LoginRequest = {
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
  };
  try {
    await api<UserResponse>('/login', { method: 'POST', body });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  return redirect(safeRedirect(form.get('redirectTo')));
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const submitting = useNavigation().state === 'submitting';

  return (
    <div className="container">
      <h1 className="login-header">NZ Animal Sightings Dashboard</h1>
      <div className="login-box">
        <Form method='post'>
          <h2>Login</h2>
          {actionData?.error && <div className='error-box'><p role="alert" >⚠ {actionData.error}</p></div>}
          <input type="hidden" name="redirectTo" value={params.get('redirectTo') ?? '/'} />
          <div className="form-group">
            <label htmlFor="email">Email: </label>
            <input
              type="text"
              id="email"
              name="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password: </label>
            <input
              name="password"
              type="password"
              id="password"
              required
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}><span>Login</span></button>
          </div>
        </Form>
        <Link to="/register" style={{ textDecoration: "none", cursor: "pointer", color: "#404E3B" }}>Or click here to register</Link>
        <div className='break' style={{margin: "15px"}} />
        <Link to="/" style={{ textDecoration: "none", cursor: "pointer", color: "#404E3B", display: "block", textAlign: "right" }}>&larr; Back to dashboard.</Link>
      </div>
    </div>
  );
}
