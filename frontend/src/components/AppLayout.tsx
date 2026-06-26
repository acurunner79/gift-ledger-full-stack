import type { CSSProperties } from "react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { appThemes } from "../themes";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeTheme =
    appThemes.find((theme) => theme.key === user?.themePreference) ??
    appThemes[0];

  const themeStyle = {
    "--color-background": activeTheme.tokens.background,
    "--color-surface": activeTheme.tokens.surface,
    "--color-surface-alt": activeTheme.tokens.surfaceAlt,
    "--color-primary": activeTheme.tokens.primary,
    "--color-secondary": activeTheme.tokens.secondary,
    "--color-accent": activeTheme.tokens.accent,
    "--color-text": activeTheme.tokens.text,
    "--color-muted-text": activeTheme.tokens.mutedText,
    "--color-border": activeTheme.tokens.border,
    "--color-success": activeTheme.tokens.success,
    "--color-warning": activeTheme.tokens.warning,
    "--color-danger": activeTheme.tokens.danger
  } as CSSProperties;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function navLinkClass({ isActive }: { isActive: boolean }) {
    return isActive ? "nav-link active" : "nav-link";
  }

  return (
    <div className="app-shell" style={themeStyle}>
      <header className="app-nav">
        <div className="app-nav-brand-row">
          <Link
            className="app-brand"
            to="/dashboard"
            onClick={closeMobileMenu}
          >
            <span className="brand-mark">GL</span>
            <span>Gift Ledger</span>
          </Link>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={isMobileMenuOpen ? "app-nav-menu open" : "app-nav-menu"}>
          <nav className="nav-links" aria-label="Main navigation">
            <NavLink
              to="/dashboard"
              className={navLinkClass}
              onClick={closeMobileMenu}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/lists"
              className={navLinkClass}
              onClick={closeMobileMenu}
            >
              My Lists
            </NavLink>

            <NavLink
              to="/connections"
              className={navLinkClass}
              onClick={closeMobileMenu}
            >
              Connections
            </NavLink>

            <NavLink
              to="/settings"
              className={navLinkClass}
              onClick={closeMobileMenu}
            >
              Settings
            </NavLink>
          </nav>

          <div className="app-nav-user">
            <span>{user?.displayName || "Gift Ledger User"}</span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}