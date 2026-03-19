"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Todo } from "./Dashboard";

interface Props {
  todos: Todo[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  darkMode?: boolean;
  isThisWeek?: (dateStr: string | null) => boolean;
}

const RECURRING_OPTIONS = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function TodoList({ todos, onAdd, onUpdate, onDelete, onReorder, darkMode, isThisWeek }: Props) {
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

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const reordered = Array.from(activeTodos);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map((t) => t.id));
  }

  function isOverdue(todo: Todo): boolean {
    if (!todo.due_date || todo.completed) return false;
    const today = new Date().toISOString().split("T")[0];
    return todo.due_date < today;
  }

  function isDueSoon(todo: Todo): boolean {
    if (!todo.due_date || todo.completed) return false;
    const today = new Date();
    const due = new Date(todo.due_date);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  }

  const activeTodos = todos.filter((t) => !t.completed);
  const completedThisWeek = todos.filter((t) => t.completed && isThisWeek?.(t.completed_at));

  const inputBg = darkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "border-gray-200";
  const labelColor = darkMode ? "text-gray-400" : "text-gray-400";

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase ${labelColor} mb-2`}>
        Todos ({activeTodos.length})
      </h3>

      {/* Add new */}
      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add todo..."
          className={`flex-1 text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${inputBg}`}
        />
        <button
          onClick={handleAdd}
          className={`text-sm px-2 py-1 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
        >
          +
        </button>
      </div>

      {/* Active todos */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul className="space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
              {activeTodos.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-start gap-2 group ${snapshot.isDragging ? "bg-blue-50 rounded shadow-sm" : ""} ${isOverdue(todo) ? "bg-red-50 rounded px-1 -mx-1" : ""} ${darkMode && isOverdue(todo) ? "!bg-red-900/30" : ""}`}
                    >
                      <span
                        {...provided.dragHandleProps}
                        className={`${darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-300 hover:text-gray-500"} cursor-grab mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs select-none`}
                        title="Drag to reorder"
                      >
                        &#10303;
                      </span>
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onUpdate(todo.id, { completed: true, completed_at: new Date().toISOString() })}
                        className="mt-1 shrink-0"
                      />
                      {editingId === todo.id ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(todo.id)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(todo.id)}
                          className={`flex-1 text-sm border-b border-blue-500 outline-none bg-transparent ${darkMode ? "text-gray-100" : ""}`}
                          autoFocus
                        />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm cursor-pointer hover:text-blue-600 ${todo.priority ? "font-bold" : ""} ${darkMode ? "text-gray-100" : ""} ${isOverdue(todo) ? "text-red-700" : ""} ${darkMode && isOverdue(todo) ? "!text-red-400" : ""}`}
                            onClick={() => startEdit(todo)}
                          >
                            {todo.priority && <span className="text-amber-500 mr-1" title="High priority">!</span>}
                            {todo.text}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {todo.due_date && (
                              <span className={`text-xs ${isOverdue(todo) ? "text-red-500 font-medium" : isDueSoon(todo) ? "text-amber-500" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {isOverdue(todo) ? "Overdue: " : ""}
                                {new Date(todo.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {todo.recurring && (
                              <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                &#x21BB; {todo.recurring}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Priority toggle */}
                      <button
                        onClick={() => onUpdate(todo.id, { priority: !todo.priority })}
                        className={`text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-all ${todo.priority ? "!opacity-100 text-amber-500" : darkMode ? "text-gray-600 hover:text-amber-500" : "text-gray-300 hover:text-amber-500"}`}
                        title="Toggle priority"
                      >
                        !
                      </button>
                      {/* Due date */}
                      {todo.due_date ? (
                        <button
                          onClick={() => onUpdate(todo.id, { due_date: null })}
                          className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}
                          title="Remove due date"
                        >
                          &#x2715;&#x1F4C5;
                        </button>
                      ) : (
                        <label className="opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer relative" title="Set due date">
                          <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>&#128197;</span>
                          <input
                            type="date"
                            value=""
                            onChange={(e) => { if (e.target.value) onUpdate(todo.id, { due_date: e.target.value }); }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            style={{ colorScheme: darkMode ? "dark" : "light" }}
                          />
                        </label>
                      )}
                      {/* Recurring */}
                      <select
                        value={todo.recurring || ""}
                        onChange={(e) => onUpdate(todo.id, { recurring: e.target.value || null })}
                        className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 bg-transparent cursor-pointer ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                        title="Set recurring"
                        style={{ width: "16px" }}
                      >
                        {RECURRING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onDelete(todo.id)}
                        className={`text-sm font-bold hover:text-red-500 hover:bg-red-50 rounded px-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                        title="Delete todo"
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

      {/* Completed this week */}
      {completedThisWeek.length > 0 && (
        <details className="mt-2">
          <summary className={`text-xs cursor-pointer ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {completedThisWeek.length} completed this week
          </summary>
          <ul className="space-y-1 mt-1">
            {completedThisWeek.map((todo) => (
              <li key={todo.id} className="flex items-start gap-2 group">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => onUpdate(todo.id, { completed: false, completed_at: null })}
                  className="mt-1 shrink-0"
                />
                <span className={`flex-1 text-sm line-through ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                  {todo.completed_at && `${new Date(todo.completed_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })} `}{todo.text}
                </span>
                <button
                  onClick={() => onDelete(todo.id)}
                  className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}
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
