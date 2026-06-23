import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import type { ConnectionUser } from "../types/connection";
import type {
  ConnectedUserGiftListResponse,
  GiftClaimResponse,
  GiftItem,
  GiftList
} from "../types/gift";

type GiftListAction = "reserve" | "purchase" | "cancel";

export function ConnectedUserGiftListPage() {
  const { token } = useAuth();
  const { userId, listId } = useParams();

  const [owner, setOwner] = useState<ConnectionUser | null>(null);
  const [giftList, setGiftList] = useState<GiftList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<GiftListAction | null>(null);
  const [claimQuantities, setClaimQuantities] = useState<Record<string, number>>(
    {}
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const connectedGiftListEndpoint =
  userId && listId ? `/api/gifts/users/${userId}/lists/${listId}` : "";

  async function refreshGiftList() {
    if (!token || !userId || !listId) {
    return;
  }

    const data = await apiRequest<ConnectedUserGiftListResponse>(
      connectedGiftListEndpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setOwner(data.owner);
    setGiftList(data.giftList);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadConnectedUserGiftList() {
      if (!token || !userId || !listId) {
      return;
    }

      try {
        const data = await apiRequest<ConnectedUserGiftListResponse>(
          connectedGiftListEndpoint,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (isMounted) {
          setOwner(data.owner);
          setGiftList(data.giftList);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load connected user's gift list"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadConnectedUserGiftList();

    return () => {
      isMounted = false;
    };
  }, [token, userId, listId, connectedGiftListEndpoint]);

  function getAvailableQuantity(item: GiftItem) {
    return item.claimSummary?.availableQuantity ?? item.quantity;
  }

  function getReservedQuantity(item: GiftItem) {
    return item.claimSummary?.totalReserved ?? 0;
  }

  function getPurchasedQuantity(item: GiftItem) {
    return item.claimSummary?.totalPurchased ?? 0;
  }

  function getViewerReservedQuantity(item: GiftItem) {
    return item.viewerClaimSummary?.reservedQuantity ?? 0;
  }

  function getViewerPurchasedQuantity(item: GiftItem) {
    return item.viewerClaimSummary?.purchasedQuantity ?? 0;
  }

  function getSelectedClaimQuantity(item: GiftItem) {
    const availableQuantity = getAvailableQuantity(item);
    const selectedQuantity = claimQuantities[item.id] ?? 1;

    return Math.min(Math.max(selectedQuantity, 1), availableQuantity);
  }

  function getClaimQuantityOptions(item: GiftItem) {
    const availableQuantity = getAvailableQuantity(item);

    return Array.from({ length: availableQuantity }, (_, index) => index + 1);
  }

  function updateClaimQuantity(itemId: string, quantity: number) {
    setClaimQuantities((current) => ({
      ...current,
      [itemId]: quantity
    }));
  }

  function getClaimStatusLabel(item: GiftItem) {
    const availableQuantity = getAvailableQuantity(item);
    const reservedQuantity = getReservedQuantity(item);
    const purchasedQuantity = getPurchasedQuantity(item);
    const viewerReservedQuantity = getViewerReservedQuantity(item);
    const viewerPurchasedQuantity = getViewerPurchasedQuantity(item);
    const totalClaimedQuantity = reservedQuantity + purchasedQuantity;

    if (viewerReservedQuantity > 0) {
      return viewerReservedQuantity === 1
        ? "Reserved by you"
        : `Reserved by you: ${viewerReservedQuantity}`;
    }

    if (viewerPurchasedQuantity > 0 && availableQuantity > 0) {
      return `${availableQuantity} left · you bought ${viewerPurchasedQuantity}`;
    }

    if (viewerPurchasedQuantity > 0) {
      return viewerPurchasedQuantity === 1
        ? "Purchased by you"
        : `Purchased by you: ${viewerPurchasedQuantity}`;
    }

    if (availableQuantity <= 0) {
      if (purchasedQuantity >= item.quantity) {
        return "Fully purchased";
      }

      if (purchasedQuantity > 0 && reservedQuantity > 0) {
        return "Fully claimed";
      }

      if (reservedQuantity >= item.quantity) {
        return "Fully reserved";
      }

      return "Fully claimed";
    }

    if (totalClaimedQuantity > 0) {
      if (purchasedQuantity > 0 && reservedQuantity > 0) {
        return `${availableQuantity} left · partially claimed`;
      }

      if (purchasedQuantity > 0) {
        return `${availableQuantity} left · partially purchased`;
      }

      return `${availableQuantity} left · partially reserved`;
    }

    if (availableQuantity === 1) {
      return "1 available";
    }

    return `${availableQuantity} available`;
  }

  function getClaimStatusClass(item: GiftItem) {
    const availableQuantity = getAvailableQuantity(item);
    const reservedQuantity = getReservedQuantity(item);
    const purchasedQuantity = getPurchasedQuantity(item);
    const viewerReservedQuantity = getViewerReservedQuantity(item);
    const viewerPurchasedQuantity = getViewerPurchasedQuantity(item);
    const totalClaimedQuantity = reservedQuantity + purchasedQuantity;

    if (viewerReservedQuantity > 0) {
      return "warning-pill";
    }

    if (viewerPurchasedQuantity > 0) {
      return "success-pill";
    }

    if (availableQuantity <= 0) {
      if (purchasedQuantity >= item.quantity) {
        return "success-pill";
      }

      return "claimed-pill";
    }

    if (totalClaimedQuantity > 0) {
      return "partial-pill";
    }

    return "available-pill";
  }

  async function handleReserveItem(item: GiftItem) {
    if (!token) {
      return;
    }

    const selectedQuantity = getSelectedClaimQuantity(item);

    setActionItemId(item.id);
    setActionType("reserve");
    setMessage("");
    setError("");

    try {
      await apiRequest<GiftClaimResponse>(
        `/api/gift-claims/items/${item.id}/reserve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            quantityClaimed: selectedQuantity
          })
        }
      );

      setMessage(`${item.itemName} reserved. Quantity: ${selectedQuantity}.`);
      await refreshGiftList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reserve item");
    } finally {
      setActionItemId(null);
      setActionType(null);
    }
  }

  async function handleMarkPurchased(item: GiftItem) {
    if (!token || !item.viewerClaim) {
      return;
    }

    setActionItemId(item.id);
    setActionType("purchase");
    setMessage("");
    setError("");

    try {
      await apiRequest<GiftClaimResponse>(
        `/api/gift-claims/${item.viewerClaim.id}/purchase`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(`${item.itemName} marked as purchased.`);
      await refreshGiftList();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark item purchased"
      );
    } finally {
      setActionItemId(null);
      setActionType(null);
    }
  }

  async function handleCancelReservation(item: GiftItem) {
    if (!token || !item.viewerClaim) {
      return;
    }

    setActionItemId(item.id);
    setActionType("cancel");
    setMessage("");
    setError("");

    try {
      await apiRequest<GiftClaimResponse>(
        `/api/gift-claims/${item.viewerClaim.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(`${item.itemName} reservation cancelled.`);
      await refreshGiftList();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel reservation"
      );
    } finally {
      setActionItemId(null);
      setActionType(null);
    }
  }

  function renderClaimControls(item: GiftItem) {
    const availableQuantity = getAvailableQuantity(item);
    const viewerReservedQuantity = getViewerReservedQuantity(item);
    const viewerPurchasedQuantity = getViewerPurchasedQuantity(item);
    const isWorking = actionItemId === item.id;
    const isReserving = isWorking && actionType === "reserve";
    const isPurchasing = isWorking && actionType === "purchase";
    const isCancelling = isWorking && actionType === "cancel";

    if (viewerReservedQuantity > 0 && item.viewerClaim) {
      return (
        <div className="claim-control-panel reserved-panel">
          <div className="claim-control-copy">
            <span className="warning-pill">
              {viewerReservedQuantity === 1
                ? "Reserved by you"
                : `Reserved by you: ${viewerReservedQuantity}`}
            </span>

            <p>
              You reserved {viewerReservedQuantity}. Mark it purchased once you
              buy it, or cancel the reservation to release the quantity.
            </p>
          </div>

          <div className="claim-button-row">
            <button
              type="button"
              onClick={() => handleMarkPurchased(item)}
              disabled={isWorking}
            >
              {isPurchasing ? "Marking Purchased..." : "Mark Purchased"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => handleCancelReservation(item)}
              disabled={isWorking}
            >
              {isCancelling ? "Cancelling..." : "Cancel Reservation"}
            </button>
          </div>
        </div>
      );
    }

    if (availableQuantity <= 0) {
      if (viewerPurchasedQuantity > 0) {
        return (
          <div className="claim-control-panel purchased-panel">
            <span className="success-pill">
              {viewerPurchasedQuantity === 1
                ? "Purchased by you"
                : `Purchased by you: ${viewerPurchasedQuantity}`}
            </span>

            <p>
              You purchased {viewerPurchasedQuantity}. No additional quantity is
              currently available for this item.
            </p>
          </div>
        );
      }

      return (
        <div className="claim-control-panel fully-claimed-panel">
          <span className="claimed-pill">Fully claimed</span>

          <p>
            No quantity is currently available for this item. Check the
            alternatives if the owner provided any.
          </p>
        </div>
      );
    }

    return (
      <div className="claim-control-panel available-panel">
        <div className="claim-control-copy">
          {viewerPurchasedQuantity > 0 ? (
            <span className="success-pill">
              Purchased by you: {viewerPurchasedQuantity}
            </span>
          ) : (
            <span className="available-pill">
              {availableQuantity === 1
                ? "1 available"
                : `${availableQuantity} available`}
            </span>
          )}

          <p>
            {viewerPurchasedQuantity > 0
              ? "Additional quantity is still available. You can reserve more if you plan to buy another."
              : "Choose how many you plan to reserve. The gift owner will not see your reservation."}
          </p>
        </div>

        <div className="claim-reserve-controls">
          <label>
            Quantity
            <select
              value={getSelectedClaimQuantity(item)}
              onChange={(event) =>
                updateClaimQuantity(item.id, Number(event.target.value))
              }
              disabled={isWorking}
            >
              {getClaimQuantityOptions(item).map((quantity) => (
                <option value={quantity} key={quantity}>
                  {quantity}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => handleReserveItem(item)}
            disabled={isWorking}
          >
            {isReserving
              ? "Reserving..."
              : viewerPurchasedQuantity > 0
                ? `Reserve ${getSelectedClaimQuantity(item)} More`
                : `Reserve ${getSelectedClaimQuantity(item)}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Connected Gift List</p>
            <h1>{owner ? `${owner.displayName}'s list.` : "Gift list."}</h1>
            <p className="hero-text">
              View gift ideas from a connected user. You can reserve or purchase
              items without revealing the surprise to the gift-list owner.
            </p>

            {giftList && (
              <p className="hero-text">
                Viewing: <strong>{giftList.title}</strong>
                {giftList.occasion ? ` · ${giftList.occasion}` : ""}
              </p>
            )}

            {owner?.giftNote && (
              <p className="connected-gift-note">{owner.giftNote}</p>
            )}
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

      <section className="preview-table-card connected-list-card">
        <div className="table-header">
          <div>
            <p className="section-label">Gift Ideas</p>
            <h2>{giftList?.title || "Selected Gift List"}</h2>
          </div>

          <span className="status-pill">{giftList?.items.length || 0} Items</span>
        </div>

        {isLoading ? (
          <p className="hero-text">Loading gift list...</p>
        ) : !giftList ? (
          <div className="empty-state">
            <h3>No list found.</h3>
            <p>This user does not have an available gift list yet.</p>
          </div>
        ) : giftList.items.length === 0 ? (
          <div className="empty-state">
            <h3>No gift ideas yet.</h3>
            <p>This user has not added any active gift ideas to this list.</p>
          </div>
        ) : (
          <div className="gift-item-list">
            {giftList.items.map((item) => (
              <article className="gift-item-card" key={item.id}>
                <div className="gift-item-header">
                  <div>
                    <h3>{item.itemName}</h3>
                    <p>Quantity wanted: {item.quantity}</p>
                  </div>

                  <span className={getClaimStatusClass(item)}>
                    {getClaimStatusLabel(item)}
                  </span>
                </div>

                <div className="claim-summary-grid">
                  <div>
                    <span>Available</span>
                    <strong>{getAvailableQuantity(item)}</strong>
                  </div>

                  <div>
                    <span>Reserved</span>
                    <strong>{item.claimSummary?.totalReserved ?? 0}</strong>
                  </div>

                  <div>
                    <span>Purchased</span>
                    <strong>{item.claimSummary?.totalPurchased ?? 0}</strong>
                  </div>
                </div>

                {item.itemDescription && <p>{item.itemDescription}</p>}

                {item.itemLink && (
                  <a href={item.itemLink} target="_blank" rel="noreferrer">
                    View item link
                  </a>
                )}

                {item.alternatives.length > 0 && (
                  <div className="alternative-display">
                    <p className="section-label">Alternatives</p>

                    {item.alternatives.map((alternative) => (
                      <div
                        className="alternative-display-card"
                        key={alternative.id}
                      >
                        <strong>{alternative.name}</strong>

                        {alternative.description && (
                          <p>{alternative.description}</p>
                        )}

                        {alternative.link && (
                          <a
                            href={alternative.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View alternative
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {renderClaimControls(item)}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}