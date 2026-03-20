"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Decision } from "./Dashboard";

interface Props {
  decisions: Decision[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, updates: Partial<Decision>) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  darkMode?: boolean;
}

export default function DecisionList({ decisions, onAdd, onUpdate, onDelete, onReorder, darkMode }: Props) {
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

  function startEdit(decision: Decision) {
    setEditingId(decision.id);
    setEditValue(decision.text);
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
    const reordered = Array.from(active);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered.map((d) => d.id));
  }

  const active = decisions.filter((d) => !d.archived);
  const archived = decisions.filter((d) => d.archived);

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase ${labelColor} mb-2`}>
        Decisions/Open Qs ({active.length})
      </h3>

      <div className="flex gap-1 mb-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add decision/question..."
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
        <Droppable droppableId="decisions">
          {(provided) => (
            <ul className="space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
              {active.map((decision, index) => (
                <Draggable key={decision.id} draggableId={decision.id} index={index}>
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
                      <span className={`${darkMode ? "text-gray-500" : "text-gray-300"} mt-0.5 shrink-0`}>&#9671;</span>
                      {editingId === decision.id ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(decision.id)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(decision.id)}
                          className={`flex-1 text-sm border-b border-blue-500 outline-none bg-transparent ${darkMode ? "text-gray-100" : ""}`}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`flex-1 text-sm cursor-pointer hover:text-blue-600 ${darkMode ? "text-gray-100" : ""}`}
                          onClick={() => startEdit(decision)}
                        >
                          {decision.text}
                        </span>
                      )}
                      <button
                        onClick={() => onUpdate(decision.id, { archived: true })}
                        className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-green-400" : "text-gray-300 hover:text-green-600"}`}
                        title="Archive"
                      >
                        &#10003;
                      </button>
                      <button
                        onClick={() => onDelete(decision.id)}
                        className={`text-sm font-bold hover:text-red-500 hover:bg-red-50 rounded px-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                        title="Delete decision"
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

      {archived.length > 0 && (
        <details className="mt-2">
          <summary className={`text-xs cursor-pointer ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {archived.length} archived
          </summary>
          <ul className="space-y-1 mt-1">
            {archived.map((decision) => (
              <li key={decision.id} className={`flex items-start gap-2 group ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                <span className="mt-0.5 shrink-0">&#9670;</span>
                <span className="flex-1 text-sm">{decision.text}</span>
                <button
                  onClick={() => onUpdate(decision.id, { archived: false })}
                  className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "hover:text-blue-400" : "hover:text-blue-500"}`}
                  title="Restore"
                >
                  &#8634;
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
