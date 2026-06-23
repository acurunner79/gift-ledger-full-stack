import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import type {
  ConnectionListResponse,
  ConnectionRequestResponse,
  ConnectionSearchResponse,
  ConnectionSummary,
  ConnectionUser
} from "../types/connection";
import type {
  ConnectedGiftListGroup,
  ConnectedGiftListsResponse
} from "../types/list";

export function ConnectionsPage() {
  const { token } = useAuth();

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<ConnectionUser | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [canSendRequest, setCanSendRequest] = useState(false);

  const [acceptedConnections, setAcceptedConnections] = useState<
    ConnectionSummary[]
  >([]);
  const [incomingRequests, setIncomingRequests] = useState<
    ConnectionSummary[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    ConnectionSummary[]
  >([]);
  const [connectedGiftLists, setConnectedGiftLists] = useState<
    ConnectedGiftListGroup[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadConnections() {
    if (!token) {
      return;
    }

    setError("");

    const [connectionsData, connectedListsData] = await Promise.all([
      apiRequest<ConnectionListResponse>("/api/connections", {
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

    setAcceptedConnections(connectionsData.acceptedConnections);
    setIncomingRequests(connectionsData.incomingRequests);
    setOutgoingRequests(connectionsData.outgoingRequests);
    setConnectedGiftLists(connectedListsData.connectedGiftLists);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialConnections() {
      if (!token) {
        return;
      }

      try {
        const [connectionsData, connectedListsData] = await Promise.all([
          apiRequest<ConnectionListResponse>("/api/connections", {
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
          setAcceptedConnections(connectionsData.acceptedConnections);
          setIncomingRequests(connectionsData.incomingRequests);
          setOutgoingRequests(connectionsData.outgoingRequests);
          setConnectedGiftLists(connectedListsData.connectedGiftLists);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load connections"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialConnections();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function getConnectedGiftListGroup(userId: string) {
    return connectedGiftLists.find((group) => group.user.id === userId);
  }

  async function handleSearch(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setMessage("");
    setError("");
    setSearchResult(null);
    setSearchStatus("");
    setCanSendRequest(false);

    try {
      const data = await apiRequest<ConnectionSearchResponse>(
        `/api/connections/search?email=${encodeURIComponent(searchEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!data.user) {
        setSearchStatus("No user found with that email.");
        return;
      }

      setSearchResult(data.user);

      if (data.existingConnection) {
        setSearchStatus(`Connection status: ${data.existingConnection.status}`);
        setCanSendRequest(false);
      } else {
        setSearchStatus("User found. You can send a connection request.");
        setCanSendRequest(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function handleSendRequest(email: string) {
    if (!token) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest<ConnectionRequestResponse>("/api/connections/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email
        })
      });

      setMessage("Connection request sent.");
      setSearchResult(null);
      setSearchStatus("");
      setCanSendRequest(false);
      setSearchEmail("");
      await loadConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send connection request"
      );
    }
  }

  async function handleAccept(connectionId: string) {
    if (!token) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest<{ connection: ConnectionSummary }>(
        `/api/connections/${connectionId}/accept`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Connection accepted.");
      await loadConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept connection"
      );
    }
  }

  async function handleDecline(connectionId: string) {
    if (!token) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await apiRequest<{ message: string }>(
        `/api/connections/${connectionId}/decline`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Connection request declined.");
      await loadConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decline connection"
      );
    }
  }

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Connections</p>
            <h1>Choose your circle.</h1>
            <p className="hero-text">
              Connect with trusted users and open their named gift lists.
            </p>
          </div>

          <Link className="button-link secondary-button" to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </section>

      {error && (
        <div className="action-message error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="action-message success-message" role="status">
          {message}
        </div>
      )}

      <section className="connections-layout">
        <form className="settings-card" onSubmit={handleSearch}>
          <p className="section-label">Find User</p>
          <h2>Search by email</h2>
          <p>
            Search for another user and send a request. They must accept before
            gift lists are shared.
          </p>

          <label>
            User email
            <input
              type="email"
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
              placeholder="friend@example.com"
              required
            />
          </label>

          <button type="submit">Search User</button>

          {searchStatus && <p className="connection-status">{searchStatus}</p>}

          {searchResult && (
            <div className="connection-card">
              <div>
                <strong>{searchResult.displayName}</strong>
                <p>{searchResult.email}</p>
              </div>

              {canSendRequest ? (
                <button
                  type="button"
                  onClick={() => handleSendRequest(searchResult.email)}
                >
                  Send Request
                </button>
              ) : (
                <span className="status-pill">No action needed</span>
              )}
            </div>
          )}
        </form>

        <section className="settings-card">
          <p className="section-label">Incoming Requests</p>
          <h2>Requests to review</h2>

          {isLoading ? (
            <p>Loading connections...</p>
          ) : incomingRequests.length === 0 ? (
            <p>No incoming requests.</p>
          ) : (
            <div className="connection-list">
              {incomingRequests.map((connection) => (
                <div className="connection-card" key={connection.id}>
                  <div>
                    <strong>{connection.user.displayName}</strong>
                    <p>{connection.user.email}</p>
                  </div>

                  <div className="connection-actions">
                    <button
                      type="button"
                      onClick={() => handleAccept(connection.id)}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleDecline(connection.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="settings-card">
          <p className="section-label">Connected Users</p>
          <h2>Accepted connections</h2>

          {acceptedConnections.length === 0 ? (
            <p>No connected users yet.</p>
          ) : (
            <div className="connection-list">
              {acceptedConnections.map((connection) => {
                const giftListGroup = getConnectedGiftListGroup(
                  connection.user.id
                );

                return (
                  <div className="connection-card named-list-connection-card" key={connection.id}>
                    <div className="connection-card-main">
                      <strong>{connection.user.displayName}</strong>
                      <p>{connection.user.email}</p>

                      {connection.user.giftNote && (
                        <small>{connection.user.giftNote}</small>
                      )}

                      <div className="connected-named-list-stack">
                        {!giftListGroup ||
                        giftListGroup.giftLists.length === 0 ? (
                          <p className="hero-text">
                            This user has not created any named lists yet.
                          </p>
                        ) : (
                          giftListGroup.giftLists.map((giftList) => (
                            <div
                              className="connected-named-list-row"
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
                                to={`/connections/${connection.user.id}/lists/${giftList.id}`}
                              >
                                View
                              </Link>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <span className="success-pill compact-pill">Connected</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="settings-card">
          <p className="section-label">Outgoing Requests</p>
          <h2>Awaiting response</h2>

          {outgoingRequests.length === 0 ? (
            <p>No outgoing requests.</p>
          ) : (
            <div className="connection-list">
              {outgoingRequests.map((connection) => (
                <div className="connection-card" key={connection.id}>
                  <div>
                    <strong>{connection.user.displayName}</strong>
                    <p>{connection.user.email}</p>
                  </div>

                  <span className="warning-pill">Pending</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}