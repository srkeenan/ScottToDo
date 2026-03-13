"use client";

import { useEffect, useState, useCallback } from "react";
import ProjectLane from "./ProjectLane";

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
  sort_order: number;
  created_at: string;
}

export interface Decision {
  id: string;
  project_id: string;
  text: string;
  archived: boolean;
  decided_at: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  project_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  text: string;
  created_at: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function toggleCollapse(projectId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const expandedProjects = projects.filter((p) => !collapsed.has(p.id));
  const collapsedProjects = projects.filter((p) => collapsed.has(p.id));

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">ScottToDo</h1>
      <div className="flex gap-2 min-h-[calc(100vh-5rem)]">
        {projects.map((project) => {
          const isCollapsed = collapsed.has(project.id);

          if (isCollapsed) {
            return (
              <button
                key={project.id}
                onClick={() => toggleCollapse(project.id)}
                className="w-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title={`Expand ${project.name}`}
              >
                <span
                  className="text-sm font-medium text-gray-600 whitespace-nowrap"
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
              className="flex-1 min-w-0"
              style={{
                flexBasis: `${100 / expandedProjects.length}%`,
              }}
            >
              <ProjectLane
                project={project}
                todos={todos.filter((t) => t.project_id === project.id)}
                decisions={decisions.filter((d) => d.project_id === project.id)}
                contacts={contacts.filter((c) => c.project_id === project.id)}
                notes={notes.filter((n) => n.project_id === project.id)}
                onCollapse={() => toggleCollapse(project.id)}
                onUpdateProject={(updates) => updateProject(project.id, updates)}
                onAddTodo={(text) => addTodo(project.id, text)}
                onUpdateTodo={updateTodo}
                onDeleteTodo={deleteTodo}
                onAddDecision={(text) => addDecision(project.id, text)}
                onUpdateDecision={updateDecision}
                onDeleteDecision={deleteDecision}
                onAddContact={(name) => addContact(project.id, name)}
                onUpdateContact={updateContact}
                onDeleteContact={deleteContact}
                onAddNote={(text) => addNote(project.id, text)}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
