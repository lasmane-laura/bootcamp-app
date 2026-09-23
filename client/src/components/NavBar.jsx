import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/test-cases', label: 'Test Cases' },
  { to: '/test-suites', label: 'Suites' },
  { to: '/test-runs', label: 'Runs' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
          <Logo />
          QA Command Center
        </Link>

        <button
          type="button"
          className="nav-hamburger"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-links${mobileOpen ? ' open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
