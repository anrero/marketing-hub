"use client";

import { useCallback, useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/kanban-column";
import { TaskCard } from "@/components/task-card";
import { useBoardStore } from "@/stores/board-store";
import type { Task, Column } from "@/types";
import { toast } from "sonner";
import { EmptyState, KanbanSkeleton } from "@/components/empty-state";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function KanbanBoard() {
  const { tasks, boards, activeBoardId, moveTask, getFilteredTasks, setNewTaskDialogOpen, reorderColumns, addColumn } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [loading, setLoading] = useState(true);
  const [addColOpen, setAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 200); return () => clearTimeout(t); }, [activeBoardId]);
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const columns: Column[] = activeBoard?.columns ?? [];

  const filteredTasks = getFilteredTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const draggedType = (event.active.data.current as { type?: string } | undefined)?.type;
      if (draggedType === "column") {
        const col = columns.find((c) => c.id === id);
        if (col) setActiveColumn(col);
        return;
      }
      const task = tasks.find((t) => t.id === id);
      if (task) setActiveTask(task);
    },
    [tasks, columns]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const wasColumn = activeColumn !== null;
      setActiveTask(null);
      setActiveColumn(null);
      const { active, over } = event;
      if (!over) return;

      // Column reorder
      if (wasColumn) {
        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;
        const oldIndex = columns.findIndex((c) => c.id === activeId);
        const newIndex = columns.findIndex((c) => c.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(columns, oldIndex, newIndex).map((c) => c.id);
        reorderColumns(next);
        return;
      }

      const taskId = active.id as string;
      const overId = over.id as string;

      // Dropped onto a column directly (droppable id === column.id)
      const isColumn = columns.some((c) => c.id === overId);
      if (isColumn) {
        moveTask(taskId, overId);
        toast("Tarea movida");
        return;
      }

      // Dropped onto another task — find that task's columnId
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && overTask.columnId) {
        moveTask(taskId, overTask.columnId);
        toast("Tarea movida");
      }
    },
    [moveTask, tasks, columns, activeColumn, reorderColumns]
  );

  const handleCreateColumn = async () => {
    const name = newColName.trim();
    if (!name) return;
    await addColumn(name);
    toast.success("Columna agregada");
    setNewColName("");
    setAddColOpen(false);
  };

  if (loading) return <KanbanSkeleton />;

  // Empty board still shows columns (so user can add tasks to them) only if there
  // are columns. If the board has zero columns and zero tasks, show empty state.
  if (columns.length === 0 && filteredTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState emoji="📋" title="Este board está vacío" description="Crea tu primera tarea para empezar" actionLabel="Nueva Tarea" onAction={() => setNewTaskDialogOpen(true)} />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 overflow-x-auto p-3 md:p-6">
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={filteredTasks.filter((t) => (t.columnId ?? "") === column.id)}
            />
          ))}
        </SortableContext>

        {/* Add column button */}
        <button
          onClick={() => { setAddColOpen(true); setNewColName(""); }}
          className="flex h-12 min-w-[200px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/10 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
          title="Agregar columna"
        >
          <Plus className="h-4 w-4" />
          Agregar columna
        </button>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
        {activeColumn && (
          <div className="w-[280px] rounded-xl border border-primary/40 bg-card px-4 py-3 shadow-xl">
            <span className="text-sm font-semibold">{activeColumn.title}</span>
          </div>
        )}
      </DragOverlay>

      <Dialog open={addColOpen} onOpenChange={setAddColOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Nueva columna</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground">Nombre de la columna</label>
            <Input
              autoFocus
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="p. ej. Testing"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateColumn(); }}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateColumn} disabled={!newColName.trim()}>Crear columna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
