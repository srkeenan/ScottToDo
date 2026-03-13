"use client";

import { useState } from "react";
import type { Note } from "./Dashboard";

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export default function NotesList({ notes, onAdd, onUpdate, onDelete }: Props) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditValue(note.text);
  }

  function saveEdit(id: string) {
    setEditingId(null);
    if (editValue.trim()) {
      onUpdate(id, { text: editValue.trim() });
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
        Notes ({notes.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add note..."
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
        {notes.map((note) => (
          <li key={note.id} className="group flex items-start gap-2">
            {editingId === note.id ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(note.id)}
                className="flex-1 text-sm border border-blue-400 rounded px-2 py-1 outline-none resize-none"
                rows={2}
                autoFocus
              />
            ) : (
              <p
                className="flex-1 text-sm text-gray-600 cursor-pointer hover:text-blue-600 whitespace-pre-wrap"
                onClick={() => startEdit(note)}
              >
                {note.text}
              </p>
            )}
            <button
              onClick={() => onDelete(note.id)}
              className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
