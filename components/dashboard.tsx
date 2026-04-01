"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/stores/board-store";

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

  const today = new Date().toISOString().split("T")[0];

  // --- Metrics ---
  const totalActive = useMemo(
    () => boardTasks.filter((t) => t.status !== "completado").length,
    [boardTasks],
  );
  const overdueTasks = useMemo(
    () => boardTasks.filter((t) => t.dueDate < today && t.status !== "completado"),
    [boardTasks, today],
  );
  const todayTasks = useMemo(
    () => boardTasks.filter((t) => t.dueDate === today && t.status !== "completado"),
    [boardTasks, today],
  );
  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return boardTasks.filter(
      (t) =>
        t.status === "completado" &&
        t.activity.some(
          (a) =>
            a.field === "status" &&
            a.newValue === "Completado" &&
            new Date(a.createdAt) >= monday,
        ),
    ).length;
  }, [boardTasks]);

  // --- Store chart data ---
  const storeChartData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const t of boardTasks) {
      const storeName = t.store || "Sin tienda";
      if (!map[storeName]) map[storeName] = { vencidas: 0, en_proceso: 0, en_revision: 0, completado: 0, por_hacer: 0 };
      if (t.dueDate < today && t.status !== "completado") {
        map[storeName].vencidas++;
      } else {
        map[storeName][t.status]++;
      }
    }
    return Object.entries(map)
      .map(([store, counts]) => ({
        store,
        vencidas: counts.vencidas,
        en_proceso: counts.en_proceso,
        en_revision: counts.en_revision,
        completado: counts.completado,
        por_hacer: counts.por_hacer,
        pending: counts.vencidas + counts.por_hacer + counts.en_proceso + counts.en_revision,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.pending - a.pending);
  }, [boardTasks, today]);

  const maxStoreTotal = useMemo(
    () => Math.max(1, ...storeChartData.map((d) => d.total)),
    [storeChartData],
  );

  // --- Workload per person ---
  const personData = useMemo(() => {
    const map: Record<string, { porHacer: number; enProceso: number; enRevision: number; total: number; completado: number }> = {};
    for (const t of boardTasks) {
      if (!map[t.assigneeId])
        map[t.assigneeId] = { porHacer: 0, enProceso: 0, enRevision: 0, total: 0, completado: 0 };
      map[t.assigneeId].total++;
      if (t.status === "por_hacer") map[t.assigneeId].porHacer++;
      else if (t.status === "en_proceso") map[t.assigneeId].enProceso++;
      else if (t.status === "en_revision") map[t.assigneeId].enRevision++;
      else if (t.status === "completado") map[t.assigneeId].completado++;
    }
    return Object.entries(map)
      .map(([id, c]) => ({
        id,
        name: memberMap[id]?.name ?? id,
        ...c,
        pending: c.porHacer + c.enProceso + c.enRevision,
        progress: c.total > 0 ? Math.round((c.completado / c.total) * 100) : 0,
      }))
      .sort((a, b) => b.pending - a.pending);
  }, [boardTasks, memberMap]);

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
          <h1 className="text-2xl font-bold">{greeting}, Andrey</h1>
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
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />Vencidas</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />En proceso</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />En revisión</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Completadas</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />Por hacer</span>
              </div>
              {storeChartData.map((d) => (
                <div key={d.store} className="flex items-center gap-3">
                  <span className="text-xs w-28 truncate text-right flex-shrink-0">{d.store}</span>
                  <div className="flex-1 flex h-5 rounded overflow-hidden bg-muted/30">
                    {d.vencidas > 0 && (
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(d.vencidas / maxStoreTotal) * 100}%` }}
                        title={`Vencidas: ${d.vencidas}`}
                      />
                    )}
                    {d.en_proceso > 0 && (
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(d.en_proceso / maxStoreTotal) * 100}%` }}
                        title={`En proceso: ${d.en_proceso}`}
                      />
                    )}
                    {d.en_revision > 0 && (
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(d.en_revision / maxStoreTotal) * 100}%` }}
                        title={`En revisión: ${d.en_revision}`}
                      />
                    )}
                    {d.completado > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(d.completado / maxStoreTotal) * 100}%` }}
                        title={`Completadas: ${d.completado}`}
                      />
                    )}
                    {d.por_hacer > 0 && (
                      <div
                        className="bg-slate-400 h-full"
                        style={{ width: `${(d.por_hacer / maxStoreTotal) * 100}%` }}
                        title={`Por hacer: ${d.por_hacer}`}
                      />
                    )}
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
                    <th className="text-center py-2 px-2 font-medium">Por hacer</th>
                    <th className="text-center py-2 px-2 font-medium">En proceso</th>
                    <th className="text-center py-2 px-2 font-medium">En revisión</th>
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
                      <td className="text-center py-2 px-2">{p.porHacer}</td>
                      <td className="text-center py-2 px-2">{p.enProceso}</td>
                      <td className="text-center py-2 px-2">{p.enRevision}</td>
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
