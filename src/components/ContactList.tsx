"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Contact } from "./Dashboard";

interface Props {
  contacts: Contact[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  darkMode?: boolean;
}

export default function ContactList({ contacts, onAdd, onUpdate, onDelete, onReorder, darkMode }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const inputBg = darkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "border-gray-200";
  const labelColor = darkMode ? "text-gray-400" : "text-gray-400";

  function handleAdd() {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
    }
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setEditValue(contact.name);
  }

  function saveEdit(id: string) {
    setEditingId(null);
    if (editValue.trim()) {
      onUpdate(id, { name: editValue.trim() });
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const reordered = Array.from(contacts);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map((c) => c.id));
  }

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase ${labelColor} mb-2`}>
        Key Meetings ({contacts.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add meeting..."
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
        <Droppable droppableId="contacts">
          {(provided) => (
            <ul className="space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
              {contacts.map((contact, index) => (
                <Draggable key={contact.id} draggableId={contact.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-start gap-2 group ${snapshot.isDragging ? "bg-blue-50 rounded shadow-sm" : ""}`}
                    >
                      <span
                        {...provided.dragHandleProps}
                        className={`${darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-300 hover:text-gray-500"} cursor-grab mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs select-none`}
                        title="Drag to reorder"
                      >
                        &#10303;
                      </span>
                      <span className={`${darkMode ? "text-gray-500" : "text-gray-300"} mt-0.5 shrink-0`}>&#128197;</span>
                      {editingId === contact.id ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(contact.id)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(contact.id)}
                          className={`flex-1 text-sm border-b border-blue-500 outline-none bg-transparent ${darkMode ? "text-gray-100" : ""}`}
                          autoFocus
                        />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm cursor-pointer hover:text-blue-600 ${darkMode ? "text-gray-100" : ""}`}
                            onClick={() => startEdit(contact)}
                          >
                            {contact.name}
                          </span>
                          {contact.meeting_date && (
                            <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {new Date(contact.meeting_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Date picker */}
                      {contact.meeting_date ? (
                        <button
                          onClick={() => onUpdate(contact.id, { meeting_date: null })}
                          className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}
                          title="Remove date"
                        >
                          &#x2715;
                        </button>
                      ) : (
                        <label className="opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer relative" title="Set meeting date">
                          <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>&#128197;</span>
                          <input
                            type="date"
                            value=""
                            onChange={(e) => { if (e.target.value) onUpdate(contact.id, { meeting_date: e.target.value }); }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            style={{ colorScheme: darkMode ? "dark" : "light" }}
                          />
                        </label>
                      )}
                      <button
                        onClick={() => onDelete(contact.id)}
                        className={`text-sm font-bold hover:text-red-500 hover:bg-red-50 rounded px-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                        title="Delete meeting"
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
