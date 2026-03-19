"use client";

import { useState } from "react";
import type { Project, Todo, Decision, Contact, Note } from "./Dashboard";
import TodoList from "./TodoList";
import DecisionList from "./DecisionList";
import ContactList from "./ContactList";
import NotesList from "./NotesList";

const STATUS_COLORS: Record<string, Record<string, string>> = {
  light: {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    passed: "bg-gray-200 text-gray-600",
  },
  dark: {
    active: "bg-green-900 text-green-300",
    pending: "bg-yellow-900 text-yellow-300",
    passed: "bg-gray-700 text-gray-400",
  },
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
  onReorderTodos: (orderedIds: string[]) => void;
  onAddDecision: (text: string) => void;
  onUpdateDecision: (id: string, updates: Partial<Decision>) => void;
  onDeleteDecision: (id: string) => void;
  onReorderDecisions: (orderedIds: string[]) => void;
  onAddContact: (name: string) => void;
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
  onReorderContacts: (orderedIds: string[]) => void;
  onAddNote: (text: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onReorderNotes: (orderedIds: string[]) => void;
  darkMode?: boolean;
  isThisWeek?: (dateStr: string | null) => boolean;
  laneColor?: { bg: string; border: string; text: string; accent: string; darkBg: string; darkBorder: string; darkText: string };
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
  onReorderTodos,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
  onReorderDecisions,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onReorderContacts,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes,
  darkMode,
  isThisWeek,
  laneColor,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);

  const mode = darkMode ? "dark" : "light";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const headerBorder = darkMode ? "border-gray-700" : "border-gray-100";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const collapseColor = darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600";

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
    <div className={`${cardBg} rounded-lg shadow-sm border ${cardBorder} h-full flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${headerBorder} flex items-center gap-2 shrink-0 ${laneColor ? (darkMode ? `${laneColor.darkBg} ${laneColor.darkBorder}` : `${laneColor.bg} ${laneColor.border}`) : ""}`}>
        <button
          onClick={onCollapse}
          className={`${collapseColor} text-lg leading-none hidden md:block`}
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
            className={`font-semibold text-lg flex-1 border-b border-blue-500 outline-none bg-transparent ${textColor}`}
            autoFocus
          />
        ) : (
          <h2
            className={`font-semibold text-lg flex-1 cursor-pointer hover:text-blue-600 ${textColor}`}
            onClick={() => setEditingName(true)}
          >
            {project.name}
          </h2>
        )}

        <button
          onClick={cycleStatus}
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[mode][project.status]} cursor-pointer`}
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
          onReorder={onReorderTodos}
          darkMode={darkMode}
          isThisWeek={isThisWeek}
        />

        <DecisionList
          decisions={decisions}
          onAdd={onAddDecision}
          onUpdate={onUpdateDecision}
          onDelete={onDeleteDecision}
          onReorder={onReorderDecisions}
          darkMode={darkMode}
        />

        <ContactList
          contacts={contacts}
          onAdd={onAddContact}
          onUpdate={onUpdateContact}
          onDelete={onDeleteContact}
          onReorder={onReorderContacts}
          darkMode={darkMode}
        />

        <NotesList
          notes={notes}
          onAdd={onAddNote}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
          onReorder={onReorderNotes}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
