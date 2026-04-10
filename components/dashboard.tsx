"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/stores/board-store";
import { useAuthStore } from "@/stores/auth-store";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  LayoutDashboard,
  CalendarClock,
  Users,
  Store,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function daysAgo(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr + "T00:00:00");
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function timeAgo(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
}

export function Dashboard() {
  const { tasks, boards, activeBoardId, setSelectedTask, getAllTeamMembers } =
    useBoardStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const allMembers = useMemo(() => getAllTeamMembers(), [getAllTeamMembers]);

  const memberMap = useMemo(
    () => Object.fromEntries(allMembers.map((m) => [m.id, m])),
    [allMembers],
  );

  const board = boards.find((b) => b.id === activeBoardId);
  const boardTasks = useMemo(
    () => (board ? tasks.filter((t) => board.taskIds.includes(t.id) && !t.archivedAt) : []),
    [board, tasks],
  );
  const boardCols = board?.columns ?? [];
  // A task is "done" if its column is the last column of the board OR its name hints at completion.
  const lastColId = boardCols[boardCols.length - 1]?.id;
  const isCompletedTask = (t: { columnId?: string | null; status?: string }) => {
    if (t.columnId && lastColId) {
      const col = boardCols.find((c) => c.id === t.columnId);
      if (col) {
        const n = col.title.toLowerCase();
        if (n.includes("complet") || n === "done" || n === "hecho" || n === "listo") return true;
      }
    }
    return t.status === "completado";
  };

  const today = new Date().toISOString().split("T")[0];

  // --- Metrics ---
  const totalActive = useMemo(
    () => boardTasks.filter((t) => !isCompletedTask(t)).length,
    [boardTasks], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const overdueTasks = useMemo(
    () => boardTasks.filter((t) => t.dueDate < today && !isCompletedTask(t)),
    [boardTasks, today], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const todayTasks = useMemo(
    () => boardTasks.filter((t) => t.dueDate === today && !isCompletedTask(t)),
    [boardTasks, today], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return boardTasks.filter(
      (t) =>
        isCompletedTask(t) &&
        t.activity.some(
          (a) =>
            a.field === "status" &&
            new Date(a.createdAt) >= monday,
        ),
    ).length;
  }, [boardTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Store chart data (grouped by actual board columns) ---
  const storeChartData = useMemo(() => {
    const map: Record<string, { vencidas: number; byCol: Record<string, number> }> = {};
    for (const t of boardTasks) {
      const storeName = t.store || "Sin tienda";
      if (!map[storeName]) map[storeName] = { vencidas: 0, byCol: {} };
      if (t.dueDate < today && !isCompletedTask(t)) {
        map[storeName].vencidas++;
        continue;
      }
      const key = t.columnId ?? "__none__";
      map[storeName].byCol[key] = (map[storeName].byCol[key] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([store, { vencidas, byCol }]) => {
        const total = vencidas + Object.values(byCol).reduce((a, b) => a + b, 0);
        const pending = vencidas + boardCols.reduce((sum, c) => {
          const n = c.title.toLowerCase();
          const done = n.includes("complet") || n === "done" || n === "hecho" || n === "listo";
          return sum + (done ? 0 : (byCol[c.id] ?? 0));
        }, 0);
        return { store, vencidas, byCol, total, pending };
      })
      .sort((a, b) => b.pending - a.pending);
  }, [boardTasks, today, boardCols]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxStoreTotal = useMemo(
    () => Math.max(1, ...storeChartData.map((d) => d.total)),
    [storeChartData],
  );

  // Palette for dynamic column colors — fall back to this if column.color is missing
  const fallbackPalette = ["#64748b", "#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#ec4899", "#06b6d4"];

  // --- Workload per person (grouped by board columns) ---
  const personData = useMemo(() => {
    const map: Record<string, { byCol: Record<string, number>; total: number; completed: number }> = {};
    for (const t of boardTasks) {
      if (!map[t.assigneeId]) map[t.assigneeId] = { byCol: {}, total: 0, completed: 0 };
      map[t.assigneeId].total++;
      const key = t.columnId ?? "__none__";
      map[t.assigneeId].byCol[key] = (map[t.assigneeId].byCol[key] ?? 0) + 1;
      if (isCompletedTask(t)) map[t.assigneeId].completed++;
    }
    return Object.entries(map)
      .map(([id, c]) => {
        const pending = c.total - c.completed;
        return {
          id,
          name: memberMap[id]?.name ?? id,
          byCol: c.byCol,
          total: c.total,
          completed: c.completed,
          pending,
          progress: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.pending - a.pending);
  }, [boardTasks, memberMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Recent activity ---
  const recentActivity = useMemo(
    () =>
      boardTasks
        .flatMap((t) =>
          t.activity.map((a) => ({
            ...a,
            taskTitle: stripHtml(t.title),
            taskId: t.id,
          })),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10),
    [boardTasks],
  );

  // --- Greeting ---
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const dateStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* (a) Greeting */}
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {currentUser?.name ?? "Usuario"}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>

        {/* (b) Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total tareas activas",
              value: totalActive,
              icon: <LayoutDashboard className="h-5 w-5" />,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Tareas vencidas",
              value: overdueTasks.length,
              icon: <AlertCircle className="h-5 w-5" />,
              color: "text-red-500 bg-red-500/10",
              accent: "text-red-600",
            },
            {
              label: "Tareas para hoy",
              value: todayTasks.length,
              icon: <CalendarClock className="h-5 w-5" />,
              color: "text-amber-500 bg-amber-500/10",
              accent: "text-amber-600",
            },
            {
              label: "Completadas esta semana",
              value: completedThisWeek,
              icon: <CheckCircle className="h-5 w-5" />,
              color: "text-emerald-500 bg-emerald-500/10",
              accent: "text-emerald-600",
            },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4">
              <div className={cn("inline-flex rounded-lg p-2 mb-2", m.color)}>{m.icon}</div>
              <p className={cn("text-2xl font-bold", m.accent)}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* (c) Tareas por tienda - horizontal bar chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Store className="h-4 w-4 text-muted-foreground" />
            Tareas por tienda
          </h3>
          {storeChartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {/* Legend (dynamic by board columns) */}
              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#ef4444" }} />Vencidas</span>
                {boardCols.map((c, i) => (
                  <span key={c.id} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color ?? fallbackPalette[i % fallbackPalette.length] }} />
                    {c.title}
                  </span>
                ))}
              </div>
              {storeChartData.map((d) => (
                <div key={d.store} className="flex items-center gap-3">
                  <span className="text-xs w-28 truncate text-right flex-shrink-0">{d.store}</span>
                  <div className="flex-1 flex h-5 rounded overflow-hidden bg-muted/30">
                    {d.vencidas > 0 && (
                      <div
                        className="h-full"
                        style={{ width: `${(d.vencidas / maxStoreTotal) * 100}%`, backgroundColor: "#ef4444" }}
                        title={`Vencidas: ${d.vencidas}`}
                      />
                    )}
                    {boardCols.map((c, i) => {
                      const count = d.byCol[c.id] ?? 0;
                      if (count === 0) return null;
                      return (
                        <div
                          key={c.id}
                          className="h-full"
                          style={{ width: `${(count / maxStoreTotal) * 100}%`, backgroundColor: c.color ?? fallbackPalette[i % fallbackPalette.length] }}
                          title={`${c.title}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">{d.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* (d) Carga por persona */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            Carga por persona
          </h3>
          {personData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Sin datos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Nombre</th>
                    {boardCols.map((c) => (
                      <th key={c.id} className="text-center py-2 px-2 font-medium">{c.title}</th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium">Total</th>
                    <th className="text-left py-2 pl-3 font-medium w-32">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {personData.map((p) => (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-b border-border/50 last:border-0",
                        p.pending > 10 && "bg-red-500/10 text-red-700 dark:text-red-400",
                      )}
                    >
                      <td className="py-2 pr-3 font-medium">{p.name}</td>
                      {boardCols.map((c) => (
                        <td key={c.id} className="text-center py-2 px-2">{p.byCol[c.id] ?? 0}</td>
                      ))}
                      <td className="text-center py-2 px-2 font-semibold">{p.total}</td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {p.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* (e) Tareas vencidas */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Tareas vencidas ({overdueTasks.length})
            </h3>
            {overdueTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Sin tareas vencidas
              </p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {overdueTasks.map((t) => {
                  const days = daysAgo(t.dueDate);
                  const assignee = memberMap[t.assigneeId];
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTask(t.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{stripHtml(t.title)}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {t.store && <span>{t.store}</span>}
                          {assignee && <span>{assignee.name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-red-500 whitespace-nowrap flex-shrink-0">
                        hace {days} día{days !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* (f) Actividad reciente */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Actividad reciente
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sin actividad</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {recentActivity.map((entry) => {
                  const author = memberMap[entry.authorId];
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedTask(entry.taskId)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs">
                          <span className="font-medium">{author?.name ?? "Usuario"}</span>{" "}
                          <span className="text-muted-foreground">{entry.action}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {entry.taskTitle}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
