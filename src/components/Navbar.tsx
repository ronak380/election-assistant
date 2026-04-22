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
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  /** Subscribe to Firebase Auth state changes. */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
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

  /**
   * Toggles dark mode and persists the preference to localStorage.
   */
  const toggleDarkMode = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }, [isDark]);

  /**
   * Initiates Google Sign-In via Firebase Authentication popup.
   * Tracks the authentication event for GA4 analytics.
   */
  const handleSignIn = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      trackAuthEvent('google');
    } catch (error) {
      console.error('[Navbar] Sign-in error:', error);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  /**
   * Signs the current user out of Firebase Authentication.
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(getFirebaseAuth());
      setIsMenuOpen(false);
    } catch (error) {
      console.error('[Navbar] Sign-out error:', error);
    }
  }, []);

  return (
    <header role="banner">
      <nav
        className="navbar"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container navbar-inner">
          {/* Brand / Logo */}
          <Link
            href="/"
            className="navbar-brand"
            aria-label="ElectionGuide — Go to homepage"
          >
            <span className="brand-icon" aria-hidden="true">🗳️</span>
            <span className="brand-name gradient-text">ElectionGuide</span>
          </Link>

          {/* Desktop Navigation Links */}
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

          {/* Right actions */}
          <div className="nav-actions">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="icon-btn"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              id="dark-mode-toggle"
            >
              <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            </button>

            {/* Auth button */}
            {user ? (
              <div className="user-menu">
                <img
                  src={user.photoURL ?? '/icons/avatar.png'}
                  alt={`Signed in as ${user.displayName ?? 'User'}`}
                  className="user-avatar"
                  width={36}
                  height={36}
                />
                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost"
                  aria-label="Sign out of your account"
                  id="sign-out-btn"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="btn btn-primary"
                disabled={isAuthLoading}
                aria-label="Sign in with Google"
                aria-busy={isAuthLoading}
                id="sign-in-btn"
              >
                {isAuthLoading ? (
                  <span className="spinner" aria-hidden="true" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign In
                  </>
                )}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="hamburger-btn icon-btn"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              id="mobile-menu-toggle"
            >
              <span aria-hidden="true">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="false"
            aria-label="Navigation menu"
          >
            <ul role="list">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`mobile-nav-link ${pathname === href ? 'nav-link--active' : ''}`}
                    aria-current={pathname === href ? 'page' : undefined}
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
