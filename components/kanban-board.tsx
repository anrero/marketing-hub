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
import { KanbanColumn } from "@/components/kanban-column";
import { TaskCard } from "@/components/task-card";
import { useBoardStore } from "@/stores/board-store";
import { COLUMNS } from "@/lib/mock-data";
import type { Task, Status } from "@/types";
import { toast } from "sonner";
import { EmptyState, KanbanSkeleton } from "@/components/empty-state";

export function KanbanBoard() {
  const { tasks, boards, activeBoardId, moveTask, getFilteredTasks, setNewTaskDialogOpen } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 200); return () => clearTimeout(t); }, [activeBoardId]);
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const columns = activeBoard?.columns ?? COLUMNS;

  const filteredTasks = getFilteredTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Dropped onto a column directly
      const isColumn = columns.some((c) => c.id === overId);
      if (isColumn) {
        moveTask(taskId, overId as Status);
        toast("Tarea movida");
        return;
      }

      // Dropped onto another task — use that task's column
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        moveTask(taskId, overTask.status);
        toast("Tarea movida");
      }
    },
    [moveTask, tasks]
  );

  if (loading) return <KanbanSkeleton />;

  if (filteredTasks.length === 0) {
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
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={filteredTasks.filter((t) => t.status === column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}
