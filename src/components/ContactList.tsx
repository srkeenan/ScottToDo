"use client";

import { useState } from "react";
import type { Contact } from "./Dashboard";

interface Props {
  contacts: Contact[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
  onDelete: (id: string) => void;
}

export default function ContactList({ contacts, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Contact>>({});

  function handleAdd() {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName("");
    }
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setEditFields({
      name: contact.name,
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
    });
  }

  function saveEdit(id: string) {
    setEditingId(null);
    onUpdate(id, editFields);
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
        Upcoming Meetings ({contacts.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add meeting..."
          className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
        >
          +
        </button>
      </div>

      <ul className="space-y-2">
        {contacts.map((contact) => (
          <li key={contact.id} className="group">
            {editingId === contact.id ? (
              <div className="space-y-1 text-sm bg-gray-50 p-2 rounded">
                <input
                  value={editFields.name || ""}
                  onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                  placeholder="Name"
                  className="w-full px-1 border-b border-blue-400 outline-none bg-transparent"
                  autoFocus
                />
                <input
                  value={editFields.role || ""}
                  onChange={(e) => setEditFields({ ...editFields, role: e.target.value })}
                  placeholder="Role"
                  className="w-full px-1 border-b border-gray-200 outline-none bg-transparent text-gray-500"
                />
                <input
                  value={editFields.email || ""}
                  onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-1 border-b border-gray-200 outline-none bg-transparent text-gray-500"
                />
                <input
                  value={editFields.phone || ""}
                  onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full px-1 border-b border-gray-200 outline-none bg-transparent text-gray-500"
                />
                <button
                  onClick={() => saveEdit(contact.id)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 flex items-start gap-2"
                onClick={() => startEdit(contact)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{contact.name}</div>
                  {contact.role && (
                    <div className="text-xs text-gray-400">{contact.role}</div>
                  )}
                  {contact.email && (
                    <div className="text-xs text-gray-400">{contact.email}</div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(contact.id);
                  }}
                  className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0 mt-1"
                >
                  x
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
