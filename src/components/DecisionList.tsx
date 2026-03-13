"use client";

import { useState } from "react";
import type { Decision } from "./Dashboard";

interface Props {
  decisions: Decision[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Decision>) => void;
  onDelete: (id: string) => void;
}

export default function DecisionList({ decisions, onAdd, onUpdate, onDelete }: Props) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
    }
  }

  function startEdit(decision: Decision) {
    setEditingId(decision.id);
    setEditValue(decision.text);
  }

  function saveEdit(id: string) {
    setEditingId(null);
    if (editValue.trim()) {
      onUpdate(id, { text: editValue.trim() });
    }
  }

  const active = decisions.filter((d) => !d.archived);
  const archived = decisions.filter((d) => d.archived);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
        Decisions ({active.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add decision..."
          className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
        >
          +
        </button>
      </div>

      <ul className="space-y-1">
        {active.map((decision) => (
          <li key={decision.id} className="flex items-start gap-2 group">
            <span className="text-gray-300 mt-0.5 shrink-0">&#9671;</span>
            {editingId === decision.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(decision.id)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(decision.id)}
                className="flex-1 text-sm border-b border-blue-500 outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer hover:text-blue-600"
                onClick={() => startEdit(decision)}
              >
                {decision.text}
              </span>
            )}
            <button
              onClick={() => onUpdate(decision.id, { archived: true })}
              className="text-xs text-gray-300 hover:text-green-600 opacity-0 group-hover:opacity-100 shrink-0"
              title="Archive"
            >
              &#10003;
            </button>
            <button
              onClick={() => onDelete(decision.id)}
              className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"
            >
              x
            </button>
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">
            {archived.length} archived
          </summary>
          <ul className="space-y-1 mt-1">
            {archived.map((decision) => (
              <li key={decision.id} className="flex items-start gap-2 group text-gray-400">
                <span className="mt-0.5 shrink-0">&#9670;</span>
                <span className="flex-1 text-sm">{decision.text}</span>
                <button
                  onClick={() => onUpdate(decision.id, { archived: false })}
                  className="text-xs hover:text-blue-500 opacity-0 group-hover:opacity-100 shrink-0"
                  title="Restore"
                >
                  &#8634;
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
