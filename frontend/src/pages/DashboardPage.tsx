import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import { getThemeByPreference } from "../themes";
import type {
  ConnectedGiftListGroup,
  ConnectedGiftListsResponse,
  GiftListSummary,
  GiftListsResponse
} from "../types/list";

export function DashboardPage() {
  const { user, token } = useAuth();

  const [myGiftLists, setMyGiftLists] = useState<GiftListSummary[]>([]);
  const [connectedGiftLists, setConnectedGiftLists] = useState<
    ConnectedGiftListGroup[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!token) {
        return;
      }

      try {
        const [myListsData, connectedListsData] = await Promise.all([
          apiRequest<GiftListsResponse>("/api/lists", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          apiRequest<ConnectedGiftListsResponse>("/api/lists/connected", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        if (isMounted) {
          setMyGiftLists(myListsData.giftLists);
          setConnectedGiftLists(connectedListsData.connectedGiftLists);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!user) {
    return null;
  }

  const currentTheme = getThemeByPreference(user.themePreference);

  const totalMyItems = myGiftLists.reduce(
    (sum, giftList) => sum + giftList._count.items,
    0
  );

  const totalConnectedUsers = connectedGiftLists.length;

  const totalConnectedLists = connectedGiftLists.reduce(
    (sum, group) => sum + group.giftLists.length,
    0
  );

  const totalConnectedItems = connectedGiftLists.reduce(
    (sum, group) =>
      sum +
      group.giftLists.reduce(
        (listSum, giftList) => listSum + giftList._count.items,
        0
      ),
    0
  );

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Gift Ledger Dashboard</p>
            <h1>Welcome, {user.displayName}.</h1>
            <p className="hero-text">
              Manage your lists, review connected gift lists, and jump directly
              into the next action. Active theme:{" "}
              <strong>{currentTheme.name}</strong>.
            </p>
          </div>

          <div className="dashboard-actions">
            <Link className="button-link secondary-button" to="/lists">
              My Lists
            </Link>

            <Link className="button-link secondary-button" to="/connections">
              Connections
            </Link>

            <Link className="button-link secondary-button" to="/settings">
              Settings
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="action-message error-message" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <span>My Lists</span>
          <strong>{myGiftLists.length}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>My Active Items</span>
          <strong>{totalMyItems}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>Connected Users</span>
          <strong>{totalConnectedUsers}</strong>
        </article>

        <article className="dashboard-stat-card">
          <span>Connected Items</span>
          <strong>{totalConnectedItems}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <section className="preview-table-card dashboard-panel">
          <div className="table-header">
            <div>
              <p className="section-label">My Gift Lists</p>
              <h2>Your lists</h2>
            </div>

            <Link className="button-link secondary-button compact-button" to="/lists">
              Manage Lists
            </Link>
          </div>

          {isLoading ? (
            <p className="hero-text">Loading your lists...</p>
          ) : myGiftLists.length === 0 ? (
            <div className="empty-state">
              <h3>No lists yet.</h3>
              <p>Create your first list to start organizing gift ideas.</p>

              <Link className="button-link secondary-button" to="/lists">
                Create List
              </Link>
            </div>
          ) : (
            <div className="dashboard-list-stack">
              {myGiftLists.slice(0, 5).map((giftList) => (
                <article className="dashboard-list-card" key={giftList.id}>
                  <div>
                    <div className="dashboard-list-title-row">
                      <h3>{giftList.title}</h3>

                      {giftList.isDefault && (
                        <span className="success-pill compact-pill">
                          Default
                        </span>
                      )}
                    </div>

                    <p>
                      {giftList.occasion || "General"} ·{" "}
                      {giftList._count.items} items
                    </p>
                  </div>

                  <Link
                    className="button-link secondary-button compact-button"
                    to={`/lists/${giftList.id}`}
                  >
                    Open
                  </Link>
                </article>
              ))}

              {myGiftLists.length > 5 && (
                <Link className="button-link secondary-button" to="/lists">
                  View all {myGiftLists.length} lists
                </Link>
              )}
            </div>
          )}
        </section>

        <section className="preview-table-card dashboard-panel">
          <div className="table-header">
            <div>
              <p className="section-label">Connected Gift Lists</p>
              <h2>People connected to you</h2>
            </div>

            <Link
              className="button-link secondary-button compact-button"
              to="/connections"
            >
              Manage Connections
            </Link>
          </div>

          {isLoading ? (
            <p className="hero-text">Loading connected lists...</p>
          ) : connectedGiftLists.length === 0 ? (
            <div className="empty-state">
              <h3>No connected users yet.</h3>
              <p>
                Connect with another user to view their gift lists from the
                dashboard.
              </p>

              <Link className="button-link secondary-button" to="/connections">
                Find Connections
              </Link>
            </div>
          ) : (
            <div className="dashboard-list-stack">
              {connectedGiftLists.map((group) => (
                <article className="connected-dashboard-card" key={group.user.id}>
                  <div className="connected-dashboard-header">
                    <div>
                      <h3>{group.user.displayName}</h3>
                      <p>{group.user.email}</p>
                    </div>

                    <span className="status-pill">
                      {group.giftLists.length} Lists
                    </span>
                  </div>

                  {group.giftLists.length === 0 ? (
                    <p className="hero-text">
                      This user has not created any named lists yet.
                    </p>
                  ) : (
                    <div className="connected-dashboard-list">
                      {group.giftLists.slice(0, 4).map((giftList) => (
                        <div
                          className="connected-dashboard-list-row"
                          key={giftList.id}
                        >
                          <div>
                            <strong>{giftList.title}</strong>
                            <span>
                              {giftList.occasion || "General"} ·{" "}
                              {giftList._count.items} items
                            </span>
                          </div>

                          <Link
                            className="button-link secondary-button compact-button"
                            to={`/connections/${group.user.id}/lists/${giftList.id}`}
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="preview-table-card dashboard-panel">
        <div className="table-header">
          <div>
            <p className="section-label">Quick Actions</p>
            <h2>Next steps</h2>
          </div>

          <span className="status-pill">{totalConnectedLists} Connected Lists</span>
        </div>

        <div className="dashboard-quick-actions">
          <Link className="button-link secondary-button" to="/lists">
            Create or Manage Lists
          </Link>

          <Link className="button-link secondary-button" to="/connections">
            Review Connections
          </Link>

          <Link className="button-link secondary-button" to="/settings">
            Update Profile
          </Link>
        </div>
      </section>
    </>
  );
}