"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ArrowUpDown, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardStore } from "@/stores/board-store";
import type { Column, Task } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COL_COLORS = [
  { name: "Rojo", value: "bg-red-500" },
  { name: "Naranja", value: "bg-orange-500" },
  { name: "Amarillo", value: "bg-amber-500" },
  { name: "Verde", value: "bg-emerald-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Azul", value: "bg-blue-500" },
  { name: "Morado", value: "bg-purple-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Gris", value: "bg-slate-500" },
  { name: "Negro", value: "bg-gray-800" },
  { name: "Blanco", value: "bg-white border border-border" },
];

const columnAccents: Record<string, string> = {
  por_hacer: "bg-slate-500",
  en_proceso: "bg-blue-500",
  en_revision: "bg-amber-500",
  completado: "bg-emerald-500",
};

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const { filterStore, filterPriority, filterAssignee, getBoardTasks, addQuickTask, updateTask, archiveCompleted, getArchivedTasks, addColumn, removeColumn, renameColumn: renameCol, setColumnColor } =
    useBoardStore();

  const [renamingCol, setRenamingCol] = useState(false);
  const [colName, setColName] = useState(column.title);
  const colInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (renamingCol) setTimeout(() => colInputRef.current?.focus(), 10); }, [renamingCol]);

  const hasFilters = filterStore || filterPriority || filterAssignee;
  const totalInColumn = hasFilters
    ? getBoardTasks().filter((t) => t.status === column.id).length
    : 0;

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [sortBy, setSortBy] = useState<"manual" | "priority" | "date" | "name" | "assignee">("manual");
  const [wipLimit, setWipLimit] = useState<number | null>(null);
  const isOverWip = wipLimit !== null && tasks.length > wipLimit;
  const inputRef = useRef<HTMLInputElement>(null);

  const { getAllTeamMembers } = useBoardStore();
  const allMembers = getAllTeamMembers();
  const priorityOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };

  const sortedTasks = useMemo(() => {
    if (sortBy === "manual") return tasks;
    const sorted = [...tasks];
    if (sortBy === "priority") sorted.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
    if (sortBy === "date") sorted.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    if (sortBy === "name") sorted.sort((a, b) => a.title.replace(/<[^>]*>/g, "").localeCompare(b.title.replace(/<[^>]*>/g, "")));
    if (sortBy === "assignee") sorted.sort((a, b) => (allMembers.find((m) => m.id === a.assigneeId)?.name ?? "").localeCompare(allMembers.find((m) => m.id === b.assigneeId)?.name ?? ""));
    return sorted;
  }, [tasks, sortBy, allMembers]);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 10);
  }, [adding]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addQuickTask(newTitle.trim());
    // The quick task is created with status "por_hacer" by default,
    // update it to this column's status if different
    const store = useBoardStore.getState();
    const lastTask = store.tasks[store.tasks.length - 1];
    if (lastTask && column.id !== "por_hacer") {
      updateTask(lastTask.id, { status: column.id as "por_hacer" | "en_proceso" | "en_revision" | "completado" });
    }
    toast.success("Tarea creada");
    setNewTitle("");
    // Keep input open for fast multi-creation
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <div
      className={cn(
        "flex h-full w-[310px] min-w-[280px] flex-col rounded-xl border border-border bg-muted/30",
        isOver && "border-primary/40 bg-primary/5"
      )}
    >
      {/* Column header with context menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className={cn("h-2.5 w-2.5 rounded-full", column.color ?? columnAccents[column.id] ?? "bg-slate-500")}
        />
        {renamingCol ? (
          <Input ref={colInputRef} value={colName} onChange={(e) => setColName(e.target.value)}
            onBlur={() => { if (colName.trim()) renameCol(column.id, colName.trim()); setRenamingCol(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (colName.trim()) renameCol(column.id, colName.trim()); setRenamingCol(false); } if (e.key === "Escape") setRenamingCol(false); }}
            className="h-6 text-sm font-semibold px-1 w-24" />
        ) : (
          <h3 className="text-sm font-semibold" onDoubleClick={() => { setRenamingCol(true); setColName(column.title); }}>{column.title}</h3>
        )}
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", isOverWip ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground")} title={isOverWip ? `Límite WIP: ${wipLimit}` : undefined}>
          {hasFilters ? `${tasks.length}/${totalInColumn}` : wipLimit !== null ? `${tasks.length}/${wipLimit}` : tasks.length}
          {column.id === "completado" && getArchivedTasks().length > 0 && <span className="text-muted-foreground/60"> ({getArchivedTasks().length} arch.)</span>}
        </span>
        {column.id === "completado" && tasks.length > 0 && (
          <button onClick={() => { archiveCompleted(); toast.success("Tareas archivadas"); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors" title="Archivar completadas">
            Archivar
          </button>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground", sortBy !== "manual" && "text-primary")} title="Ordenar">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setSortBy("manual")} className={cn(sortBy === "manual" && "bg-accent")}>Sin ordenar (manual)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("priority")} className={cn(sortBy === "priority" && "bg-accent")}>Por prioridad</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")} className={cn(sortBy === "date" && "bg-accent")}>Por fecha</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")} className={cn(sortBy === "name" && "bg-accent")}>Por nombre (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("assignee")} className={cn(sortBy === "assignee" && "bg-accent")}>Por responsable</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { const v = prompt("Límite WIP (vacío para quitar):", wipLimit?.toString() ?? ""); setWipLimit(v && !isNaN(Number(v)) ? Number(v) : null); }}>
                {wipLimit !== null ? `Límite WIP: ${wipLimit}` : "Establecer límite WIP"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setAdding(true)}
            className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Agregar tarea"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-[220px]">
          <ContextMenuItem onClick={() => { setRenamingCol(true); setColName(column.title); }}>
            <Pencil className="mr-2 h-3.5 w-3.5" />Renombrar columna
          </ContextMenuItem>
          <ContextMenuSeparator />
          <div className="px-2 py-1.5" onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-[10px] text-muted-foreground mb-1.5">Cambiar color</p>
            <div className="grid grid-cols-6 gap-1.5">
              {COL_COLORS.map((c) => (
                <button key={c.value} onClick={() => { setColumnColor(column.id, c.value); toast.success("Color actualizado"); }} className={cn("h-5 w-5 rounded-full transition-transform hover:scale-125", c.value)} title={c.name} />
              ))}
            </div>
          </div>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { const v = prompt("Límite WIP (vacío para quitar):", wipLimit?.toString() ?? ""); setWipLimit(v && !isNaN(Number(v)) ? Number(v) : null); }}>
            {wipLimit !== null ? `Límite WIP: ${wipLimit}` : "Establecer límite WIP"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { addColumn("Nueva columna", undefined, column.id); toast.success("Columna agregada"); }}>
            Agregar columna a la izquierda
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { addColumn("Nueva columna", column.id); toast.success("Columna agregada"); }}>
            Agregar columna a la derecha
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { if (confirm(`¿Eliminar columna "${column.title}"? Las tareas se moverán a "Por hacer".`)) { removeColumn(column.id); toast.success("Columna eliminada"); } }} className="text-red-500 focus:text-red-500">
            Eliminar columna
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Tasks */}
      <ScrollArea className="flex-1 px-2.5 pb-2.5">
        <div ref={setNodeRef} className="min-h-[60px] space-y-2.5">
          <SortableContext
            items={sortedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {/* Inline task creation */}
          {adding ? (
            <div className="rounded-lg border border-primary/40 bg-card p-2.5 shadow-sm">
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                placeholder="Nombre de la tarea..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">Enter para crear · Esc para cancelar</span>
                <button onClick={() => { setAdding(false); setNewTitle(""); }} className="text-[10px] text-muted-foreground hover:text-foreground">Cancelar</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar tarea
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
