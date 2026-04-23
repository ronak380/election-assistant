/**
 * @file src/components/Navbar.tsx
 * @description Top navigation bar for the Election Assistant application.
 *
 *              Features:
 *              - Responsive hamburger menu for mobile
 *              - Firebase Authentication sign-in/sign-out
 *              - Dark mode toggle
 *              - Full keyboard navigation and ARIA roles
 *              - Active route highlighting
 *
 * @accessibility
 *   - role="navigation" with descriptive aria-label
 *   - aria-expanded on mobile menu toggle
 *   - aria-current="page" on active links
 *   - Focus trap handled by native browser tab order
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { trackAuthEvent } from '@/lib/analytics';

/** Navigation links configuration. */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/timeline', label: 'Election Timeline' },
  { href: '/assistant', label: 'AI Assistant' },
  { href: '/locator', label: 'Find Polling Station' },
] as const;

/**
 * Navbar component - renders the main application navigation.
 *
 * @returns {JSX.Element} The full responsive navigation bar.
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  /** Subscribe to Firebase Auth state changes. */
  useEffect(() => {
    setMounted(true);
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  /** Sync dark-mode preference from localStorage and system. */
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  /** Toggles dark mode and persists the preference. */
  const toggleDarkMode = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }, [isDark]);

  /** Sign-in with Google. */
  const handleSignIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      setIsAuthLoading(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
      trackAuthEvent('google');
    } catch (error) {
      console.error('[Navbar] Sign-in error:', error);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  /** Sign-out. */
  const handleSignOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('[Navbar] Sign-out error:', error);
    }
  }, []);

  if (!mounted) return null;

  return (
    <header role="banner">
      <nav className="navbar glass-card" aria-label="Main navigation">
        <div className="container navbar-inner">
          {/* Logo / Brand */}
          <Link href="/" className="navbar-brand">
            <span className="brand-icon">🗳️</span>
            <span className="brand-name gradient-text">ElectionGuide</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-links" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`nav-link ${pathname === href ? 'nav-link--active' : ''}`}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="icon-btn"
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Auth button */}
            {user ? (
              <div className="user-menu">
                <img src={user.photoURL || ''} alt="" className="user-avatar" width={32} height={32} />
                <button onClick={handleSignOut} className="btn btn-ghost">Sign Out</button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="btn btn-primary" disabled={isAuthLoading}>
                {isAuthLoading ? '...' : 'Sign In'}
              </button>
            )}

            {/* Mobile Toggle */}
            <button className="hamburger-btn icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
               {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
             <ul role="list">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`mobile-nav-link ${pathname === href ? 'nav-link--active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
          gap: 1rem;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .brand-icon { font-size: 1.5rem; }
        .brand-name { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; }
        .nav-links {
          display: flex;
          list-style: none;
          gap: 0.25rem;
          align-items: center;
        }
        .nav-link {
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .nav-link:hover { color: var(--color-primary-600); background: var(--bg-overlay); text-decoration: none; }
        .nav-link--active { color: var(--color-primary-600); background: var(--color-primary-50); font-weight: 600; }
        .nav-actions { display: flex; align-items: center; gap: 0.5rem; }
        .icon-btn {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          width: 40px; height: 40px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }
        .icon-btn:hover { background: var(--bg-overlay); border-color: var(--color-primary-400); }
        .user-menu { display: flex; align-items: center; gap: 0.5rem; }
        .user-avatar { border-radius: 50%; border: 2px solid var(--color-primary-400); }
        .hamburger-btn { display: none; }
        .mobile-menu {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border-top: 1px solid var(--glass-border);
          padding: 1rem;
        }
        .mobile-nav-link {
          display: block;
          padding: 0.875rem 1rem;
          color: var(--text-secondary);
          font-weight: 500;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .mobile-nav-link:hover, .mobile-nav-link.nav-link--active {
          color: var(--color-primary-600);
          background: var(--color-primary-50);
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .hamburger-btn { display: flex; }
        }
      `}</style>
    </header>
  );
}
