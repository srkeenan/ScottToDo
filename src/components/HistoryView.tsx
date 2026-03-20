"use client";

import { useMemo } from "react";
import type { Todo, Decision, Project } from "./Dashboard";

interface LaneColor {
  bg: string; border: string; text: string; accent: string;
  darkBg: string; darkBorder: string; darkText: string;
}

interface Props {
  todos: Todo[];
  decisions: Decision[];
  projects: Project[];
  darkMode?: boolean;
  projectColorMap: Record<string, LaneColor>;
  onRestoreTodo: (id: string) => void;
  onRestoreDecision: (id: string) => void;
}

function getWeekLabel(date: Date): string {
  const now = new Date();
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  if (weekStart.getTime() === thisWeekStart.getTime()) return "This Week";
  if (weekStart.getTime() === lastWeekStart.getTime()) return "Last Week";

  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface WeekGroup {
  key: string;
  label: string;
  date: Date;
  todos: Todo[];
  decisions: Decision[];
}

export default function HistoryView({ todos, decisions, projects, darkMode, projectColorMap, onRestoreTodo, onRestoreDecision }: Props) {
  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  const weeks = useMemo(() => {
    const weekMap = new Map<string, WeekGroup>();

    todos.forEach((todo) => {
      const date = new Date(todo.completed_at || todo.created_at);
      const key = getWeekKey(date);
      if (!weekMap.has(key)) {
        weekMap.set(key, { key, label: getWeekLabel(date), date: new Date(key), todos: [], decisions: [] });
      }
      weekMap.get(key)!.todos.push(todo);
    });

    decisions.forEach((decision) => {
      const date = new Date(decision.decided_at || decision.created_at);
      const key = getWeekKey(date);
      if (!weekMap.has(key)) {
        weekMap.set(key, { key, label: getWeekLabel(date), date: new Date(key), todos: [], decisions: [] });
      }
      weekMap.get(key)!.decisions.push(decision);
    });

    return Array.from(weekMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [todos, decisions]);

  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const mutedText = darkMode ? "text-gray-500" : "text-gray-400";

  if (weeks.length === 0) {
    return (
      <div className={`${cardBg} rounded-lg border ${cardBorder} p-8 text-center`}>
        <p className={subText}>No history yet. Completed todos and archived decisions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {weeks.map((week) => (
        <div key={week.key} className={`${cardBg} rounded-lg border ${cardBorder} overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h3 className={`font-semibold ${textColor}`}>{week.label}</h3>
            <p className={`text-xs ${mutedText}`}>
              {week.todos.length} completed {week.todos.length === 1 ? "todo" : "todos"}
              {week.decisions.length > 0 && `, ${week.decisions.length} ${week.decisions.length === 1 ? "decision" : "decisions"}`}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {week.todos.length > 0 && (
              <div>
                <h4 className={`text-xs font-semibold uppercase ${mutedText} mb-1`}>Completed Todos</h4>
                <ul className="space-y-1">
                  {week.todos.map((todo) => (
                    <li key={todo.id} className="flex items-start gap-2 group">
                      <span className={`text-xs ${mutedText} shrink-0 mt-0.5`}>&#10003;</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm line-through ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {todo.text}
                        </span>
                        <span className={`text-xs ml-2 ${mutedText}`}>
                          {projectMap[todo.project_id] || "Unknown"}
                        </span>
                      </div>
                      <button
                        onClick={() => onRestoreTodo(todo.id)}
                        className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-blue-400" : "text-gray-300 hover:text-blue-500"}`}
                        title="Restore"
                      >
                        &#8634;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {week.decisions.length > 0 && (
              <div>
                <h4 className={`text-xs font-semibold uppercase ${mutedText} mb-1`}>Decided</h4>
                <ul className="space-y-1">
                  {week.decisions.map((decision) => (
                    <li key={decision.id} className="flex items-start gap-2 group">
                      <span className={`text-xs ${mutedText} shrink-0 mt-0.5`}>&#9670;</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {decision.text}
                        </span>
                        <span className={`text-xs ml-2 ${mutedText}`}>
                          {projectMap[decision.project_id] || "Unknown"}
                        </span>
                      </div>
                      <button
                        onClick={() => onRestoreDecision(decision.id)}
                        className={`text-xs opacity-0 group-hover:opacity-100 shrink-0 ${darkMode ? "text-gray-600 hover:text-blue-400" : "text-gray-300 hover:text-blue-500"}`}
                        title="Restore"
                      >
                        &#8634;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
