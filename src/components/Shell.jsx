import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function Shell({ children }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">AQUILE ADMIN</div>
        <nav className="nav">
          <Link to="/" aria-current={location.pathname === '/'}>
            Articoli
          </Link>
          <Link to="/articles/new">Nuovo articolo</Link>
        </nav>
        <button
          type="button"
          className="button secondary"
          onClick={() => supabase.auth.signOut()}
        >
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
