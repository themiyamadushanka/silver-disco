"use client";

import React from "react";

export default function ItemCard({ item, onToggle, onDelete }) {
  return (
    <div className="item-row" id={`item-row-${item.id}`}>
      <div className="item-info">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggle(item.id, !item.completed)}
          className="item-checkbox"
          id={`item-checkbox-${item.id}`}
        />
        <div>
          <div className={`item-title ${item.completed ? "completed" : ""}`}>
            {item.title}
          </div>
          {item.description && (
            <div className="item-desc">{item.description}</div>
          )}
        </div>
      </div>
      <button
        className="btn btn-danger btn-icon-sm"
        onClick={() => onDelete(item.id)}
        title="Delete item"
        id={`btn-delete-${item.id}`}
      >
        ✕
      </button>
    </div>
  );
}
