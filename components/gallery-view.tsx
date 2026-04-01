"use client";

import { useShallow } from "zustand/react/shallow";
import { useBoardStore } from "@/stores/board-store";
import { cn } from "@/lib/utils";
import { Calendar, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/20 text-red-400 border-red-500/30",
  alta: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  media: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  baja: "bg-gray-400/20 text-gray-400 border-gray-400/30",
};

const storeColors: Record<string, string> = {
  MedSock: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Tendearte: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  FloraCare: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  WildropShop: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Rojucol: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Monklic: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const priorityGradients: Record<string, string> = {
  urgente: "bg-gradient-to-br from-red-500/60 to-red-700/60",
  alta: "bg-gradient-to-br from-orange-400/60 to-orange-600/60",
  media: "bg-gradient-to-br from-blue-400/60 to-blue-600/60",
  baja: "bg-gradient-to-br from-gray-300/60 to-gray-500/60",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr + "T23:59:59") < new Date();
}

export function GalleryView() {
  const tasks = useBoardStore(useShallow((s) => s.getFilteredTasks()));
  const allMembers = useBoardStore(useShallow((s) => s.getAllTeamMembers()));
  const setSelectedTask = useBoardStore((s) => s.setSelectedTask);
  const setNewTaskDialogOpen = useBoardStore((s) => s.setNewTaskDialogOpen);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-view-in">
        <span className="text-5xl mb-4">📷</span>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No hay tareas para mostrar
        </h3>
        <p className="text-xs text-muted-foreground max-w-[250px] mb-4">
          Crea una nueva tarea para comenzar a llenar la galeria.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => setNewTaskDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Tarea
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-view-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tasks.map((task) => {
          const assignee = allMembers.find((m) => m.id === task.assigneeId);

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              className={cn(
                "group cursor-pointer rounded-lg border border-border bg-card shadow-sm",
                "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40"
              )}
            >
              {/* Cover / Gradient header */}
              {task.coverImage ? (
                <img
                  src={task.coverImage}
                  alt=""
                  className="h-32 w-full object-cover rounded-t-lg"
                />
              ) : (
                <div
                  className={cn(
                    "h-20 w-full rounded-t-lg",
                    priorityGradients[task.priority] ?? priorityGradients.media
                  )}
                />
              )}

              {/* Card body */}
              <div className="p-3.5">
                {/* Title */}
                <p className="mb-2.5 text-sm font-medium leading-snug line-clamp-2 text-foreground">
                  {stripHtml(task.title)}
                </p>

                {/* Badges */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      storeColors[task.store]
                    )}
                  >
                    {task.store}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] capitalize",
                      priorityColors[task.priority]
                    )}
                  >
                    {task.priority}
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {/* Assignee avatar */}
                  {assignee ? (
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white shrink-0",
                        assignee.color ?? "bg-muted text-muted-foreground"
                      )}
                      title={assignee.name}
                    >
                      {assignee.avatar}
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-3 w-3" />
                    </div>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs text-muted-foreground",
                        task.status !== "completado" &&
                          isOverdue(task.dueDate) &&
                          "text-red-400"
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
