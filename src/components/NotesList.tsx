"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Note } from "./Dashboard";

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  darkMode?: boolean;
}

export default function NotesList({ notes, onAdd, onUpdate, onDelete, onReorder, darkMode }: Props) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const inputBg = darkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "border-gray-200";
  const labelColor = darkMode ? "text-gray-400" : "text-gray-400";

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

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const reordered = Array.from(notes);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map((n) => n.id));
  }

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase ${labelColor} mb-2`}>
        Notes ({notes.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add note..."
          className={`flex-1 text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${inputBg}`}
        />
        <button
          onClick={handleAdd}
          className={`text-sm px-2 py-1 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
        >
          +
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="notes">
          {(provided) => (
            <ul className="space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
              {notes.map((note, index) => (
                <Draggable key={note.id} draggableId={note.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group flex items-start gap-2 ${snapshot.isDragging ? "bg-blue-50 rounded shadow-sm" : ""}`}
                    >
                      <span
                        {...provided.dragHandleProps}
                        className={`${darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-300 hover:text-gray-500"} cursor-grab mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs select-none`}
                        title="Drag to reorder"
                      >
                        &#10303;
                      </span>
                      {editingId === note.id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(note.id)}
                          className={`flex-1 text-sm border rounded px-2 py-1 outline-none resize-none ${darkMode ? "border-blue-400 bg-gray-700 text-gray-100" : "border-blue-400"}`}
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <p
                          className={`flex-1 text-sm cursor-pointer hover:text-blue-600 whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                          onClick={() => startEdit(note)}
                        >
                          {note.text}
                        </p>
                      )}
                      <button
                        onClick={() => onDelete(note.id)}
                        className={`text-sm font-bold hover:text-red-500 hover:bg-red-50 rounded px-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                        title="Delete note"
                      >
                        &#10005;
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
