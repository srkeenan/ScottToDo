"use client";

import { useState } from "react";
import type { Todo } from "./Dashboard";

interface Props {
  todos: Todo[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

export default function TodoList({ todos, onAdd, onUpdate, onDelete }: Props) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditValue(todo.text);
  }

  function saveEdit(id: string) {
    setEditingId(null);
    if (editValue.trim()) {
      onUpdate(id, { text: editValue.trim() });
    }
  }

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
        Todos ({activeTodos.length})
      </h3>

      {/* Add new */}
      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add todo..."
          className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
        >
          +
        </button>
      </div>

      {/* Active todos */}
      <ul className="space-y-1">
        {activeTodos.map((todo) => (
          <li key={todo.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onUpdate(todo.id, { completed: true })}
              className="mt-1 shrink-0"
            />
            {editingId === todo.id ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(todo.id)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(todo.id)}
                className="flex-1 text-sm border-b border-blue-500 outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer hover:text-blue-600"
                onClick={() => startEdit(todo)}
              >
                {todo.text}
              </span>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"
            >
              x
            </button>
          </li>
        ))}
      </ul>

      {/* Completed */}
      {completedTodos.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">
            {completedTodos.length} completed
          </summary>
          <ul className="space-y-1 mt-1">
            {completedTodos.map((todo) => (
              <li key={todo.id} className="flex items-start gap-2 group">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => onUpdate(todo.id, { completed: false })}
                  className="mt-1 shrink-0"
                />
                <span className="flex-1 text-sm line-through text-gray-400">
                  {todo.text}
                </span>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
