"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useBoardStore } from "@/stores/board-store";
import { cn } from "@/lib/utils";

const DAY_WIDTH = 30;

const PRIORITY_COLORS: Record<string, string> = {
  urgente: "#ef4444",
  alta: "#f97316",
  media: "#3b82f6",
  baja: "#9ca3af",
};

const COMPLETED_COLOR = "#22c55e";

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function formatDayLabel(d: Date): string {
  return d.getDate().toString();
}

function formatMonthLabel(d: Date): string {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return months[d.getMonth()];
}

export function TimelineView() {
  const tasks = useBoardStore(useShallow((s) => s.getFilteredTasks()));
  const allMembers = useBoardStore(useShallow((s) => s.getAllTeamMembers()));
  const setSelectedTask = useBoardStore((s) => s.setSelectedTask);

  const today = useMemo(() => startOfDay(new Date()), []);

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of allMembers) {
      map[m.id] = m.name;
    }
    return map;
  }, [allMembers]);

  const { rangeStart, totalDays, days } = useMemo(() => {
    if (tasks.length === 0) {
      return { rangeStart: today, totalDays: 0, days: [] as Date[] };
    }

    let earliest = today;
    let latest = today;

    for (const task of tasks) {
      const createdAt =
        task.activity && task.activity.length > 0
          ? startOfDay(new Date(task.activity[0].createdAt))
          : new Date(today.getTime() - 30 * 86400000);

      if (createdAt < earliest) earliest = createdAt;

      if (task.dueDate) {
        const due = startOfDay(new Date(task.dueDate));
        if (due > latest) latest = due;
      }
    }

    const end = new Date(latest.getTime() + 7 * 86400000);
    const total = daysBetween(earliest, end) + 1;

    const dayList: Date[] = [];
    for (let i = 0; i < total; i++) {
      dayList.push(new Date(earliest.getTime() + i * 86400000));
    }

    return { rangeStart: earliest, totalDays: total, days: dayList };
  }, [tasks, today]);

  const todayOffset = useMemo(() => {
    return daysBetween(rangeStart, today) * DAY_WIDTH;
  }, [rangeStart, today]);

  const taskRows = useMemo(() => {
    return tasks.map((task) => {
      const createdAt =
        task.activity && task.activity.length > 0
          ? startOfDay(new Date(task.activity[0].createdAt))
          : new Date(today.getTime() - 30 * 86400000);

      const startOffset = daysBetween(rangeStart, createdAt) * DAY_WIDTH;
      const hasDue = !!task.dueDate;
      const dueDate = hasDue ? startOfDay(new Date(task.dueDate)) : null;
      const barWidth = hasDue
        ? Math.max(daysBetween(createdAt, dueDate!) * DAY_WIDTH, DAY_WIDTH)
        : 0;
      const isCompleted = task.status === "completado";
      const color = isCompleted
        ? COMPLETED_COLOR
        : PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.media;

      const startLabel = createdAt.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      });
      const endLabel = dueDate
        ? dueDate.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })
        : "Sin fecha";

      return {
        task,
        startOffset,
        barWidth,
        hasDue,
        color,
        tooltip: `${task.title}\nInicio: ${startLabel}\nEntrega: ${endLabel}`,
      };
    });
  }, [tasks, rangeStart, today]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Sin tareas para mostrar</p>
          <p className="text-sm mt-1">
            Crea una tarea para verla en la vista de cronograma.
          </p>
        </div>
      </div>
    );
  }

  const timelineWidth = totalDays * DAY_WIDTH;

  return (
    <div className="flex flex-col h-full overflow-hidden border border-border rounded-lg bg-background">
      {/* Header row */}
      <div className="flex flex-shrink-0 border-b border-border">
        {/* Left header */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-border px-3 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider",
            "w-40 md:w-64"
          )}
        >
          Tarea
        </div>
        {/* Right header: date labels */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="relative"
            style={{ width: timelineWidth, minHeight: 40 }}
          >
            {/* Month labels */}
            {days.map((day, i) => {
              const isFirstOfMonth = day.getDate() === 1;
              const isFirst = i === 0;
              if (!isFirstOfMonth && !isFirst) return null;
              return (
                <div
                  key={`month-${i}`}
                  className="absolute top-0 text-[10px] font-semibold text-muted-foreground uppercase"
                  style={{ left: i * DAY_WIDTH }}
                >
                  {formatMonthLabel(day)} {day.getFullYear()}
                </div>
              );
            })}
            {/* Day labels */}
            {days.map((day, i) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();
              return (
                <div
                  key={`day-${i}`}
                  className={cn(
                    "absolute bottom-0 text-center text-[10px]",
                    isWeekend
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground",
                    isToday && "font-bold text-red-500"
                  )}
                  style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                >
                  {formatDayLabel(day)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Left column: task names (sticky) */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-border overflow-y-auto",
            "w-40 md:w-64"
          )}
        >
          {taskRows.map(({ task }) => (
            <div
              key={task.id}
              className="flex flex-col justify-center h-10 px-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedTask(task.id)}
            >
              <span className="text-xs font-medium truncate text-foreground">
                {task.title}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {memberMap[task.assigneeId] || "Sin asignar"}
              </span>
            </div>
          ))}
        </div>

        {/* Right area: timeline bars */}
        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: timelineWidth }}>
            {/* Weekend/column shading */}
            {days.map((day, i) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              if (!isWeekend) return null;
              return (
                <div
                  key={`bg-${i}`}
                  className="absolute top-0 bottom-0 bg-muted/30"
                  style={{
                    left: i * DAY_WIDTH,
                    width: DAY_WIDTH,
                    height: taskRows.length * 40,
                  }}
                />
              );
            })}

            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= timelineWidth && (
              <div
                className="absolute top-0 z-20 pointer-events-none"
                style={{
                  left: todayOffset + DAY_WIDTH / 2,
                  height: taskRows.length * 40,
                  borderLeft: "2px dashed red",
                }}
              />
            )}

            {/* Task bars */}
            {taskRows.map(({ task, startOffset, barWidth, hasDue, color, tooltip }, idx) => {
              const top = idx * 40 + 10; // center vertically in the 40px row

              if (!hasDue) {
                // Render a small circle at creation date
                return (
                  <div
                    key={task.id}
                    className="absolute z-10 cursor-pointer"
                    title={tooltip}
                    style={{
                      left: startOffset + DAY_WIDTH / 2 - 6,
                      top: top + 4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: color,
                    }}
                    onClick={() => setSelectedTask(task.id)}
                  />
                );
              }

              return (
                <div
                  key={task.id}
                  className="absolute z-10 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  title={tooltip}
                  style={{
                    left: startOffset,
                    top,
                    width: barWidth,
                    height: 20,
                    backgroundColor: color,
                  }}
                  onClick={() => setSelectedTask(task.id)}
                />
              );
            })}

            {/* Row borders */}
            {taskRows.map((_, idx) => (
              <div
                key={`row-border-${idx}`}
                className="absolute left-0 right-0 border-b border-border/50"
                style={{ top: (idx + 1) * 40, width: timelineWidth }}
              />
            ))}

            {/* Reserve height */}
            <div style={{ height: taskRows.length * 40 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
