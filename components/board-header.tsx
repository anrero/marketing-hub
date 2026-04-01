"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Task } from "@/types";
import { Plus, LayoutGrid, Table, X, Search, Sun, Moon, Bell, CalendarDays, ChevronRight, Image, GanttChart } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "@/stores/board-store";
import { PRIORITIES } from "@/lib/mock-data";

export function BoardHeader() {
  const {
    boards,
    tasks,
    activeBoardId,
    filterStore,
    filterPriority,
    filterAssignee,
    viewMode,
    setFilterStore,
    setFilterPriority,
    setFilterAssignee,
    setViewMode,
    setNewTaskDialogOpen,
    setCommandOpen,
    getAllStores,
    getAllTeamMembers,
    getOverdueTasks,
    setSelectedTask,
    renameBoard,
  } = useBoardStore();

  const { theme, setTheme } = useTheme();
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editingTitle) { setTitleDraft(activeBoard?.name ?? ""); setTimeout(() => { titleInputRef.current?.focus(); titleInputRef.current?.select(); }, 0); } }, [editingTitle, activeBoard?.name]);
  const hasFilters = filterStore || filterPriority || filterAssignee;
  const allStores = getAllStores();
  const allMembers = getAllTeamMembers();
  const overdueTasks = getOverdueTasks();

  // Board stats
  const boardTasks = useMemo(() => {
    const b = boards.find((bb) => bb.id === activeBoardId);
    if (!b) return [];
    return b.taskIds.map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t && !t.archivedAt);
  }, [boards, activeBoardId, tasks]);
  const statsPorHacer = boardTasks.filter((t) => t.status === "por_hacer").length;
  const statsEnProceso = boardTasks.filter((t) => t.status === "en_proceso").length;
  const statsEnRevision = boardTasks.filter((t) => t.status === "en_revision").length;
  const statsCompletadas = boardTasks.filter((t) => t.status === "completado").length;

  const clearFilters = () => {
    setFilterStore(null);
    setFilterPriority(null);
    setFilterAssignee(null);
  };

  return (
    <header className="flex flex-col gap-2 md:gap-3 border-b border-border bg-card px-3 md:px-6 py-3 md:py-4">
      {/* Breadcrumb */}
      {(() => {
        const ws = useSidebarStore.getState().workspaces.find((w) => w.id === useSidebarStore.getState().activeWorkspaceId);
        const viewLabel = viewMode === "tabla" ? "Tabla" : viewMode === "calendario" ? "Calendario" : viewMode === "galeria" ? "Galería" : viewMode === "timeline" ? "Timeline" : "Kanban";
        return (
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <button onClick={() => useSidebarStore.getState().setMainView("dashboard")} className="hover:underline hover:text-foreground cursor-pointer transition-colors">{ws?.name ?? "Workspace"}</button>
            <ChevronRight className="h-3 w-3" />
            <span>Boards</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{activeBoard?.name}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{viewLabel}</span>
          </nav>
        );
      })()}
      <div className="flex items-center justify-between gap-2">
        {editingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { if (titleDraft.trim() && activeBoardId) renameBoard(activeBoardId, titleDraft.trim()); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (titleDraft.trim() && activeBoardId) renameBoard(activeBoardId, titleDraft.trim()); setEditingTitle(false); } if (e.key === "Escape") setEditingTitle(false); }}
            className="text-xl font-semibold h-auto py-0 px-1 border-blue-500"
          />
        ) : (
          <h1
            className="text-xl font-semibold cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5 transition-colors"
            onDoubleClick={() => setEditingTitle(true)}
            title="Doble click para renombrar"
          >
            {activeBoard?.name ?? "Board"}
          </h1>
        )}
        {boardTasks.length > 0 && (
          <p className="text-[11px] text-muted-foreground hidden md:block">
            {boardTasks.length} tareas · {statsPorHacer} por hacer · {statsEnProceso} en proceso · {statsEnRevision} en revisión · {statsCompletadas} completadas
          </p>
        )}

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
          {/* Buscar */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground h-8"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Buscar...</span>
            <kbd className="ml-2 rounded border border-border bg-muted px-1 py-0.5 text-[10px] hidden sm:inline">
              Ctrl+K
            </kbd>
          </Button>

          {/* Notification bell */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                {overdueTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {overdueTasks.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <div className="border-b border-border px-4 py-2.5">
                <p className="text-sm font-semibold">Tareas urgentes</p>
                <p className="text-[10px] text-muted-foreground">{overdueTasks.length} vencidas o vencen hoy</p>
              </div>
              <ScrollArea className="max-h-[250px]">
                {overdueTasks.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">Sin tareas urgentes</p>
                ) : (
                  <div className="p-2 space-y-1">
                    {overdueTasks.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTask(t.id)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-accent transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{t.title.replace(/<[^>]*>/g, "")}</p>
                          <p className="text-[10px] text-muted-foreground">{t.dueDate}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400 shrink-0">Vencida</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Theme toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* Toggle vista */}
          <div className="flex rounded-lg border border-border">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none h-8"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === "tabla" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-8"
              onClick={() => setViewMode("tabla")}
            >
              <Table className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Tabla</span>
            </Button>
            <Button
              variant={viewMode === "calendario" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-8"
              onClick={() => setViewMode("calendario")}
            >
              <CalendarDays className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Calendario</span>
            </Button>
            <Button
              variant={viewMode === "galeria" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-8"
              onClick={() => setViewMode("galeria")}
            >
              <Image className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Galería</span>
            </Button>
            <Button
              variant={viewMode === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none h-8"
              onClick={() => setViewMode("timeline")}
            >
              <GanttChart className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Timeline</span>
            </Button>
          </div>

          <Button size="sm" className="h-8" onClick={() => setNewTaskDialogOpen(true)}>
            <Plus className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">Nueva Tarea</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
        <Select
          value={filterStore ?? "all"}
          onValueChange={(v) => setFilterStore(v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Tienda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tiendas</SelectItem>
            {allStores.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPriority ?? "all"}
          onValueChange={(v) => setFilterPriority(v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterAssignee ?? "all"}
          onValueChange={(v) => setFilterAssignee(v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {allMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </header>
  );
}
