import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import type { GiftItem, GiftList } from "../types/gift";
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

export function MyListDetailPage() {
  const { token } = useAuth();
  const { listId } = useParams();

  const [giftList, setGiftList] = useState<GiftList | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemLink, setItemLink] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [alternatives, setAlternatives] = useState<AlternativeFormInput[]>([]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemLink, setEditItemLink] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editAlternatives, setEditAlternatives] = useState<
    AlternativeFormInput[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [archivingItemId, setArchivingItemId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setAlternatives([]);
  }

  function startEditingItem(item: GiftItem) {
    setEditingItemId(item.id);
    setEditItemName(item.itemName);
    setEditItemLink(item.itemLink || "");
    setEditItemDescription(item.itemDescription || "");
    setEditQuantity(item.quantity);
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

      <section className="settings-grid">
        <form className="settings-card" onSubmit={handleCreateGiftItem}>
          <p className="section-label">Add Item</p>
          <h2>New gift idea</h2>
          <p>
            This item will be added directly to{" "}
            <strong>{giftList?.title || "this list"}</strong>.
          </p>

          <label>
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

          <label>
            Item link
            <input
              type="url"
              value={itemLink}
              onChange={(event) => setItemLink(event.target.value)}
              placeholder="https://example.com/item"
              maxLength={500}
            />
          </label>

          <label>
            Description
            <textarea
              value={itemDescription}
              onChange={(event) => setItemDescription(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Optional notes, size, color, model, or preference details."
            />
          </label>

          <label>
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

          <div className="alternative-form-section">
            <div className="alternative-form-header">
              <div>
                <p className="section-label">Alternatives</p>
                <h3>Backup options</h3>
              </div>

              <button
                type="button"
                className="secondary-button compact-button"
                onClick={addAlternative}
              >
                Add Alternative
              </button>
            </div>

            {alternatives.length === 0 ? (
              <p className="hero-text">
                No alternatives added. This is optional.
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

          <button type="submit" disabled={isCreatingItem || !giftList}>
            {isCreatingItem ? "Adding Item..." : "Add Item to List"}
          </button>
        </form>

        <section className="preview-table-card connected-list-card">
          <div className="table-header">
            <div>
              <p className="section-label">Gift Ideas</p>
              <h2>{giftList?.title || "Selected List"}</h2>
            </div>

            <span className="status-pill">
              {giftList?.items.length || 0} Items
            </span>
          </div>

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
          ) : (
            <div className="gift-item-list">
              {giftList.items.map((item) => {
                const isEditing = editingItemId === item.id;
                const isSaving = savingItemId === item.id;
                const isArchiving = archivingItemId === item.id;

                if (isEditing) {
                  return (
                    <article className="gift-item-card editing" key={item.id}>
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
                            <p className="hero-text">
                              No alternatives added.
                            </p>
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
                                    onClick={() =>
                                      removeEditAlternative(index)
                                    }
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
                  );
                }

                return (
                  <article className="gift-item-card" key={item.id}>
                    <div className="gift-item-header">
                      <div>
                        <h3>{item.itemName}</h3>
                        <p>Quantity wanted: {item.quantity}</p>
                      </div>

                      <span className="status-pill">Active</span>
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

                    <div className="item-card-actions">
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
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </>
  );
}