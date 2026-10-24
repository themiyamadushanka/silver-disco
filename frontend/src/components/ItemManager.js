"use client";

import React, { useState, useEffect } from "react";
import ItemCard from "./ItemCard";
import { fetchItems, createItem, updateItem, deleteItem } from "@/lib/api";

export default function ItemManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New item form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      setError("Failed to fetch items from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      const newItem = await createItem({
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
      });
      setItems((prev) => [...prev, newItem]);
      setTitle("");
      setDescription("");
    } catch (err) {
      alert("Failed to create item: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id, newCompleted) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: newCompleted } : item
      )
    );
    try {
      await updateItem(id, { completed: newCompleted });
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, completed: !newCompleted } : item
        )
      );
      alert("Failed to update item: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic remove
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteItem(id);
    } catch (err) {
      setItems(previous);
      alert("Failed to delete item: " + err.message);
    }
  };

  return (
    <div className="card" id="items-manager-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">⚡</div>
          <div>
            <h2 className="card-title">Live Full-Stack CRUD</h2>
            <p className="stat-label">FastAPI Items Database</p>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-icon-sm"
          onClick={loadItems}
          title="Reload items"
          disabled={loading}
          id="btn-reload-items"
        >
          🔄
        </button>
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: "20px" }}>
        <div className="form-group">
          <label className="form-label">Item Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Build authentication route..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            required
            id="input-item-title"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Use JWT tokens in FastAPI"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            id="input-item-desc"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={submitting || !title.trim()}
          id="btn-add-item"
        >
          {submitting ? "Adding..." : "+ Add Item to Backend"}
        </button>
      </form>

      {/* Item List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span className="stat-label">Items ({items.length})</span>
          {items.length > 0 && (
            <span className="stat-label">
              {items.filter((i) => i.completed).length} Completed
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            Loading items from FastAPI...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "16px", color: "#f87171", fontSize: "0.88rem" }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            No items yet. Create your first item above!
          </div>
        ) : (
          <div className="items-list">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
