import type { CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import { getThemeByPreference } from "../themes";

export function PublicLayout() {
  const activeTheme = getThemeByPreference("NORTH_POLE");

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

  return (
    <div className="public-shell" style={themeStyle}>
      <Outlet />
    </div>
  );
}