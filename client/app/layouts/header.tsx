import { useUser } from '../lib/use-user'
import { Link } from 'react-router'

function AuthStatus() {
  const user = useUser();

  if (!user) {
    return <a className='login-btn' href="/login">Login</a>;
  }

  return (
    <>
      <span className='user-name'>{user.name}</span>
      <a className='logout-btn' href="/logout">Sign out</a>
    </>
  );
}

export default function NavHeader() {

  return (
    <nav>
      <Link className="logo" to="/" aria-label="home">{/* svg include */}</Link>
      <span className='Divider' />
      <div className='user-info'>
        <AuthStatus />
      </div>
   </nav>
  )
}
