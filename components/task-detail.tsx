"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  Sheet, SheetContent, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Link2, Paperclip, Plus, Send, Trash2, Upload, Activity,
  MessageSquare, ExternalLink, FileText, FileImage, FileVideo, FileArchive, File,
  CheckSquare, X, ArrowRight, Pencil, Clock, Maximize2, Share2, Star, GripVertical,
  MoreHorizontal, Copy, Archive, Download, ChevronDown, ChevronRight, MoreVertical,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBoardStore } from "@/stores/board-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { COLUMNS, PRIORITIES } from "@/lib/mock-data";
import type { Status, Store, Priority, CampaignType, ReminderOption } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "doc", "docx", "txt", "xlsx", "csv"].includes(ext)) return <FileText className="h-4 w-4 text-blue-400" />;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "psd", "fig"].includes(ext)) return <FileImage className="h-4 w-4 text-emerald-400" />;
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return <FileVideo className="h-4 w-4 text-purple-400" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive className="h-4 w-4 text-amber-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: "none", label: "Sin recordatorio" },
  { value: "same_day", label: "El mismo día" },
  { value: "1_day", label: "1 día antes" },
  { value: "3_days", label: "3 días antes" },
  { value: "1_week", label: "1 semana antes" },
];

const statusBadge: Record<string, string> = {
  por_hacer: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  en_proceso: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  en_revision: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  completado: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
const statusDot: Record<string, string> = { por_hacer: "bg-slate-500", en_proceso: "bg-blue-500", en_revision: "bg-amber-500", completado: "bg-emerald-500" };
const priorityBadge: Record<string, string> = {
  urgente: "bg-red-500/15 text-red-600 dark:text-red-400",
  alta: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  media: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  baja: "bg-gray-400/15 text-gray-500 dark:text-gray-400",
};

function exportTaskMarkdown(task: ReturnType<typeof useBoardStore.getState>["tasks"][0], allMembers: { id: string; name: string }[]) {
  const assignee = allMembers.find((m) => m.id === task.assigneeId)?.name ?? "Sin asignar";
  const statusLabel = COLUMNS.find((c) => c.id === task.status)?.title ?? task.status;
  const subs = (task.subtasks ?? []).map((s) => `- [${s.completed ? "x" : " "}] ${s.title}`).join("\n");
  const urls = task.urls.map((u) => `- ${u}`).join("\n");
  const desc = task.customFields?.description?.replace(/<[^>]*>/g, "") ?? "";
  const md = `# ${task.title.replace(/<[^>]*>/g, "")}

| Propiedad | Valor |
|-----------|-------|
| Estado | ${statusLabel} |
| Prioridad | ${task.priority} |
| Responsable | ${assignee} |
| Tienda | ${task.store} |
| Fecha | ${task.dueDate} |
| Tipo Campaña | ${task.campaignType} |
| Nombre Campaña | ${task.campaignName} |

${desc ? `## Descripción\n\n${desc}\n` : ""}
${subs ? `## Subtareas\n\n${subs}\n` : ""}
${urls ? `## URLs\n\n${urls}\n` : ""}`;
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${task.title.replace(/<[^>]*>/g, "").slice(0, 40)}.md`; a.click(); URL.revokeObjectURL(url);
}

// ── Main Component ─────────────────────────────────────────────
export function TaskDetail() {
  const {
    tasks, selectedTaskId, setSelectedTask, updateTask, updateTaskWithActivity,
    removeAttachment, getAllStores, getAllCampaignTypes, getAllTeamMembers,
    addSubtask, toggleSubtask, removeSubtask, reorderSubtasks, setReminder,
    getAllTags, archiveTask, unarchiveTask, duplicateTask, deleteTask,
  } = useBoardStore();

  const { toggleFavorite, isFavorite } = useSidebarStore();
  const allStores = getAllStores();
  const allCampaignTypes = getAllCampaignTypes();
  const allMembers = getAllTeamMembers();

  const [newUrl, setNewUrl] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  const task = tasks.find((t) => t.id === selectedTaskId);

  const [uploading, setUploading] = useState(false);
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!task) return;
      setUploading(true);
      let uploaded = 0;
      for (const file of acceptedFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("taskId", task.id);
          formData.append("field", "attachment");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Error al subir" }));
            toast.error(err.error || "Error al subir archivo");
            continue;
          }
          const saved = await res.json();
          // Add to local store immediately
          updateTask(task.id, {
            attachments: [...(useBoardStore.getState().tasks.find((t) => t.id === task.id)?.attachments || []), {
              id: saved.id,
              name: saved.name,
              size: saved.size >= 1048576 ? `${(saved.size / 1048576).toFixed(1)} MB` : `${(saved.size / 1024).toFixed(0)} KB`,
              type: saved.type,
              url: saved.url,
            }],
          });
          uploaded++;
        } catch {
          toast.error(`Error al subir ${file.name}`);
        }
      }
      setUploading(false);
      if (uploaded > 0) toast.success(`${uploaded} archivo(s) subido(s)`);
    },
    [task, updateTask],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (addingSubtask) setTimeout(() => subtaskInputRef.current?.focus(), 0);
  }, [addingSubtask]);

  // Sync title into contentEditable on task change
  useEffect(() => {
    if (titleRef.current && task) {
      const plainTitle = task.title.replace(/<[^>]*>/g, "");
      if (titleRef.current.textContent !== plainTitle) {
        titleRef.current.textContent = plainTitle;
      }
    }
  }, [selectedTaskId, task?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync description
  useEffect(() => {
    if (descRef.current && task) {
      descRef.current.innerHTML = task.customFields?.description ?? "";
    }
  }, [selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!task) return null;

  const isFav = isFavorite("page", `task_${task.id}`);

  const addUrl = () => { if (!newUrl.trim()) return; updateTask(task.id, { urls: [...task.urls, newUrl.trim()] }); setNewUrl(""); };
  const removeUrl = (index: number) => { updateTask(task.id, { urls: task.urls.filter((_, i) => i !== index) }); };
  const addComment = () => {
    if (!newComment.trim()) return;
    updateTask(task.id, { comments: [...task.comments, { id: `c${Date.now()}`, authorId: "u1", content: newComment.trim(), createdAt: new Date().toISOString() }] });
    setNewComment("");
    toast.success("Comentario agregado");
  };
  const handleFieldChange = (updates: Record<string, unknown>) => { updateTaskWithActivity(task.id, updates); };
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    toast.success("Subtarea agregada");
  };
  const saveDescription = () => {
    if (!descRef.current) return;
    const html = descRef.current.innerHTML;
    updateTask(task.id, { customFields: { ...task.customFields, description: html } });
  };

  const subtasks = task.subtasks ?? [];
  const subsDone = subtasks.filter((s) => s.completed).length;
  const subsPct = subtasks.length > 0 ? Math.round((subsDone / subtasks.length) * 100) : 0;
  const assignee = allMembers.find((m) => m.id === task.assigneeId);

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={() => {
      // Auto-save: blur active element to trigger onBlur saves before closing
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      setTimeout(() => setSelectedTask(null), 0);
    }}>
      <SheetContent className="w-full sm:max-w-[600px] p-0 gap-0 flex flex-col" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Detalle de tarea</SheetTitle>
        {/* ═══ A) HEADER ═══ */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Abrir como página">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Compartir">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            onClick={() => toggleFavorite("page", `task_${task.id}`)}>
            <Star className={cn("h-3.5 w-3.5", isFav ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
          </Button>
          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem onClick={() => { duplicateTask(task.id); toast.success("Tarea duplicada"); }}>
                <Copy className="mr-2 h-3.5 w-3.5" />Duplicar
              </DropdownMenuItem>
              {task.archivedAt ? (
                <DropdownMenuItem onClick={() => { unarchiveTask(task.id); toast.success("Tarea desarchivada"); }}>
                  <Archive className="mr-2 h-3.5 w-3.5" />Desarchivar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => { archiveTask(task.id); toast.success("Tarea archivada"); }}>
                  <Archive className="mr-2 h-3.5 w-3.5" />Archivar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { exportTaskMarkdown(task, allMembers); toast.success("Markdown descargado"); }}>
                <Download className="mr-2 h-3.5 w-3.5" />Exportar como Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { if (confirm("¿Eliminar esta tarea?")) { deleteTask(task.id); setSelectedTask(null); toast.success("Tarea eliminada"); } }} className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setSelectedTask(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5">
            {/* Cover */}
            {task.coverImage && (
              <div className="relative -mx-6 -mt-5 mb-5 h-36 bg-cover bg-center group" style={{ backgroundImage: `url(${task.coverImage})` }}>
                <button onClick={() => updateTask(task.id, { coverImage: null })} className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Quitar</button>
              </div>
            )}

            {/* ═══ B) TITLE ═══ */}
            <h1
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              className="text-[1.75rem] font-bold leading-tight outline-none mb-1 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
              data-placeholder="Sin título"
              onBlur={(e) => {
                const text = e.currentTarget.textContent?.trim() ?? "";
                if (text !== task.title.replace(/<[^>]*>/g, "")) updateTask(task.id, { title: text });
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
            />
            {!task.coverImage && (
              <button onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("field", "cover");
                  try {
                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                    if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.error || "Error al subir"); return; }
                    const { url } = await res.json();
                    updateTaskWithActivity(task.id, { coverImage: url });
                  } catch { toast.error("Error al subir imagen"); }
                };
                input.click();
              }}
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground mb-3 block transition-colors">
                + Agregar portada
              </button>
            )}

            {/* ═══ C) PROPERTIES ═══ */}
            <div className="border border-border/60 rounded-lg divide-y divide-border/60 mb-5 mt-3">
              {/* Responsable */}
              <PropRow label="Responsable">
                <Select value={task.assigneeId} onValueChange={(v) => handleFieldChange({ assigneeId: v })}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {assignee && (
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className={cn("text-[8px] font-medium", assignee.color ? `${assignee.color} text-white` : "bg-muted")}>{assignee.avatar}</AvatarFallback>
                        </Avatar>
                      )}
                      <span>{assignee?.name ?? "Sin asignar"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>{allMembers.map((m) => <SelectItem key={m.id} value={m.id}><span className="flex items-center gap-2">{m.name}<span className="text-[10px] text-muted-foreground">— {m.role}</span></span></SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Estado */}
              <PropRow label="Estado">
                <Select value={task.status} onValueChange={(v) => handleFieldChange({ status: v as Status })}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50">
                    <Badge variant="outline" className={cn("text-[10px] border-none gap-1.5", statusBadge[task.status])}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[task.status])} />
                      <SelectValue />
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>{COLUMNS.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Prioridad */}
              <PropRow label="Prioridad">
                <Select value={task.priority} onValueChange={(v) => handleFieldChange({ priority: v as Priority })}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50">
                    <Badge variant="outline" className={cn("text-[10px] capitalize border-none", priorityBadge[task.priority])}>
                      <SelectValue />
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Fecha */}
              <PropRow label="Fecha límite">
                <Input type="date" value={task.dueDate} onChange={(e) => handleFieldChange({ dueDate: e.target.value })}
                  className="h-8 text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50" />
              </PropRow>
              {/* Recordatorio */}
              <PropRow label="Recordatorio">
                <Select value={task.reminder ?? "none"} onValueChange={(v) => setReminder(task.id, v as ReminderOption)}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{REMINDER_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Tienda */}
              <PropRow label="Tienda">
                <Select value={task.store} onValueChange={(v) => handleFieldChange({ store: v as Store })}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{allStores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Cuenta Pub. */}
              <PropRow label="Cuenta Pub.">
                <Input value={task.adAccount} onBlur={(e) => { if (e.target.value !== task.adAccount) handleFieldChange({ adAccount: e.target.value }); }}
                  onChange={(e) => updateTask(task.id, { adAccount: e.target.value })}
                  className="h-8 text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50" placeholder="Act_..." />
              </PropRow>
              {/* Tipo Campaña */}
              <PropRow label="Tipo Campaña">
                <Select value={task.campaignType} onValueChange={(v) => handleFieldChange({ campaignType: v as CampaignType })}>
                  <SelectTrigger className="h-8 w-full text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{allCampaignTypes.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                </Select>
              </PropRow>
              {/* Nombre Campaña */}
              <PropRow label="Nombre Campaña">
                <Input value={task.campaignName} onBlur={(e) => { if (e.target.value !== task.campaignName) handleFieldChange({ campaignName: e.target.value }); }}
                  onChange={(e) => updateTask(task.id, { campaignName: e.target.value })}
                  className="h-8 text-xs border-none shadow-none bg-transparent px-2 hover:bg-muted/50" placeholder="Nombre..." />
              </PropRow>
              {/* Etiquetas */}
              <PropRow label="Etiquetas">
                <div className="flex flex-wrap gap-1 px-2 py-1.5 min-h-[32px] items-center">
                  {getAllTags().map((tag) => {
                    const isActive = (task.tags ?? []).includes(tag.id);
                    return (
                      <button key={tag.id} onClick={() => {
                        const current = task.tags ?? [];
                        updateTask(task.id, { tags: isActive ? current.filter((t) => t !== tag.id) : [...current, tag.id] });
                      }} className={cn("rounded-full px-2 py-0.5 text-[10px] border transition-colors", isActive ? "text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted")}
                        style={isActive ? { backgroundColor: tag.color } : {}}>
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </PropRow>
              {/* Bloqueada por */}
              <PropRow label="Bloqueada por">
                <div className="px-2 py-1.5 space-y-1 min-h-[32px]">
                  {(task.blockedBy ?? []).map((bid) => {
                    const bt = tasks.find((t) => t.id === bid);
                    return bt ? (
                      <div key={bid} className="flex items-center gap-1 text-[10px]">
                        <span className={cn("truncate flex-1", bt.status === "completado" && "line-through text-muted-foreground")}>{bt.title.replace(/<[^>]*>/g, "")}</span>
                        <button onClick={() => updateTask(task.id, { blockedBy: (task.blockedBy ?? []).filter((x) => x !== bid) })} className="text-red-400 hover:text-red-500">&times;</button>
                      </div>
                    ) : null;
                  })}
                  <select onChange={(e) => { if (e.target.value) { updateTask(task.id, { blockedBy: [...(task.blockedBy ?? []), e.target.value] }); e.target.value = ""; } }}
                    className="w-full h-6 text-[10px] bg-transparent border-none outline-none text-muted-foreground cursor-pointer">
                    <option value="">+ Agregar dependencia...</option>
                    {tasks.filter((t) => t.id !== task.id && !(task.blockedBy ?? []).includes(t.id)).map((t) => (
                      <option key={t.id} value={t.id}>{t.title.replace(/<[^>]*>/g, "")}</option>
                    ))}
                  </select>
                </div>
              </PropRow>
              {/* Estimado */}
              <PropRow label="Estimado">
                <div className="flex items-center gap-1 px-2">
                  <Input type="number" min={0} value={task.estimatedTime ?? ""} onChange={(e) => updateTask(task.id, { estimatedTime: Number(e.target.value) || 0 })} className="h-7 text-xs w-16 border-none shadow-none bg-transparent hover:bg-muted/50" placeholder="0" />
                  <select value={task.estimatedUnit ?? "hours"} onChange={(e) => updateTask(task.id, { estimatedUnit: e.target.value as "hours" | "days" })} className="h-7 text-[10px] bg-transparent border-none outline-none text-muted-foreground cursor-pointer">
                    <option value="hours">horas</option><option value="days">días</option>
                  </select>
                </div>
              </PropRow>
              {/* Real */}
              <PropRow label="Real">
                <div className="flex items-center gap-1 px-2">
                  <Input type="number" min={0} value={task.actualTime ?? ""} onChange={(e) => updateTask(task.id, { actualTime: Number(e.target.value) || 0 })} className="h-7 text-xs w-16 border-none shadow-none bg-transparent hover:bg-muted/50" placeholder="0" />
                  <select value={task.actualUnit ?? "hours"} onChange={(e) => updateTask(task.id, { actualUnit: e.target.value as "hours" | "days" })} className="h-7 text-[10px] bg-transparent border-none outline-none text-muted-foreground cursor-pointer">
                    <option value="hours">horas</option><option value="days">días</option>
                  </select>
                </div>
              </PropRow>
            </div>
            {/* + Agregar propiedad (decorativo) */}
            <button className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-4 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Agregar propiedad
            </button>

            {/* ═══ D) SEPARATOR ═══ */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[160px]">
                  <DropdownMenuItem onClick={() => { duplicateTask(task.id); toast.success("Tarea duplicada"); }}>Duplicar tarea</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportTaskMarkdown(task, allMembers); toast.success("Descargado"); }}>Exportar Markdown</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ═══ E) COMMENTS ═══ */}
            <section className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <MessageSquare className="h-3.5 w-3.5" />Comentarios
              </h3>
              {/* Comment input */}
              <div className="flex gap-2.5 mb-4">
                <Avatar className="h-7 w-7 shrink-0 mt-1">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">A</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Agregar un comentario..."
                    className="min-h-[56px] resize-none text-xs bg-muted/30 border-border/50 focus:bg-background transition-colors"
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addComment(); }} />
                  {newComment.trim() && (
                    <div className="flex justify-end mt-1.5">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={addComment}><Send className="h-3 w-3" /> Enviar</Button>
                    </div>
                  )}
                </div>
              </div>
              {/* Comment list */}
              <div className="space-y-3">
                {task.comments.map((comment) => {
                  const author = allMembers.find((m) => m.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                        <AvatarFallback className={cn("text-[9px] font-medium", author?.color ? `${author.color} text-white` : "bg-muted")}>{author?.avatar ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{author?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="h-px bg-border/60 mb-6" />

            {/* ═══ F) DESCRIPTION ═══ */}
            <section className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Pencil className="h-3.5 w-3.5" />Descripción de la tarea
              </h3>
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[80px] text-sm leading-relaxed outline-none rounded-lg border border-transparent hover:border-border/50 focus:border-border px-3 py-2 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
                data-placeholder="Escribe una descripción, usa Ctrl+B para negrita..."
                onBlur={saveDescription}
                onKeyDown={(e) => {
                  if (e.key === "b" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("bold"); }
                  if (e.key === "i" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("italic"); }
                  if (e.key === "u" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("underline"); }
                }}
              />
            </section>

            <div className="h-px bg-border/60 mb-6" />

            {/* ═══ G) SUBTASKS ═══ */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Subtareas
                  {subtasks.length > 0 && <span className="text-[10px] font-normal text-muted-foreground/70">{subsDone}/{subtasks.length}</span>}
                </h3>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => setAddingSubtask(true)}>
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>

              {subtasks.length > 0 && (
                <div className="mb-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${subsPct}%` }} />
                </div>
              )}

              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
                const { active, over } = e;
                if (!over || active.id === over.id) return;
                const oldIdx = subtasks.findIndex((s) => s.id === active.id);
                const newIdx = subtasks.findIndex((s) => s.id === over.id);
                if (oldIdx !== -1 && newIdx !== -1) reorderSubtasks(task.id, arrayMove(subtasks, oldIdx, newIdx));
              }}>
                <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-0.5">
                    {subtasks.map((sub) => (
                      <SortableSubtask key={sub.id} sub={sub} taskId={task.id} toggleSubtask={toggleSubtask} removeSubtask={removeSubtask} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {addingSubtask && (
                <div className="mt-2 flex gap-2">
                  <Input ref={subtaskInputRef} value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Título de la subtarea..." className="h-7 flex-1 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") { setAddingSubtask(false); setNewSubtaskTitle(""); }
                    }} />
                  <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleAddSubtask}><Plus className="h-3 w-3" /></Button>
                </div>
              )}
            </section>

            <div className="h-px bg-border/60 mb-6" />

            {/* ═══ H) ATTACHMENTS ═══ */}
            <section className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Paperclip className="h-3.5 w-3.5" />Archivos adjuntos
              </h3>
              {task.attachments.length > 0 && (
                <div className="mb-3 space-y-1">
                  {task.attachments.map((att, i) => {
                    const ext = att.name.split(".").pop()?.toLowerCase() ?? "";
                    const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
                    const handleDelete = async () => {
                      if (att.id) {
                        await fetch(`/api/attachments?id=${att.id}`, { method: "DELETE" }).catch(() => {});
                      }
                      removeAttachment(task.id, i);
                      toast.success("Archivo eliminado");
                    };
                    return (
                      <div key={att.id || i} className="relative flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 group">
                        {getFileIcon(att.name)}
                        {att.url ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-xs text-primary hover:underline">{att.name}</a>
                        ) : (
                          <span className="flex-1 truncate text-xs">{att.name}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{att.size}</span>
                        <button onClick={handleDelete}
                          className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/20 hover:text-destructive transition-all">
                          <Trash2 className="h-3 w-3" />
                        </button>
                        {isImage && att.url && (
                          <div className="absolute left-0 bottom-full mb-2 z-50 hidden group-hover:block pointer-events-none">
                            <div className="rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                              <img src={att.url} alt={att.name} className="w-48 h-32 object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div {...getRootProps()} className={cn("cursor-pointer rounded-lg border-2 border-dashed border-border/60 p-5 text-center transition-colors hover:border-border", isDragActive && "border-primary bg-primary/5", uploading && "opacity-50 pointer-events-none")}>
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/50" />
                <p className="text-[11px] text-muted-foreground/70">{uploading ? "Subiendo archivos..." : isDragActive ? "Suelta los archivos aquí..." : "Arrastra archivos o haz click para subir"}</p>
              </div>
            </section>

            <div className="h-px bg-border/60 mb-6" />

            {/* ═══ I) URLS ═══ */}
            <section className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Link2 className="h-3.5 w-3.5" />URLs
              </h3>
              <div className="space-y-1.5">
                {task.urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 group">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center gap-1.5 truncate text-xs text-blue-500 hover:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="h-3 w-3 shrink-0" />{url}
                    </a>
                    <button onClick={() => removeUrl(i)} className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/20 hover:text-destructive transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="h-7 flex-1 text-xs" onKeyDown={(e) => e.key === "Enter" && addUrl()} />
                  <Button variant="outline" size="sm" className="h-7 px-2" onClick={addUrl}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </section>

            <div className="h-px bg-border/60 mb-6" />

            {/* ═══ J) ACTIVITY (collapsable) ═══ */}
            <section className="mb-4">
              <button onClick={() => setActivityOpen(!activityOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors w-full text-left">
                {activityOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Activity className="h-3.5 w-3.5" />
                Actividad
                <span className="text-[10px] font-normal text-muted-foreground/50 ml-1">{task.activity.length}</span>
              </button>
              {activityOpen && (
                <div className="space-y-2 pl-1">
                  {[...task.activity].reverse().map((entry) => {
                    const author = allMembers.find((m) => m.id === entry.authorId);
                    return (
                      <div key={entry.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted/80 shrink-0">
                          {entry.field === "status" ? <ArrowRight className="h-2.5 w-2.5" /> : <Pencil className="h-2.5 w-2.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span><span className="font-medium text-foreground">{author?.name}</span> {entry.action}</span>
                          <div className="text-[10px] mt-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{timeAgo(entry.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── Sortable Subtask ───────────────────────────────────────────
function SortableSubtask({ sub, taskId, toggleSubtask, removeSubtask }: {
  sub: { id: string; title: string; completed: boolean };
  taskId: string;
  toggleSubtask: (taskId: string, subId: string) => void;
  removeSubtask: (taskId: string, subId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1.5 rounded-md px-1 py-1.5 hover:bg-muted/50 transition-colors">
      <div {...listeners} {...attributes} className="cursor-grab opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <input type="checkbox" checked={sub.completed} onChange={() => toggleSubtask(taskId, sub.id)}
        className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer flex-shrink-0" />
      <span className={cn("flex-1 text-xs", sub.completed && "line-through text-muted-foreground")}>{sub.title}</span>
      <button onClick={() => removeSubtask(taskId, sub.id)}
        className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/20 hover:text-destructive transition-all">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Property Row ───────────────────────────────────────────────
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center min-h-[36px]">
      <span className="text-[11px] font-medium text-muted-foreground pl-3">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
