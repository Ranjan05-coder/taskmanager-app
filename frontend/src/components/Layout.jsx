import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const icons = {
  home: '⊡',
  projects: '◫',
  logout: '→'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>◈</span> Task<span>Flow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Navigation</div>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            ⊡ &nbsp;Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
            ◫ &nbsp;Projects
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="nav-item" onClick={handleLogout}>
            → &nbsp;Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
