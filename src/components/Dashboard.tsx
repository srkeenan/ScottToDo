"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import ProjectLane from "./ProjectLane";
import CalendarView from "./CalendarView";
import HistoryView from "./HistoryView";

// Color palette for workstream headers
const LANE_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", accent: "#3b82f6", darkBg: "bg-blue-950", darkBorder: "border-blue-800", darkText: "text-blue-100" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", accent: "#f59e0b", darkBg: "bg-amber-950", darkBorder: "border-amber-800", darkText: "text-amber-100" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", accent: "#10b981", darkBg: "bg-emerald-950", darkBorder: "border-emerald-800", darkText: "text-emerald-100" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", accent: "#8b5cf6", darkBg: "bg-purple-950", darkBorder: "border-purple-800", darkText: "text-purple-100" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-900", accent: "#f43f5e", darkBg: "bg-rose-950", darkBorder: "border-rose-800", darkText: "text-rose-100" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-900", accent: "#06b6d4", darkBg: "bg-cyan-950", darkBorder: "border-cyan-800", darkText: "text-cyan-100" },
];

export interface Project {
  id: string;
  name: string;
  status: "active" | "pending" | "passed";
  sort_order: number;
}

export interface Todo {
  id: string;
  project_id: string;
  text: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  due_date: string | null;
  priority: boolean;
  recurring: string | null;
  created_at: string;
}

export interface Decision {
  id: string;
  project_id: string;
  text: string;
  archived: boolean;
  decided_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Contact {
  id: string;
  project_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  meeting_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  text: string;
  sort_order: number;
  created_at: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"dashboard" | "history" | "calendar">("dashboard");
  const [mobileTab, setMobileTab] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [p, t, d, c, n] = await Promise.all([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/todos").then((r) => r.json()),
        fetch("/api/decisions").then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()),
        fetch("/api/notes").then((r) => r.json()),
      ]);
      setProjects(p);
      setTodos(t);
      setDecisions(d);
      setContacts(c);
      setNotes(n);
      // Set mobile tab to first project
      if (p.length > 0 && !mobileTab) setMobileTab(p[0].id);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
  }, []);

  function toggleDarkMode() {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", String(!prev));
      return !prev;
    });
  }

  function toggleCollapse(projectId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  // Filter items by search query
  const filteredTodos = useMemo(() => {
    if (!searchQuery) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter((t) => t.text.toLowerCase().includes(q));
  }, [todos, searchQuery]);

  const filteredDecisions = useMemo(() => {
    if (!searchQuery) return decisions;
    const q = searchQuery.toLowerCase();
    return decisions.filter((d) => d.text.toLowerCase().includes(q));
  }, [decisions, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.role && c.role.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => n.text.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  // History data: ALL completed todos + archived decisions (grouped by week in HistoryView)
  const historyTodos = useMemo(() =>
    todos.filter((t) => t.completed),
    [todos]
  );

  const historyDecisions = useMemo(() =>
    decisions.filter((d) => d.archived),
    [decisions]
  );

  // Calendar data: all todos (with and without due dates)
  const calendarTodos = useMemo(() => todos.filter((t) => !t.completed), [todos]);

  // Project color map
  const projectColorMap = useMemo(() => {
    const map: Record<string, typeof LANE_COLORS[0]> = {};
    projects.forEach((p, i) => {
      map[p.id] = LANE_COLORS[i % LANE_COLORS.length];
    });
    return map;
  }, [projects]);

  async function updateProject(id: string, updates: Partial<Project>) {
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  }

  async function addTodo(projectId: string, text: string) {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, text }),
    });
    if (res.ok) {
      const created = await res.json();
      setTodos((prev) => [created, ...prev]);
    }
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    // Handle recurring: when completing a recurring todo, create next occurrence
    const todo = todos.find((t) => t.id === id);
    if (todo && updates.completed && todo.recurring && !todo.completed) {
      const nextDate = getNextRecurringDate(todo.due_date, todo.recurring);
      // Create new todo for next occurrence
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: todo.project_id,
          text: todo.text,
          due_date: nextDate,
          recurring: todo.recurring,
          priority: todo.priority,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTodos((prev) => [created, ...prev]);
      }
    }

    const res = await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  function getNextRecurringDate(currentDue: string | null, recurring: string): string {
    const base = currentDue ? new Date(currentDue) : new Date();
    switch (recurring) {
      case "daily":
        base.setDate(base.getDate() + 1);
        break;
      case "weekly":
        base.setDate(base.getDate() + 7);
        break;
      case "monthly":
        base.setMonth(base.getMonth() + 1);
        break;
    }
    return base.toISOString().split("T")[0];
  }

  async function deleteTodo(id: string) {
    const res = await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function addDecision(projectId: string, text: string) {
    const res = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, text }),
    });
    if (res.ok) {
      const created = await res.json();
      setDecisions((prev) => [created, ...prev]);
    }
  }

  async function updateDecision(id: string, updates: Partial<Decision>) {
    const res = await fetch("/api/decisions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDecisions((prev) => prev.map((d) => (d.id === id ? updated : d)));
    }
  }

  async function deleteDecision(id: string) {
    const res = await fetch("/api/decisions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function addContact(projectId: string, name: string) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, name }),
    });
    if (res.ok) {
      const created = await res.json();
      setContacts((prev) => [created, ...prev]);
    }
  }

  async function updateContact(id: string, updates: Partial<Contact>) {
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  }

  async function deleteContact(id: string) {
    const res = await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    }
  }

  async function addNote(projectId: string, text: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, text }),
    });
    if (res.ok) {
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
    }
  }

  async function updateNote(id: string, updates: Partial<Note>) {
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  }

  async function reorderItems(
    table: "todos" | "decisions" | "contacts" | "notes",
    orderedIds: string[]
  ) {
    const items = orderedIds.map((id, index) => ({ id, sort_order: index }));

    const setterMap = { todos: setTodos, decisions: setDecisions, contacts: setContacts, notes: setNotes };
    setterMap[table]((prev: any[]) =>
      prev.map((item) => {
        const match = items.find((i) => i.id === item.id);
        return match ? { ...item, sort_order: match.sort_order } : item;
      })
    );

    await fetch("/api/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, items }),
    });
  }

  async function deleteNote(id: string) {
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }

  const bgColor = darkMode ? "#1a1a2e" : "#336600";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-600";
  const inputBg = darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <p className="text-green-300">Loading...</p>
      </div>
    );
  }

  const expandedProjects = projects.filter((p) => !collapsed.has(p.id));

  return (
    <div className="min-h-screen p-4 relative" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">ScottToDo</h1>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={`w-full text-sm px-3 py-1.5 rounded-lg ${inputBg} focus:outline-none focus:ring-1 focus:ring-green-400`}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* View toggles */}
          {view === "dashboard" ? (
            <>
              <button
                onClick={() => setView("calendar")}
                className="text-sm px-3 py-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
              >
                Calendar
              </button>
              <button
                onClick={() => setView("history")}
                className="text-sm px-3 py-1.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
              >
                History
              </button>
            </>
          ) : (
            <button
              onClick={() => setView("dashboard")}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/20 text-white transition-colors"
            >
              Dashboard
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="text-white/60 hover:text-white/90 text-lg transition-colors"
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? "\u2600" : "\u263E"}
          </button>

          {/* Watermark */}
          <span className="text-white/15 text-xs font-medium select-none pointer-events-none ml-2 hidden sm:inline">
            vibe-designed by Scott Keenan
          </span>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="flex gap-1 mb-3 overflow-x-auto md:hidden">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setMobileTab(p.id)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              mobileTab === p.id
                ? "bg-white/20 text-white font-medium"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {view === "history" ? (
        <HistoryView
          todos={historyTodos}
          decisions={historyDecisions}
          projects={projects}
          darkMode={darkMode}
          projectColorMap={projectColorMap}
          onRestoreTodo={(id) => updateTodo(id, { completed: false, completed_at: null })}
          onRestoreDecision={(id) => updateDecision(id, { archived: false })}
        />
      ) : view === "calendar" ? (
        <CalendarView
          todos={calendarTodos}
          meetings={contacts}
          projects={projects}
          darkMode={darkMode}
          projectColorMap={projectColorMap}
          onUpdateTodo={updateTodo}
          onUpdateContact={updateContact}
        />
      ) : (
        <div className="flex gap-2 min-h-[calc(100vh-5rem)] max-md:flex-col">
          {projects.map((project) => {
            const isCollapsed = collapsed.has(project.id);

            // On mobile, only show the active tab
            const isMobileHidden = mobileTab !== project.id;

            if (isCollapsed) {
              return (
                <button
                  key={project.id}
                  onClick={() => toggleCollapse(project.id)}
                  className={`w-10 ${cardBg} hover:opacity-80 rounded-lg items-center justify-center cursor-pointer transition-colors shrink-0 hidden md:flex`}
                  title={`Expand ${project.name}`}
                >
                  <span
                    className={`text-sm font-medium ${subTextColor} whitespace-nowrap`}
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {project.name}
                  </span>
                </button>
              );
            }

            return (
              <div
                key={project.id}
                className={`flex-1 min-w-0 ${isMobileHidden ? "hidden md:block" : ""}`}
                style={{
                  flexBasis: `${100 / expandedProjects.length}%`,
                }}
              >
                <ProjectLane
                  project={project}
                  todos={filteredTodos.filter((t) => t.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
                  decisions={filteredDecisions.filter((d) => d.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
                  contacts={filteredContacts.filter((c) => c.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
                  notes={filteredNotes.filter((n) => n.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
                  onCollapse={() => toggleCollapse(project.id)}
                  onUpdateProject={(updates) => updateProject(project.id, updates)}
                  onAddTodo={(text) => addTodo(project.id, text)}
                  onUpdateTodo={updateTodo}
                  onDeleteTodo={deleteTodo}
                  onReorderTodos={(ids) => reorderItems("todos", ids)}
                  onAddDecision={(text) => addDecision(project.id, text)}
                  onUpdateDecision={updateDecision}
                  onDeleteDecision={deleteDecision}
                  onReorderDecisions={(ids) => reorderItems("decisions", ids)}
                  onAddContact={(name) => addContact(project.id, name)}
                  onUpdateContact={updateContact}
                  onDeleteContact={deleteContact}
                  onReorderContacts={(ids) => reorderItems("contacts", ids)}
                  onAddNote={(text) => addNote(project.id, text)}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  onReorderNotes={(ids) => reorderItems("notes", ids)}
                  darkMode={darkMode}
                  isThisWeek={isThisWeek}
                  laneColor={projectColorMap[project.id]}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
