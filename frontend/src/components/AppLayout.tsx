import type { CSSProperties } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { appThemes } from "../themes";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="app-shell" style={themeStyle}>
      <header className="app-nav">
        <Link className="app-brand" to="/dashboard">
          <span className="app-brand-mark">GL</span>
          <span>Gift Ledger</span>
        </Link>

        <nav className="app-nav-links" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/lists"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            My Lists
          </NavLink>

          <NavLink
            to="/connections"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            Connections
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            Settings
          </NavLink>
        </nav>

        <div className="app-nav-user">
          <span>{user?.displayName || "User"}</span>

          <button
            type="button"
            className="nav-logout-button secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}