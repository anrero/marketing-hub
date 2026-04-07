"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/board-store";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/types";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const priorityPillColors: Record<string, string> = {
  urgente: "bg-red-500/80 text-white",
  alta: "bg-orange-500/80 text-white",
  media: "bg-blue-500/80 text-white",
  baja: "bg-gray-400/80 text-white",
};

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const todayStr = toDateString(today);

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Day of week for the first day (0=Sun ... 6=Sat)
  // We need Monday-based: Mon=0, Tue=1 ... Sun=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6; // Sunday becomes 6

  const days: CalendarDay[] = [];

  // Days from previous month to fill the first row
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d,
      dateStr: toDateString(d),
      isCurrentMonth: false,
      isToday: toDateString(d) === todayStr,
    });
  }

  // Days of the current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    days.push({
      date: d,
      dateStr: toDateString(d),
      isCurrentMonth: true,
      isToday: toDateString(d) === todayStr,
    });
  }

  // Fill remaining cells to complete the grid (total rows * 7)
  const totalCells = Math.ceil(days.length / 7) * 7;
  let nextDay = 1;
  while (days.length < totalCells) {
    const d = new Date(year, month + 1, nextDay);
    days.push({
      date: d,
      dateStr: toDateString(d),
      isCurrentMonth: false,
      isToday: toDateString(d) === todayStr,
    });
    nextDay++;
  }

  return days;
}

function DroppableDay({ dateStr, children, className }: { dateStr: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && "ring-2 ring-primary/50")}>
      {children}
    </div>
  );
}

function DraggableTaskPill({ task, children, className, ...props }: { task: Task; children: React.ReactNode } & React.HTMLAttributes<HTMLButtonElement>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={className}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      {...props}
    >
      {children}
    </button>
  );
}

export function CalendarView() {
  const getFilteredTasks = useBoardStore((s) => s.getFilteredTasks);
  const setSelectedTask = useBoardStore((s) => s.setSelectedTask);
  const addQuickTask = useBoardStore((s) => s.addQuickTask);
  const updateTask = useBoardStore((s) => s.updateTask);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = getFilteredTasks().find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newDate = over.id as string;
    const task = getFilteredTasks().find((t) => t.id === taskId);
    if (task && task.dueDate !== newDate) {
      updateTask(taskId, { dueDate: newDate });
      toast.success("Fecha actualizada");
    }
  };

  const handleDayClick = (dateStr: string) => {
    const title = prompt("Nombre de la tarea:");
    if (!title?.trim()) return;
    addQuickTask(title.trim(), { dueDate: dateStr });
    toast.success("Tarea creada");
  };

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const calendarDays = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const tasks = getFilteredTasks();
  const todayStr = toDateString(today);

  // Group tasks by dueDate
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="flex h-full flex-col gap-4">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[200px] text-center text-lg font-semibold">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={goToNextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Hoy
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((calDay, idx) => {
            const dayTasks = tasksByDate[calDay.dateStr] ?? [];
            const hasOverdue =
              calDay.dateStr < todayStr &&
              dayTasks.some((t) => t.status !== "completado");

            return (
              <DroppableDay
                key={idx}
                dateStr={calDay.dateStr}
                className={cn(
                  "relative min-h-[80px] border-b border-r border-border p-1 sm:min-h-[100px] sm:p-2 cursor-pointer hover:bg-accent/20 transition-colors",
                  // Right border removed on last column
                  (idx + 1) % 7 === 0 && "border-r-0",
                  // Bottom border removed on last row
                  idx >= calendarDays.length - 7 && "border-b-0",
                  // Today highlight
                  calDay.isToday && "ring-2 ring-inset ring-blue-500",
                  // Overdue background
                  hasOverdue && "bg-red-500/5",
                  // Outside current month
                  !calDay.isCurrentMonth && "bg-muted/30"
                )}
              >
                {/* Click handler for creating tasks on day click */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div onClick={(e) => { if ((e.target as HTMLElement).closest("[data-draggable-pill]")) return; handleDayClick(calDay.dateStr); }} className="h-full">
                {/* Day number */}
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    calDay.isToday && "bg-blue-500 text-white",
                    !calDay.isCurrentMonth && "text-muted-foreground/50",
                    calDay.isCurrentMonth && !calDay.isToday && "text-foreground"
                  )}
                >
                  {calDay.date.getDate()}
                </span>

                {/* Task pills */}
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <DraggableTaskPill
                      key={task.id}
                      task={task}
                      data-draggable-pill
                      onClick={() => setSelectedTask(task.id)}
                      className={cn(
                        "w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-opacity hover:opacity-80 sm:text-xs",
                        priorityPillColors[task.priority] ?? "bg-gray-400/80 text-white"
                      )}
                      title={task.title.replace(/<[^>]*>/g, "")}
                    >
                      {task.title.replace(/<[^>]*>/g, "")}
                    </DraggableTaskPill>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3} más
                    </span>
                  )}
                </div>
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </div>
    </div>

    <DragOverlay>
      {activeTask && (
        <div
          className={cn(
            "rounded px-2 py-1 text-xs shadow-lg",
            priorityPillColors[activeTask.priority] ?? "bg-gray-400/80 text-white"
          )}
        >
          {activeTask.title.replace(/<[^>]*>/g, "")}
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
}
