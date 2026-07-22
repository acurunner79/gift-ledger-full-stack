import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import type { GiftItem, GiftList, GiftPriority } from "../types/gift";
import type { GiftListDetailResponse } from "../types/list";

type CreateGiftItemResponse = {
  giftItem: GiftItem;
};

type UpdateGiftItemResponse = {
  giftItem: GiftItem;
};

type ArchiveGiftItemResponse = {
  giftItem: GiftItem;
};

type AlternativeFormInput = {
  name: string;
  link: string;
  description: string;
};

type PriorityFilter = "ALL" | GiftPriority;

type GiftSortMode =
  | "PRIORITY"
  | "NEWEST"
  | "QUANTITY_HIGH"
  | "QUANTITY_LOW"
  | "NAME";

export function MyListDetailPage() {
  const { token } = useAuth();
  const { listId } = useParams();

  const [giftList, setGiftList] = useState<GiftList | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemLink, setItemLink] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<GiftPriority>("MEDIUM");
  const [alternatives, setAlternatives] = useState<AlternativeFormInput[]>([]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemLink, setEditItemLink] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editAlternatives, setEditAlternatives] = useState<
    AlternativeFormInput[]
  >([]);
  const [editPriority, setEditPriority] = useState<GiftPriority>("MEDIUM");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [archivingItemId, setArchivingItemId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [giftSearchQuery, setGiftSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [giftSortMode, setGiftSortMode] = useState<GiftSortMode>("PRIORITY");

  async function loadGiftList() {
    if (!token || !listId) {
      return;
    }

    const data = await apiRequest<GiftListDetailResponse>(
      `/api/lists/${listId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setGiftList(data.giftList);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialGiftList() {
      if (!token || !listId) {
        return;
      }

      try {
        const data = await apiRequest<GiftListDetailResponse>(
          `/api/lists/${listId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (isMounted) {
          setGiftList(data.giftList);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load list");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialGiftList();

    return () => {
      isMounted = false;
    };
  }, [token, listId]);

  function cleanAlternatives(values: AlternativeFormInput[]) {
    return values
      .map((alternative) => ({
        name: alternative.name.trim(),
        link: alternative.link.trim() ? alternative.link : null,
        description: alternative.description.trim()
          ? alternative.description
          : null
      }))
      .filter((alternative) => alternative.name.length > 0);
  }

  function addAlternative() {
    setAlternatives((current) => [
      ...current,
      {
        name: "",
        link: "",
        description: ""
      }
    ]);
  }

  function removeAlternative(indexToRemove: number) {
    setAlternatives((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

  function updateAlternative(
    indexToUpdate: number,
    field: keyof AlternativeFormInput,
    value: string
  ) {
    setAlternatives((current) =>
      current.map((alternative, index) =>
        index === indexToUpdate
          ? {
              ...alternative,
              [field]: value
            }
          : alternative
      )
    );
  }

  function addEditAlternative() {
    setEditAlternatives((current) => [
      ...current,
      {
        name: "",
        link: "",
        description: ""
      }
    ]);
  }

  function removeEditAlternative(indexToRemove: number) {
    setEditAlternatives((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

  function updateEditAlternative(
    indexToUpdate: number,
    field: keyof AlternativeFormInput,
    value: string
  ) {
    setEditAlternatives((current) =>
      current.map((alternative, index) =>
        index === indexToUpdate
          ? {
              ...alternative,
              [field]: value
            }
          : alternative
      )
    );
  }

  function resetGiftItemForm() {
    setItemName("");
    setItemLink("");
    setItemDescription("");
    setQuantity(1);
    setPriority("MEDIUM");
    setAlternatives([]);
  }

  function startEditingItem(item: GiftItem) {
    setEditingItemId(item.id);
    setEditItemName(item.itemName);
    setEditItemLink(item.itemLink || "");
    setEditItemDescription(item.itemDescription || "");
    setEditQuantity(item.quantity);
    setEditPriority(item.priority || "MEDIUM");
    setEditAlternatives(
      item.alternatives.map((alternative) => ({
        name: alternative.name,
        link: alternative.link || "",
        description: alternative.description || ""
      }))
    );
    setMessage("");
    setError("");
  }

  function cancelEditingItem() {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemLink("");
    setEditItemDescription("");
    setEditQuantity(1);
    setEditPriority("MEDIUM");
    setEditAlternatives([]);
  }

  async function handleCreateGiftItem(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !listId) {
      return;
    }

    setIsCreatingItem(true);
    setMessage("");
    setError("");

    try {
      await apiRequest<CreateGiftItemResponse>(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itemName,
          itemLink: itemLink.trim() ? itemLink : null,
          itemDescription: itemDescription.trim() ? itemDescription : null,
          quantity,
          priority,
          alternatives: cleanAlternatives(alternatives)
        })
      });

      resetGiftItemForm();
      setMessage("Gift item added to this list.");
      await loadGiftList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift item");
    } finally {
      setIsCreatingItem(false);
    }
  }

  async function handleUpdateGiftItem(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !listId || !editingItemId) {
      return;
    }

    setSavingItemId(editingItemId);
    setMessage("");
    setError("");

    try {
      await apiRequest<UpdateGiftItemResponse>(
        `/api/lists/${listId}/items/${editingItemId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            itemName: editItemName,
            itemLink: editItemLink.trim() ? editItemLink : null,
            itemDescription: editItemDescription.trim()
              ? editItemDescription
              : null,
            quantity: editQuantity,
            priority: editPriority,
            alternatives: cleanAlternatives(editAlternatives)
          })
        }
      );

      setMessage("Gift item updated.");
      cancelEditingItem();
      await loadGiftList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setSavingItemId(null);
    }
  }

  async function handleArchiveGiftItem(item: GiftItem) {
    if (!token || !listId) {
      return;
    }

    const confirmed = window.confirm(
      `Archive "${item.itemName}" from this list?`
    );

    if (!confirmed) {
      return;
    }

    setArchivingItemId(item.id);
    setMessage("");
    setError("");

    try {
      await apiRequest<ArchiveGiftItemResponse>(
        `/api/lists/${listId}/items/${item.id}/archive`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Gift item archived.");
      await loadGiftList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive item");
    } finally {
      setArchivingItemId(null);
    }
  }

function formatPriorityLabel(value?: GiftPriority | null) {
  const safePriority = value || "MEDIUM";

  if (safePriority === "HIGH") {
    return "High";
  }

  if (safePriority === "LOW") {
    return "Low";
  }

  return "Medium";
}

function getPriorityClass(value?: GiftPriority | null) {
  const safePriority = value || "MEDIUM";

  return `priority-badge ${safePriority.toLowerCase()}`;
}

function getPriorityRank(value?: GiftPriority | null) {
  const safePriority = value || "MEDIUM";

  if (safePriority === "HIGH") {
    return 1;
  }

  if (safePriority === "MEDIUM") {
    return 2;
  }

  return 3;
}

function getFilteredAndSortedGiftItems() {
  if (!giftList) {
    return [];
  }

  const normalizedSearchQuery = giftSearchQuery.trim().toLowerCase();

  return [...giftList.items]
    .filter((item) => {
      const itemPriority = item.priority || "MEDIUM";

      if (priorityFilter !== "ALL" && itemPriority !== priorityFilter) {
        return false;
      }

      if (!normalizedSearchQuery) {
        return true;
      }

      const searchableText = [
        item.itemName,
        item.itemDescription || "",
        item.itemLink || "",
        ...item.alternatives.map((alternative) => alternative.name),
        ...item.alternatives.map((alternative) => alternative.description || "")
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    })
    .sort((firstItem, secondItem) => {
      if (giftSortMode === "PRIORITY") {
        const priorityDifference =
          getPriorityRank(firstItem.priority) - getPriorityRank(secondItem.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          new Date(secondItem.createdAt).getTime() -
          new Date(firstItem.createdAt).getTime()
        );
      }

      if (giftSortMode === "NEWEST") {
        return (
          new Date(secondItem.createdAt).getTime() -
          new Date(firstItem.createdAt).getTime()
        );
      }

      if (giftSortMode === "QUANTITY_HIGH") {
        return secondItem.quantity - firstItem.quantity;
      }

      if (giftSortMode === "QUANTITY_LOW") {
        return firstItem.quantity - secondItem.quantity;
      }

      return firstItem.itemName.localeCompare(secondItem.itemName);
    });
}

const filteredGiftItems = getFilteredAndSortedGiftItems();

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">My List</p>
            <h1>{giftList?.title || "Gift list."}</h1>
            <p className="hero-text">
              {giftList?.description ||
                "Review and add gift ideas stored in this list."}
            </p>

            {giftList?.occasion && (
              <span className="status-pill">{giftList.occasion}</span>
            )}
          </div>

          <Link className="button-link secondary-button" to="/lists">
            Back to My Lists
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

      <section className="list-detail-stack">
          <form
            className="settings-card add-item-panel compact-add-item-panel"
            onSubmit={handleCreateGiftItem}
          >
            <div className="compact-add-item-header">
              <div>
                <p className="section-label">Add Item</p>
                <h2>New gift idea</h2>
                <p className="compact-add-item-copy">
                  This item will be added directly to{" "}
                  <strong>{giftList?.title || "this list"}</strong>.
                </p>
              </div>

              <button
                type="submit"
                className="compact-add-item-submit"
                disabled={isCreatingItem || !giftList}
              >
                {isCreatingItem ? "Adding Item..." : "Add Item to List"}
              </button>
            </div>

            <div className="compact-add-item-grid">
              <label className="compact-field">
                Item name
                <input
                  type="text"
                  value={itemName}
                  onChange={(event) => setItemName(event.target.value)}
                  placeholder="LEGO set, headphones, tool kit..."
                  maxLength={120}
                  required
                />
              </label>

              <label className="compact-field">
                Item link
                <input
                  type="url"
                  value={itemLink}
                  onChange={(event) => setItemLink(event.target.value)}
                  placeholder="https://example.com/item"
                  maxLength={500}
                />
              </label>

              <label className="compact-field compact-priority">
                Priority
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as GiftPriority)}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </label>

              <label className="compact-field compact-quantity">
                Quantity
                <input
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  min={1}
                  max={99}
                  required
                />
              </label>

              <label className="compact-field compact-description">
                Description
                <textarea
                  value={itemDescription}
                  onChange={(event) => setItemDescription(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="Optional notes, size, color, model, or preference details."
                />
              </label>
            </div>

            <details className="compact-alternatives-drawer">
              <summary>
                <span>Alternatives</span>
                <small>Optional backup options</small>
              </summary>

              <div className="compact-alternatives-body">
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={addAlternative}
                >
                  Add Alternative
                </button>

                {alternatives.length === 0 ? (
                  <p className="hero-text compact-empty-text">
                    No alternatives added.
                  </p>
                ) : (
                  <div className="alternative-form-list">
                    {alternatives.map((alternative, index) => (
                      <div className="alternative-form-card" key={index}>
                        <label>
                          Alternative name
                          <input
                            type="text"
                            value={alternative.name}
                            onChange={(event) =>
                              updateAlternative(index, "name", event.target.value)
                            }
                            maxLength={120}
                            required
                          />
                        </label>

                        <label>
                          Alternative link
                          <input
                            type="url"
                            value={alternative.link}
                            onChange={(event) =>
                              updateAlternative(index, "link", event.target.value)
                            }
                            maxLength={500}
                          />
                        </label>

                        <label>
                          Alternative description
                          <textarea
                            value={alternative.description}
                            onChange={(event) =>
                              updateAlternative(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                            rows={3}
                            maxLength={500}
                          />
                        </label>

                        <button
                          type="button"
                          className="secondary-button compact-button"
                          onClick={() => removeAlternative(index)}
                        >
                          Remove Alternative
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </form>

        <section className="preview-table-card connected-list-card gift-ideas-panel">
          <div className="table-header">
            <div>
              <p className="section-label">Gift Ideas</p>
              <h2>{giftList?.title || "Selected List"}</h2>
            </div>

            <span className="status-pill">
              {giftList?.items.length || 0} Items
            </span>
          </div>

          {giftList && giftList.items.length > 0 && (
          <div className="gift-table-controls">
            <label>
              Search
              <input
                type="search"
                value={giftSearchQuery}
                onChange={(event) => setGiftSearchQuery(event.target.value)}
                placeholder="Search items, notes, links, or alternatives..."
              />
            </label>

            <label>
              Priority
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as PriorityFilter)
                }
              >
                <option value="ALL">All priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>

            <label>
              Sort
              <select
                value={giftSortMode}
                onChange={(event) =>
                  setGiftSortMode(event.target.value as GiftSortMode)
                }
              >
                <option value="PRIORITY">Priority</option>
                <option value="NEWEST">Newest</option>
                <option value="QUANTITY_HIGH">Quantity: High to Low</option>
                <option value="QUANTITY_LOW">Quantity: Low to High</option>
                <option value="NAME">Name</option>
              </select>
            </label>

            <span className="filter-results-pill">
              {filteredGiftItems.length} of {giftList.items.length} shown
            </span>
          </div>
        )}

          {isLoading ? (
            <p className="hero-text">Loading list...</p>
          ) : !giftList ? (
            <div className="empty-state">
              <h3>List not found.</h3>
              <p>This list may have been removed or is unavailable.</p>
            </div>
          ) : giftList.items.length === 0 ? (
            <div className="empty-state">
              <h3>No items yet.</h3>
              <p>Add the first gift idea using the form on this page.</p>
            </div>
          ) : filteredGiftItems.length === 0 ? (
            <div className="empty-state">
              <h3>No matching gift ideas.</h3>
              <p>Adjust the search or priority filter to show more items.</p>
            </div>
          ) : (
            <div className="gift-ideas-table-wrap">
              <table className="gift-ideas-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Qty</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGiftItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isSaving = savingItemId === item.id;
                    const isArchiving = archivingItemId === item.id;

                    if (isEditing) {
                      return (
                        <tr className="gift-ideas-edit-row" key={item.id}>
                          <td colSpan={7}>
                            <article className="gift-item-card editing">
                              <form
                                className="item-edit-form"
                                onSubmit={handleUpdateGiftItem}
                              >
                                <div className="gift-item-header">
                                  <div>
                                    <p className="section-label">Edit Item</p>
                                    <h3>{item.itemName}</h3>
                                  </div>

                                  <span className="warning-pill">Editing</span>
                                </div>

                                <label>
                                  Item name
                                  <input
                                    type="text"
                                    value={editItemName}
                                    onChange={(event) =>
                                      setEditItemName(event.target.value)
                                    }
                                    maxLength={120}
                                    required
                                  />
                                </label>

                                <label>
                                  Item link
                                  <input
                                    type="url"
                                    value={editItemLink}
                                    onChange={(event) =>
                                      setEditItemLink(event.target.value)
                                    }
                                    maxLength={500}
                                  />
                                </label>

                                <label>
                                  Description
                                  <textarea
                                    value={editItemDescription}
                                    onChange={(event) =>
                                      setEditItemDescription(event.target.value)
                                    }
                                    rows={4}
                                    maxLength={1000}
                                  />
                                </label>

                                <label>
                                  Quantity
                                  <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(event) =>
                                      setEditQuantity(Number(event.target.value))
                                    }
                                    min={1}
                                    max={99}
                                    required
                                  />
                                </label>

                                <label className="edit-priority-field">
                                 Priority
                                  <select
                                    value={editPriority}
                                    onChange={(event) => setEditPriority(event.target.value as GiftPriority)}
                                  >
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                  </select>
                                </label>

                                <div className="alternative-form-section">
                                  <div className="alternative-form-header">
                                    <div>
                                      <p className="section-label">Alternatives</p>
                                      <h3>Edit backup options</h3>
                                    </div>

                                    <button
                                      type="button"
                                      className="secondary-button compact-button"
                                      onClick={addEditAlternative}
                                    >
                                      Add Alternative
                                    </button>
                                  </div>

                                  {editAlternatives.length === 0 ? (
                                    <p className="hero-text">No alternatives added.</p>
                                  ) : (
                                    <div className="alternative-form-list">
                                      {editAlternatives.map((alternative, index) => (
                                        <div
                                          className="alternative-form-card"
                                          key={index}
                                        >
                                          <label>
                                            Alternative name
                                            <input
                                              type="text"
                                              value={alternative.name}
                                              onChange={(event) =>
                                                updateEditAlternative(
                                                  index,
                                                  "name",
                                                  event.target.value
                                                )
                                              }
                                              maxLength={120}
                                              required
                                            />
                                          </label>

                                          <label>
                                            Alternative link
                                            <input
                                              type="url"
                                              value={alternative.link}
                                              onChange={(event) =>
                                                updateEditAlternative(
                                                  index,
                                                  "link",
                                                  event.target.value
                                                )
                                              }
                                              maxLength={500}
                                            />
                                          </label>

                                          <label>
                                            Alternative description
                                            <textarea
                                              value={alternative.description}
                                              onChange={(event) =>
                                                updateEditAlternative(
                                                  index,
                                                  "description",
                                                  event.target.value
                                                )
                                              }
                                              rows={3}
                                              maxLength={500}
                                            />
                                          </label>

                                          <button
                                            type="button"
                                            className="secondary-button compact-button"
                                            onClick={() => removeEditAlternative(index)}
                                          >
                                            Remove Alternative
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="item-card-actions">
                                  <button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                  </button>

                                  <button
                                    type="button"
                                    className="secondary-button compact-button"
                                    onClick={cancelEditingItem}
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </article>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.itemName}</strong>

                          {item.alternatives.length > 0 && (
                            <p className="table-subtext">
                              {item.alternatives.length} alternative
                              {item.alternatives.length === 1 ? "" : "s"}
                            </p>
                          )}
                        </td>

                        <td>
                          {item.itemDescription ? (
                            <span>{item.itemDescription}</span>
                          ) : (
                            <span className="table-muted">No description</span>
                          )}
                        </td>

                        <td>
                          <span className={getPriorityClass(item.priority)}>
                            {formatPriorityLabel(item.priority)}
                          </span>
                        </td>

                        <td>{item.quantity}</td>

                        <td>
                          {item.itemLink ? (
                            <a href={item.itemLink} target="_blank" rel="noreferrer">
                              View link
                            </a>
                          ) : (
                            <span className="table-muted">None</span>
                          )}
                        </td>

                        <td>
                          <span className="status-pill">Active</span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="secondary-button compact-button"
                              onClick={() => startEditingItem(item)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="secondary-button compact-button"
                              onClick={() => handleArchiveGiftItem(item)}
                              disabled={isArchiving}
                            >
                              {isArchiving ? "Archiving..." : "Archive"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  );
}