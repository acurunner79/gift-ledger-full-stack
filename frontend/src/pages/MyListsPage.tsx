import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import type {
  CreateGiftListResponse,
  GiftListSummary,
  GiftListsResponse,
  UpdateGiftListResponse
} from "../types/list";

export function MyListsPage() {
  const { token } = useAuth();

  const [giftLists, setGiftLists] = useState<GiftListSummary[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");

  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOccasion, setEditOccasion] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingListId, setSavingListId] = useState<string | null>(null);
  const [settingDefaultListId, setSettingDefaultListId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadGiftLists() {
    if (!token) {
      return;
    }

    const data = await apiRequest<GiftListsResponse>("/api/lists", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setGiftLists(data.giftLists);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialGiftLists() {
      if (!token) {
        return;
      }

      try {
        const data = await apiRequest<GiftListsResponse>("/api/lists", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (isMounted) {
          setGiftLists(data.giftLists);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load gift lists"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialGiftLists();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleCreateList(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsCreating(true);
    setMessage("");
    setError("");

    try {
      await apiRequest<CreateGiftListResponse>("/api/lists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description: description.trim() ? description : null,
          occasion: occasion.trim() ? occasion : null
        })
      });

      setTitle("");
      setDescription("");
      setOccasion("");
      setMessage("Gift list created.");
      await loadGiftLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create gift list");
    } finally {
      setIsCreating(false);
    }
  }

  function startEditingList(giftList: GiftListSummary) {
    setEditingListId(giftList.id);
    setEditTitle(giftList.title);
    setEditDescription(giftList.description || "");
    setEditOccasion(giftList.occasion || "");
    setMessage("");
    setError("");
  }

  function cancelEditingList() {
    setEditingListId(null);
    setEditTitle("");
    setEditDescription("");
    setEditOccasion("");
  }

  async function handleUpdateList(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !editingListId) {
      return;
    }

    setSavingListId(editingListId);
    setMessage("");
    setError("");

    try {
      await apiRequest<UpdateGiftListResponse>(`/api/lists/${editingListId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription.trim() ? editDescription : null,
          occasion: editOccasion.trim() ? editOccasion : null
        })
      });

      setMessage("Gift list updated.");
      cancelEditingList();
      await loadGiftLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update gift list");
    } finally {
      setSavingListId(null);
    }
  }

  async function handleSetDefault(listId: string) {
    if (!token) {
      return;
    }

    setSettingDefaultListId(listId);
    setMessage("");
    setError("");

    try {
      await apiRequest<UpdateGiftListResponse>(`/api/lists/${listId}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage("Default gift list updated.");
      await loadGiftLists();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set default gift list"
      );
    } finally {
      setSettingDefaultListId(null);
    }
  }

  return (
    <>
      <section className="hero-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">My Lists</p>
            <h1>Organize your gift ideas.</h1>
            <p className="hero-text">
              Create named gift lists for holidays, birthdays, projects, or any
              occasion you want to track separately.
            </p>
          </div>
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

      <section className="my-lists-stack">
        <form className="settings-card create-list-panel" onSubmit={handleCreateList}>
          <p className="section-label">Create List</p>
          <h2>New gift list</h2>
          <p>
            Give the list a clear name so connected users know what they are
            viewing later.
          </p>

          <label>
            List name
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Christmas 2026"
              maxLength={80}
              required
            />
          </label>

          <label>
            Occasion
            <input
              type="text"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
              placeholder="Christmas, Birthday, House, General..."
              maxLength={80}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Optional notes about this list."
            />
          </label>

          <button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create List"}
          </button>
        </form>

      <section className="preview-table-card list-library-panel">
        <div className="table-header">
          <div>
            <p className="section-label">List Library</p>
            <h2>Your gift lists</h2>
          </div>

          <span className="status-pill">{giftLists.length} Lists</span>
        </div>

        {isLoading ? (
          <p className="hero-text">Loading gift lists...</p>
        ) : giftLists.length === 0 ? (
          <div className="empty-state">
            <h3>No gift lists yet.</h3>
            <p>Create your first named list to start organizing items.</p>
          </div>
        ) : (
         <div className="list-library-table-wrap">
          <table className="list-library-table">
            <thead>
              <tr>
                <th>List</th>
                <th>Occasion</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {giftLists.map((giftList) => {
                const isEditing = editingListId === giftList.id;
                const isSaving = savingListId === giftList.id;
                const isSettingDefault = settingDefaultListId === giftList.id;

                if (isEditing) {
                  return (
                    <tr className="list-library-edit-row" key={giftList.id}>
                      <td colSpan={5}>
                        <form
                          className="list-library-card editing"
                          onSubmit={handleUpdateList}
                        >
                          <label>
                            List name
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(event) => setEditTitle(event.target.value)}
                              maxLength={80}
                              required
                            />
                          </label>

                          <label>
                            Occasion
                            <input
                              type="text"
                              value={editOccasion}
                              onChange={(event) => setEditOccasion(event.target.value)}
                              maxLength={80}
                            />
                          </label>

                          <label>
                            Description
                            <textarea
                              value={editDescription}
                              onChange={(event) =>
                                setEditDescription(event.target.value)
                              }
                              rows={3}
                              maxLength={500}
                            />
                          </label>

                          <div className="list-card-actions">
                            <button type="submit" disabled={isSaving}>
                              {isSaving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              className="secondary-button compact-button"
                              onClick={cancelEditingList}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={giftList.id}>
                    <td>
                      <strong>{giftList.title}</strong>

                      {giftList.description ? (
                        <p className="table-subtext">{giftList.description}</p>
                      ) : (
                        <p className="table-muted">No description</p>
                      )}
                    </td>

                    <td>
                      <strong>{giftList.occasion || "General"}</strong>
                    </td>

                    <td>
                      <strong>{giftList._count.items}</strong>
                    </td>

                    <td>
                      {giftList.isDefault ? (
                        <span className="success-pill compact-pill">Default</span>
                      ) : (
                        <span className="status-pill">Active</span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        <Link
                          className="button-link secondary-button compact-button"
                          to={`/lists/${giftList.id}`}
                        >
                          Open
                        </Link>

                        <button
                          type="button"
                          className="secondary-button compact-button"
                          onClick={() => startEditingList(giftList)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="secondary-button compact-button"
                          onClick={() => handleSetDefault(giftList.id)}
                          disabled={giftList.isDefault || isSettingDefault}
                        >
                          {giftList.isDefault
                            ? "Default"
                            : isSettingDefault
                              ? "Setting..."
                              : "Set Default"}
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