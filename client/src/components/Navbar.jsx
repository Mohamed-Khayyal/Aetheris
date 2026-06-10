import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../api';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={`${styles.navbar} ${menuOpen ? styles.navbarActive : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <span className={styles.logoIcon}>⚔</span>
          <span className={styles.logoText}>AETHERIS</span>
        </Link>

        {/* Desktop Navigation links */}
        <nav className={styles.desktopLinks}>
          <Link to="https://l2aetheris.com/" className={styles.link} target="_blank" rel="noopener noreferrer">
            Website
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={styles.link}>Admin Dashboard</Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className={styles.desktopActions}>
          {user ? (
            <>
              <Link to="/profile" className={styles.userBadgeLink}>
                <div className={styles.userBadge}>
                  <div className={styles.avatar}>
                    {user.photo
                      ? <img src={getImageUrl(user.photo)} alt={user.name} />
                      : user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={`${styles.role} ${styles[user.role]}`}>{user.role}</span>
                  </div>
                </div>
              </Link>
              <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.loginBtn}>Login</Link>
              <Link to="/register" className={styles.registerBtn}>Register</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger toggle button */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* Backdrop overlay */}
      <div 
        className={`${styles.backdrop} ${menuOpen ? styles.backdropActive : ''}`} 
        onClick={() => setMenuOpen(false)} 
      />

      {/* Mobile Sidebar Drawer */}
      <div className={`${styles.mobileDrawer} ${menuOpen ? styles.drawerActive : ''}`}>
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerLogo}>
            <span className={styles.mobileDrawerLogoIcon}>⚔</span>
            <span className={styles.mobileDrawerLogoText}>AETHERIS</span>
          </div>
        </div>

        <nav className={styles.mobileLinks}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <span>⚔</span> Forum
          </Link>
          {user && (
            <Link to="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              <span>👤</span> Profile
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              <span>🛡️</span> Admin Dashboard
            </Link>
          )}
        </nav>

        {user ? (
          <div className={styles.mobileUserArea}>
            <div className={styles.mobileUserCard}>
              <div className={styles.avatar}>
                {user.photo
                  ? <img src={getImageUrl(user.photo)} alt={user.name} />
                  : user.name?.[0]?.toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={`${styles.role} ${styles[user.role]}`}>{user.role}</span>
              </div>
            </div>
            <button 
              className={styles.mobileLogoutBtn} 
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <div className={styles.mobileAuthBtns}>
            <Link to="/login" className={styles.mobileLoginBtn} onClick={() => setMenuOpen(false)}>
              🔑 Login
            </Link>
            <Link to="/register" className={styles.mobileRegisterBtn} onClick={() => setMenuOpen(false)}>
              🛡️ Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
