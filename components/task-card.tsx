"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Paperclip, ExternalLink, CheckSquare, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { useBoardStore } from "@/stores/board-store";
import type { Task, Priority } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/20 text-red-400 border-red-500/30",
  alta: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  media: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  baja: "bg-green-500/20 text-green-400 border-green-500/30",
};

const storeColors: Record<string, string> = {
  MedSock: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Tendearte: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  FloraCare: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  WildropShop: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Rojucol: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Monklic: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr + "T23:59:59") < new Date();
}

export function TaskCard({ task }: { task: Task }) {
  const setSelectedTask = useBoardStore((s) => s.setSelectedTask);
  const getAllTeamMembers = useBoardStore((s) => s.getAllTeamMembers);
  const allMembers = getAllTeamMembers();
  const assignee = allMembers.find((m) => m.id === task.assigneeId);
  const subs = task.subtasks ?? [];
  const subsDone = subs.filter((s) => s.completed).length;
  const tasks = useBoardStore((s) => s.tasks);
  const blockers = (task.blockedBy ?? []).map((bid) => tasks.find((t) => t.id === bid)).filter((t) => t && t.status !== "completado");
  const isBlocked = blockers.length > 0;

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const { duplicateTask, deleteTask, updateTask, moveTask, archiveTask, moveTaskToBoard, boards, activeBoardId } = useBoardStore();
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const cols = activeBoard?.columns ?? [];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        "group/card relative cursor-pointer rounded-lg border border-border bg-card p-3.5 shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30"
      )}
    >
      {/* Open detail button */}
      <button
        onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-all duration-150 rounded-md bg-primary text-primary-foreground px-1.5 py-0.5 shadow-sm hover:bg-primary/90 flex items-center gap-1 text-[10px] font-medium"
        title="Ver detalle"
      >
        <ExternalLink className="h-3 w-3" /> Abrir
      </button>

      {/* Title */}
      <p className="mb-2.5 pr-6 text-sm font-medium leading-snug">{task.title.replace(/<[^>]*>/g, "")}</p>

      {/* Badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className={cn("text-[10px] capitalize", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        <Badge variant="outline" className={cn("text-[10px]", storeColors[task.store])}>
          {task.store}
        </Badge>
        {(task.tags ?? []).map((tagId) => {
          const tag = useBoardStore.getState().getAllTags().find((t) => t.id === tagId);
          if (!tag) return null;
          return <span key={tagId} className="rounded-full px-1.5 py-0.5 text-[9px] text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>;
        })}
      </div>

      {/* Blocked indicator */}
      {isBlocked && (
        <div className="mb-2 flex items-center gap-1.5 rounded bg-red-500/10 px-2 py-1 text-[10px] text-red-500" title={`Bloqueada por: ${blockers.map((t) => t!.title.replace(/<[^>]*>/g, "")).join(", ")}`}>
          <Lock className="h-3 w-3 shrink-0" />
          <span className="truncate">Bloqueada por {blockers.length} tarea{blockers.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={cn("flex items-center gap-1", task.status !== "completado" && isOverdue(task.dueDate) && "text-red-400")}>
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </div>

          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {task.attachments.length}
            </div>
          )}

          {subs.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              <span>{subsDone}/{subs.length}</span>
            </div>
          )}
        </div>

        {assignee && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className={cn("text-[10px] font-medium", assignee.color ? `${assignee.color} text-white` : "bg-muted")}>
              {assignee.avatar}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-[200px]">
        <ContextMenuItem onClick={() => setSelectedTask(task.id)}>Abrir detalle</ContextMenuItem>
        <ContextMenuItem onClick={() => { duplicateTask(task.id); toast.success("Tarea duplicada"); }}>Duplicar</ContextMenuItem>
        <ContextMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Prioridad</div>
        {(["urgente", "alta", "media", "baja"] as Priority[]).map((p) => (
          <ContextMenuItem key={p} onClick={() => updateTask(task.id, { priority: p })} className={cn("capitalize", task.priority === p && "bg-accent")}>
            {p}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Mover a</div>
        {cols.filter((c) => c.id !== task.status).map((c) => (
          <ContextMenuItem key={c.id} onClick={() => { moveTask(task.id, c.id as "por_hacer" | "en_proceso" | "en_revision" | "completado"); toast("Tarea movida"); }}>
            {c.title}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Asignar a</div>
        {allMembers.map((m) => (
          <ContextMenuItem key={m.id} onClick={() => { updateTask(task.id, { assigneeId: m.id }); toast.success(`Asignado a ${m.name}`); }} className={cn(task.assigneeId === m.id && "bg-accent")}>
            {m.name}
          </ContextMenuItem>
        ))}
        {boards.filter((b) => b.id !== activeBoardId).length > 0 && (
          <>
            <ContextMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase">Mover a board</div>
            {boards.filter((b) => b.id !== activeBoardId).map((b) => (
              <ContextMenuItem key={b.id} onClick={() => { moveTaskToBoard(task.id, b.id); toast.success(`Tarea movida a ${b.name}`); }}>
                {b.name}
              </ContextMenuItem>
            ))}
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => { archiveTask(task.id); toast.success("Tarea archivada"); }}>Archivar</ContextMenuItem>
        <ContextMenuItem onClick={() => { if (confirm("¿Eliminar esta tarea?")) { deleteTask(task.id); toast.success("Tarea movida a papelera"); } }} className="text-red-500 focus:text-red-500">Eliminar</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
