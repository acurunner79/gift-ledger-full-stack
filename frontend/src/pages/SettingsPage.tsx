import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import {
  appThemes,
  getThemeByPreference,
  type ThemePreference
} from "../themes";
import type { AuthUser } from "../types/auth";

type SettingsResponse = {
  user: AuthUser;
};

export function SettingsPage() {
  const { user, token, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [giftNote, setGiftNote] = useState(user?.giftNote || "");
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    user?.themePreference || "NORTH_POLE"
  );

  const [profileMessage, setProfileMessage] = useState("");
  const [appearanceMessage, setAppearanceMessage] = useState("");
  const [error, setError] = useState("");

  if (!user || !token) {
    return null;
  }

  const selectedTheme = getThemeByPreference(themePreference);
  const currentUserTheme = getThemeByPreference(user.themePreference);

  async function handleProfileSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setProfileMessage("");

    try {
      const data = await apiRequest<SettingsResponse>(
        "/api/settings/profile",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            displayName,
            giftNote: giftNote.trim() ? giftNote : null
          })
        }
      );

      updateUser(data.user);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
    }
  }

  async function handleAppearanceSubmit(
    event: SyntheticEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setAppearanceMessage("");

    try {
      const data = await apiRequest<SettingsResponse>(
        "/api/settings/appearance",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            themePreference
          })
        }
      );

      updateUser(data.user);
      setAppearanceMessage("Theme updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Theme update failed");
    }
  }

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Command preferences.</h1>
            <p className="hero-text">
              Update your profile, appearance, and account settings.
            </p>
          </div>

          <Link className="button-link secondary-button" to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </section>

      {error && <p className="form-error settings-error">{error}</p>}

      <section className="settings-grid">
        <form className="settings-card" onSubmit={handleProfileSubmit}>
          <p className="section-label">Profile</p>
          <h2>Public gift profile</h2>
          <p>
            This information helps connected users understand your gift
            preferences.
          </p>

          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>

          <label>
            Gift note
            <textarea
              value={giftNote}
              onChange={(event) => setGiftNote(event.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Example: I like practical gifts, tech, tools, and Star Wars items."
            />
          </label>

          {profileMessage && <p className="form-success">{profileMessage}</p>}

          <button type="submit">Save Profile</button>
        </form>

        <form className="settings-card" onSubmit={handleAppearanceSubmit}>
          <p className="section-label">Appearance</p>
          <h2>Theme selection</h2>
          <p>{selectedTheme.description}</p>

          <div className="theme-grid">
            {appThemes.map((theme) => (
              <button
                key={theme.key}
                type="button"
                className={
                  theme.key === themePreference
                    ? "theme-option active"
                    : "theme-option"
                }
                onClick={() => setThemePreference(theme.key)}
              >
                <span>{theme.name}</span>
                <small>{theme.key.replaceAll("_", " ")}</small>
              </button>
            ))}
          </div>

          {appearanceMessage && (
            <p className="form-success">{appearanceMessage}</p>
          )}

          <button type="submit">Save Theme</button>
        </form>

        <section className="settings-card">
          <p className="section-label">Account</p>
          <h2>Login details</h2>
          <p>
            Account security controls will live here. Email and password updates
            will be added after the core gift-list flow is stable.
          </p>

          <div className="account-detail">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="account-detail">
            <span>Current theme</span>
            <strong>{currentUserTheme.name}</strong>
          </div>
        </section>
      </section>
    </>
  );
}