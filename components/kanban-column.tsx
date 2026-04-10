"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, ArrowUpDown, Pencil, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardStore } from "@/stores/board-store";
import type { Column, Task } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Hex color palette for column dot + accent.
const COL_COLORS: { name: string; value: string }[] = [
  { name: "Gris", value: "#6b7280" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Naranja", value: "#f97316" },
  { name: "Ámbar", value: "#f59e0b" },
  { name: "Verde", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Morado", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Slate", value: "#64748b" },
];

function isCompletedColumn(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("complet") || n === "done" || n === "hecho" || n === "listo";
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });
  const {
    filterStore, filterPriority, filterAssignee, getBoardTasks, addQuickTask,
    archiveCompleted, getArchivedTasks,
    addColumn, removeColumn, renameColumn, setColumnColor,
    boards, activeBoardId,
  } = useBoardStore();

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const allColumns = activeBoard?.columns ?? [];

  const [renamingCol, setRenamingCol] = useState(false);
  const [colName, setColName] = useState(column.title);
  const colInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (renamingCol) setTimeout(() => colInputRef.current?.focus(), 10); }, [renamingCol]);
  // Sync local rename buffer when the column title changes from somewhere else
  useEffect(() => { setColName(column.title); }, [column.title]);

  const hasFilters = filterStore || filterPriority || filterAssignee;
  const totalInColumn = hasFilters
    ? getBoardTasks().filter((t) => (t.columnId ?? "") === column.id).length
    : 0;

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [sortBy, setSortBy] = useState<"manual" | "priority" | "date" | "name" | "assignee">("manual");
  const [wipLimit, setWipLimit] = useState<number | null>(null);
  const isOverWip = wipLimit !== null && tasks.length > wipLimit;
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const otherColumns = allColumns.filter((c) => c.id !== column.id);
  const [deleteTargetId, setDeleteTargetId] = useState<string>(otherColumns[0]?.id ?? "");
  useEffect(() => { if (deleteOpen) setDeleteTargetId(otherColumns[0]?.id ?? ""); }, [deleteOpen, otherColumns]);

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
    addQuickTask(newTitle.trim(), { columnId: column.id });
    toast.success("Tarea creada");
    setNewTitle("");
    // Keep input open for fast multi-creation
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const commitRename = () => {
    if (colName.trim() && colName.trim() !== column.title) renameColumn(column.id, colName.trim());
    setRenamingCol(false);
  };

  const handleDeleteRequest = () => {
    if (tasks.length === 0 || otherColumns.length === 0) {
      // Nothing to move; confirm and delete without target
      if (confirm(`¿Eliminar columna "${column.title}"?`)) {
        removeColumn(column.id);
        toast.success("Columna eliminada");
      }
      return;
    }
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    removeColumn(column.id, deleteTargetId || undefined);
    toast.success("Columna eliminada");
    setDeleteOpen(false);
  };

  const accent = column.color ?? "#6b7280";
  const showCompletedActions = isCompletedColumn(column.title);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex h-full w-[310px] min-w-[280px] flex-col rounded-xl border border-border bg-muted/30",
        isOver && "border-primary/40 bg-primary/5",
        isDragging && "opacity-40"
      )}
    >
      {/* Column header with context menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
          title="Arrastrar columna"
          aria-label="Arrastrar columna"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {renamingCol ? (
          <Input ref={colInputRef} value={colName} onChange={(e) => setColName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setColName(column.title); setRenamingCol(false); } }}
            className="h-6 text-sm font-semibold px-1 w-24" />
        ) : (
          <h3 className="text-sm font-semibold truncate" onDoubleClick={() => { setRenamingCol(true); setColName(column.title); }} title="Doble-click para renombrar">{column.title}</h3>
        )}
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", isOverWip ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground")} title={isOverWip ? `Límite WIP: ${wipLimit}` : undefined}>
          {hasFilters ? `${tasks.length}/${totalInColumn}` : wipLimit !== null ? `${tasks.length}/${wipLimit}` : tasks.length}
          {showCompletedActions && getArchivedTasks().length > 0 && <span className="text-muted-foreground/60"> ({getArchivedTasks().length} arch.)</span>}
        </span>
        {showCompletedActions && tasks.length > 0 && (
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
        <ContextMenuContent className="w-[240px]">
          <ContextMenuItem onClick={() => { setRenamingCol(true); setColName(column.title); }}>
            <Pencil className="mr-2 h-3.5 w-3.5" />Renombrar columna
          </ContextMenuItem>
          <ContextMenuSeparator />
          <div className="px-2 py-1.5" onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-[10px] text-muted-foreground mb-1.5">Cambiar color</p>
            <div className="grid grid-cols-6 gap-1.5">
              {COL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColumnColor(column.id, c.value); toast.success("Color actualizado"); }}
                  className={cn("h-5 w-5 rounded-full transition-transform hover:scale-125 border border-border/40", column.color === c.value && "ring-2 ring-primary ring-offset-1 ring-offset-background")}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { const v = prompt("Límite WIP (vacío para quitar):", wipLimit?.toString() ?? ""); setWipLimit(v && !isNaN(Number(v)) ? Number(v) : null); }}>
            {wipLimit !== null ? `Límite WIP: ${wipLimit}` : "Establecer límite WIP"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={async () => { const id = await addColumn("Nueva columna", undefined, column.id); if (id) toast.success("Columna agregada"); }}>
            Agregar columna a la izquierda
          </ContextMenuItem>
          <ContextMenuItem onClick={async () => { const id = await addColumn("Nueva columna", column.id); if (id) toast.success("Columna agregada"); }}>
            Agregar columna a la derecha
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDeleteRequest} className="text-red-500 focus:text-red-500">
            Eliminar columna
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Tasks */}
      <ScrollArea className="flex-1 px-2.5 pb-2.5">
        <div ref={setDropRef} className="min-h-[60px] space-y-2.5">
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

      {/* Delete dialog — move tasks to target column */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Eliminar columna &ldquo;{column.title}&rdquo;</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Esta columna tiene <strong>{tasks.length} tarea{tasks.length === 1 ? "" : "s"}</strong>.
              Elige a qué columna moverlas antes de eliminar.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mover tareas a</label>
              <Select value={deleteTargetId} onValueChange={setDeleteTargetId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecciona una columna" />
                </SelectTrigger>
                <SelectContent>
                  {otherColumns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!deleteTargetId}>
              Mover y eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
