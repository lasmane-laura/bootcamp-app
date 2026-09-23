import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

function Layout() {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
