"use client";

import { useState, useMemo } from "react";
import type { Todo, Contact, Project } from "./Dashboard";

interface LaneColor {
  bg: string; border: string; text: string; accent: string;
  darkBg: string; darkBorder: string; darkText: string;
}

interface Props {
  todos: Todo[];
  meetings: Contact[];
  projects: Project[];
  darkMode?: boolean;
  projectColorMap: Record<string, LaneColor>;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({ todos, meetings, projects, darkMode, projectColorMap, onUpdateTodo, onUpdateContact }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todosWithDates = useMemo(() => todos.filter((t) => t.due_date), [todos]);
  const todosWithoutDates = useMemo(() => todos.filter((t) => !t.due_date), [todos]);
  const meetingsWithDates = useMemo(() => meetings.filter((m) => m.meeting_date), [meetings]);
  const meetingsWithoutDates = useMemo(() => meetings.filter((m) => !m.meeting_date), [meetings]);

  const todosByDate = useMemo(() => {
    const map: Record<string, Todo[]> = {};
    todosWithDates.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [todosWithDates]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Contact[]> = {};
    meetingsWithDates.forEach((m) => {
      if (m.meeting_date) {
        if (!map[m.meeting_date]) map[m.meeting_date] = [];
        map[m.meeting_date].push(m);
      }
    });
    return map;
  }, [meetingsWithDates]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  function goToday() {
    setCurrentDate(new Date());
  }

  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const mutedText = darkMode ? "text-gray-600" : "text-gray-300";
  const cellBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const todayBg = darkMode ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-300";

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className={`min-h-[80px] ${cellBg} rounded`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTodos = todosByDate[dateStr] || [];
    const dayMeetings = meetingsByDate[dateStr] || [];
    const isToday = dateStr === today;
    const isPast = dateStr < today;

    days.push(
      <div
        key={day}
        className={`min-h-[80px] rounded border p-1 ${isToday ? todayBg : `${cellBg} ${cardBorder}`}`}
      >
        <div className={`text-xs font-medium mb-1 ${isToday ? (darkMode ? "text-green-400" : "text-green-700") : isPast ? mutedText : subText}`}>
          {day}
        </div>
        <div className="space-y-0.5">
          {/* Meetings first, with distinct styling */}
          {dayMeetings.map((meeting) => {
            const color = projectColorMap[meeting.project_id];
            return (
              <div
                key={`m-${meeting.id}`}
                className="text-xs px-1 py-0.5 rounded truncate cursor-default font-semibold"
                style={{
                  backgroundColor: darkMode ? "#7c3aed30" : "#ede9fe",
                  borderLeft: color?.accent ? `3px solid ${color.accent}` : "3px solid #7c3aed",
                  color: darkMode ? "#c4b5fd" : "#5b21b6",
                }}
                title={`Meeting: ${meeting.name} (${projectMap[meeting.project_id] || "Unknown"})`}
              >
                &#128197; {meeting.name}
              </div>
            );
          })}
          {/* Todos */}
          {dayTodos.map((todo) => {
            const color = projectColorMap[todo.project_id];
            return (
              <div
                key={todo.id}
                className={`text-xs px-1 py-0.5 rounded truncate cursor-default ${todo.priority ? "font-bold" : ""}`}
                style={{
                  backgroundColor: color?.accent ? `${color.accent}20` : undefined,
                  borderLeft: color?.accent ? `3px solid ${color.accent}` : undefined,
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                }}
                title={`${todo.text} (${projectMap[todo.project_id] || "Unknown"})`}
              >
                {todo.priority && <span className="text-amber-500 mr-0.5">!</span>}
                {todo.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 max-md:flex-col">
      {/* Calendar */}
      <div className="flex-1">
        <div className={`${cardBg} rounded-lg border ${cardBorder} overflow-hidden`}>
          {/* Month navigation */}
          <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"} flex items-center justify-between`}>
            <button onClick={prevMonth} className={`${subText} hover:${textColor} text-lg px-2`}>&larr;</button>
            <div className="flex items-center gap-3">
              <h3 className={`font-semibold ${textColor}`}>{monthLabel}</h3>
              <button onClick={goToday} className={`text-xs px-2 py-0.5 rounded ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Today
              </button>
            </div>
            <button onClick={nextMonth} className={`${subText} hover:${textColor} text-lg px-2`}>&rarr;</button>
          </div>

          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className={`text-xs font-medium text-center ${mutedText}`}>{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel: todos without dates */}
      <div className="w-full md:w-72 shrink-0">
        <div className={`${cardBg} rounded-lg border ${cardBorder} overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h3 className={`font-semibold text-sm ${textColor}`}>No Date ({todosWithoutDates.length + meetingsWithoutDates.length})</h3>
            <p className={`text-xs ${mutedText}`}>Set a date to add to calendar</p>
          </div>
          <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
            {todosWithoutDates.length === 0 && meetingsWithoutDates.length === 0 ? (
              <p className={`text-xs ${mutedText} text-center py-4`}>Everything has a date!</p>
            ) : (
              <>
                {/* Meetings without dates */}
                {meetingsWithoutDates.map((meeting) => {
                  const color = projectColorMap[meeting.project_id];
                  return (
                    <div key={`m-${meeting.id}`} className="flex items-start gap-2 group">
                      <div
                        className={`flex-1 text-sm rounded px-2 py-1 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} font-semibold`}
                        style={{
                          borderLeft: color?.accent ? `3px solid ${color.accent}` : "3px solid #7c3aed",
                        }}
                      >
                        <div className={darkMode ? "text-purple-300" : "text-purple-700"}>
                          &#128197; {meeting.name}
                        </div>
                        <div className={`text-xs ${mutedText}`}>{projectMap[meeting.project_id] || "Unknown"}</div>
                      </div>
                      <label className="opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer relative mt-1" title="Set meeting date">
                        <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>&#128197;</span>
                        <input
                          type="date"
                          value=""
                          onChange={(e) => { if (e.target.value) onUpdateContact(meeting.id, { meeting_date: e.target.value }); }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          style={{ colorScheme: darkMode ? "dark" : "light" }}
                        />
                      </label>
                    </div>
                  );
                })}
                {/* Todos without dates */}
                {todosWithoutDates.map((todo) => {
                  const color = projectColorMap[todo.project_id];
                  return (
                    <div key={todo.id} className="flex items-start gap-2 group">
                      <div
                        className={`flex-1 text-sm rounded px-2 py-1 ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} ${todo.priority ? "font-bold" : ""}`}
                        style={{
                          borderLeft: color?.accent ? `3px solid ${color.accent}` : undefined,
                        }}
                      >
                        <div className={darkMode ? "text-gray-200" : ""}>
                          {todo.priority && <span className="text-amber-500 mr-1">!</span>}
                          {todo.text}
                        </div>
                        <div className={`text-xs ${mutedText}`}>{projectMap[todo.project_id] || "Unknown"}</div>
                      </div>
                      <label className="opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer relative mt-1" title="Set due date">
                        <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>&#128197;</span>
                        <input
                          type="date"
                          value=""
                          onChange={(e) => { if (e.target.value) onUpdateTodo(todo.id, { due_date: e.target.value }); }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          style={{ colorScheme: darkMode ? "dark" : "light" }}
                        />
                      </label>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
