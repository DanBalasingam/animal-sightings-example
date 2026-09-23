import { useUser } from '../lib/use-user'
import { Link } from 'react-router'
import { logout } from '../lib/signout';
import logoMarkURL from "../assets/logo-mark.svg";

function AuthStatus() {
  const user = useUser();

  if (!user) {
    return <a className='login-btn' href="/login">Login</a>;
  }

  return (
    <>
      <span className='user-name'>{user.name}</span>
      <a className='logout-btn' onClick={logout}>Sign out</a>
    </>
  );
}

export default function NavHeader() {

  return (
    <nav>
      <Link className="logo" to="/" aria-label="home" style={{ "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "9px" }}>
        <img src={logoMarkURL} alt="" width="45" height="45" />
        <h5 className='nav-title'>NZ Animal Sightings</h5>
      </Link>
      <span className='divider' />
      <a className='btn' href='/sightings'>Sightings</a>
      <div className='user-info'>
        <AuthStatus />
      </div>
   </nav>
  )
}
