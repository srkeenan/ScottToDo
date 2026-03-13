"use client";

import { useState } from "react";
import type { Project, Todo, Decision, Contact, Note } from "./Dashboard";
import TodoList from "./TodoList";
import DecisionList from "./DecisionList";
import ContactList from "./ContactList";
import NotesList from "./NotesList";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  passed: "bg-gray-200 text-gray-600",
};

const STATUS_CYCLE: Record<string, "active" | "pending" | "passed"> = {
  active: "pending",
  pending: "passed",
  passed: "active",
};

interface Props {
  project: Project;
  todos: Todo[];
  decisions: Decision[];
  contacts: Contact[];
  notes: Note[];
  onCollapse: () => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddTodo: (text: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onAddDecision: (text: string) => void;
  onUpdateDecision: (id: string, updates: Partial<Decision>) => void;
  onDeleteDecision: (id: string) => void;
  onAddContact: (name: string) => void;
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
  onAddNote: (text: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

export default function ProjectLane({
  project,
  todos,
  decisions,
  contacts,
  notes,
  onCollapse,
  onUpdateProject,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);

  function handleNameSave() {
    setEditingName(false);
    if (nameValue.trim() && nameValue !== project.name) {
      onUpdateProject({ name: nameValue.trim() });
    } else {
      setNameValue(project.name);
    }
  }

  function cycleStatus() {
    onUpdateProject({ status: STATUS_CYCLE[project.status] });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
        <button
          onClick={onCollapse}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Collapse"
        >
          &minus;
        </button>

        {editingName ? (
          <input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            className="font-semibold text-lg flex-1 border-b border-blue-500 outline-none bg-transparent"
            autoFocus
          />
        ) : (
          <h2
            className="font-semibold text-lg flex-1 cursor-pointer hover:text-blue-600"
            onClick={() => setEditingName(true)}
          >
            {project.name}
          </h2>
        )}

        <button
          onClick={cycleStatus}
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]} cursor-pointer`}
        >
          {project.status}
        </button>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <TodoList
          todos={todos}
          onAdd={onAddTodo}
          onUpdate={onUpdateTodo}
          onDelete={onDeleteTodo}
        />

        <DecisionList
          decisions={decisions}
          onAdd={onAddDecision}
          onUpdate={onUpdateDecision}
          onDelete={onDeleteDecision}
        />

        <ContactList
          contacts={contacts}
          onAdd={onAddContact}
          onUpdate={onUpdateContact}
          onDelete={onDeleteContact}
        />

        <NotesList
          notes={notes}
          onAdd={onAddNote}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
        />
      </div>
    </div>
  );
}
