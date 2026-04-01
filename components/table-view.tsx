"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Plus, Check,
  Bold, Italic, Strikethrough, Link, Palette,
  ChevronDown, Pencil, Filter, Pin, PinOff,
  ArrowLeftToLine, ArrowRightToLine, EyeOff, Trash2, Columns3, X,
  Expand, Download, Upload, CheckSquare, Copy, Users, Star, BarChart3, User, AlertCircle, CalendarDays,
  GripVertical, Layers, ChevronRight,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardStore } from "@/stores/board-store";
import { useTableColumnsStore } from "@/stores/table-columns-store";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import type { Task, Status, Priority, TableColumnDef, CustomColumnType } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Color maps ──────────────────────────────────────────────
const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/20 text-red-600 border-red-500/30 dark:text-red-400",
  alta: "bg-orange-500/20 text-orange-600 border-orange-500/30 dark:text-orange-400",
  media: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  baja: "bg-green-500/20 text-green-600 border-green-500/30 dark:text-green-400",
};
const priorityDotColors: Record<string, string> = { urgente: "bg-red-500", alta: "bg-orange-500", media: "bg-yellow-500", baja: "bg-green-500" };
const statusLabels: Record<string, string> = { por_hacer: "Por hacer", en_proceso: "En proceso", en_revision: "En revisión", completado: "Completado" };
const statusColors: Record<string, string> = {
  por_hacer: "bg-slate-500/20 text-slate-600 border-slate-500/30 dark:text-slate-400",
  en_proceso: "bg-blue-500/20 text-blue-600 border-blue-500/30 dark:text-blue-400",
  en_revision: "bg-amber-500/20 text-amber-600 border-amber-500/30 dark:text-amber-400",
  completado: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
};
const statusDotColors: Record<string, string> = { por_hacer: "bg-slate-500", en_proceso: "bg-blue-500", en_revision: "bg-amber-500", completado: "bg-emerald-500" };
const priorityOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };
const statusOrder: Record<string, number> = { por_hacer: 0, en_proceso: 1, en_revision: 2, completado: 3 };

// ── Sort ────────────────────────────────────────────────────
type SortDir = "asc" | "desc";

function sortTasks(tasks: Task[], key: string, dir: SortDir, allMembers: { id: string; name: string }[]): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    if (key === "priority") cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    else if (key === "status") cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    else if (key === "assigneeId") {
      cmp = (allMembers.find((m) => m.id === a.assigneeId)?.name ?? "").localeCompare(allMembers.find((m) => m.id === b.assigneeId)?.name ?? "");
    } else if (key === "dueDate") cmp = a.dueDate.localeCompare(b.dueDate);
    else {
      // built-in string fields or custom fields
      const valA = (a as unknown as Record<string, string>)[key] ?? a.customFields?.[key] ?? "";
      const valB = (b as unknown as Record<string, string>)[key] ?? b.customFields?.[key] ?? "";
      cmp = String(valA).localeCompare(String(valB));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ── Helpers ─────────────────────────────────────────────────
function getCellValue(task: Task, col: TableColumnDef, allMembers: { id: string; name: string }[]): string {
  if (!col.builtIn) return task.customFields?.[col.id] ?? "";
  const raw = (task as unknown as Record<string, string>)[col.key];
  if (col.key === "status") return statusLabels[raw as string] ?? String(raw ?? "");
  if (col.key === "priority") return String(raw ?? "");
  if (col.key === "assigneeId") return allMembers.find((m) => m.id === raw)?.name ?? String(raw ?? "");
  if (col.key === "dueDate") {
    try { return new Date(raw + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }); } catch { return String(raw ?? ""); }
  }
  return String(raw ?? "");
}

function useFlash() {
  const [flashId, setFlashId] = useState<string | null>(null);
  const flash = useCallback((id: string) => { setFlashId(id); setTimeout(() => setFlashId(null), 600); }, []);
  return { flashId, flash };
}

// ── Date badge helper ───────────────────────────────────────
function getDateBadge(dateStr: string, status: string): { label: string; className: string } | null {
  if (status === "completado") return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00"); d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: "Vencida", className: "bg-red-500/20 text-red-600 dark:text-red-400" };
  if (diff === 0) return { label: "Hoy", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" };
  if (diff === 1) return { label: "Mañana", className: "bg-orange-500/20 text-orange-600 dark:text-orange-400" };
  if (diff <= 3) return { label: `En ${diff} días`, className: "bg-orange-500/20 text-orange-600 dark:text-orange-400" };
  return null;
}

// ── Subtask indicator ───────────────────────────────────────
function SubtaskIndicator({ task }: { task: Task }) {
  const subs = task.subtasks ?? [];
  if (subs.length === 0) return null;
  const done = subs.filter((s) => s.completed).length;
  const pct = Math.round((done / subs.length) * 100);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
      <CheckSquare className="h-3 w-3" />
      {done}/{subs.length}
      <span className="inline-block w-8 h-1 rounded-full bg-muted overflow-hidden">
        <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

// ── Export helpers ───────────────────────────────────────────
function exportCSV(tasks: Task[], boardName: string, allMembers: { id: string; name: string }[]) {
  const headers = ["Título", "Status", "Tienda", "Cuenta Pub.", "Tipo Campaña", "Prioridad", "Responsable", "Fecha", "Subtareas"];
  const rows = tasks.map((t) => [
    t.title.replace(/<[^>]*>/g, ""), statusLabels[t.status] ?? t.status, t.store, t.adAccount,
    t.campaignType, t.priority, allMembers.find((m) => m.id === t.assigneeId)?.name ?? "", t.dueDate,
    `${(t.subtasks ?? []).filter((s) => s.completed).length}/${(t.subtasks ?? []).length}`,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${boardName}_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
}

function exportJSON(tasks: Task[], boardName: string) {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${boardName}_${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(url);
}

// ── CSV Import Dialog ───────────────────────────────────────
const CSV_FIELD_MAP: Record<string, string> = {
  titulo: "title", title: "title", nombre: "title", tarea: "title",
  status: "status", estado: "status",
  tienda: "store", store: "store",
  prioridad: "priority", priority: "priority",
  responsable: "assigneeId", assignee: "assigneeId", asignado: "assigneeId",
  fecha: "dueDate", "fecha entrega": "dueDate", "due date": "dueDate", duedate: "dueDate",
  "cuenta pub": "adAccount", "cuenta publicitaria": "adAccount", adaccount: "adAccount",
  "tipo campaña": "campaignType", "campaign type": "campaignType", campaigntype: "campaignType",
  "nombre campaña": "campaignName", "campaign name": "campaignName", campaignname: "campaignName",
};

const STATUS_MAP: Record<string, Status> = {
  "por hacer": "por_hacer", "por_hacer": "por_hacer", "to do": "por_hacer", todo: "por_hacer",
  "en proceso": "en_proceso", "en_proceso": "en_proceso", "in progress": "en_proceso",
  "en revisión": "en_revision", "en revision": "en_revision", "en_revision": "en_revision", review: "en_revision",
  completado: "completado", done: "completado", completed: "completado",
};

const PRIORITY_MAP: Record<string, Priority> = {
  urgente: "urgente", urgent: "urgente", alta: "alta", high: "alta",
  media: "media", medium: "media", baja: "baja", low: "baja",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      row.push(current.trim()); current = "";
    } else if (ch === "\n" && !inQuotes) {
      row.push(current.trim()); current = "";
      if (row.some((c) => c)) rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      current += ch;
    }
  }
  row.push(current.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

function CsvImportDialog({ open, onOpenChange, allMembers }: { open: boolean; onOpenChange: (o: boolean) => void; allMembers: { id: string; name: string }[] }) {
  const { addTask, boards, activeBoardId } = useBoardStore();
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error("El CSV no tiene datos suficientes"); return; }
      const hdrs = rows[0];
      setHeaders(hdrs);
      setCsvRows(rows.slice(1));
      // Auto-detect mapping
      const autoMap: Record<number, string> = {};
      hdrs.forEach((h, i) => {
        const norm = h.toLowerCase().trim();
        if (CSV_FIELD_MAP[norm]) autoMap[i] = CSV_FIELD_MAP[norm];
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const taskFields = [
    { value: "", label: "— No importar —" },
    { value: "title", label: "Título" },
    { value: "status", label: "Estado" },
    { value: "store", label: "Tienda" },
    { value: "priority", label: "Prioridad" },
    { value: "assigneeId", label: "Responsable" },
    { value: "dueDate", label: "Fecha entrega" },
    { value: "adAccount", label: "Cuenta Pub." },
    { value: "campaignType", label: "Tipo Campaña" },
    { value: "campaignName", label: "Nombre Campaña" },
  ];

  const handleImport = () => {
    if (csvRows.length === 0) return;
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;
    let count = 0;
    for (const row of csvRows) {
      const data: Record<string, string> = {};
      headers.forEach((_, i) => {
        const field = mapping[i];
        if (field && row[i]) data[field] = row[i];
      });
      if (!data.title) continue;
      const assignee = data.assigneeId ? allMembers.find((m) => m.name.toLowerCase() === data.assigneeId.toLowerCase())?.id ?? "u1" : "u1";
      const status = data.status ? STATUS_MAP[data.status.toLowerCase()] ?? "por_hacer" : "por_hacer";
      const priority = data.priority ? PRIORITY_MAP[data.priority.toLowerCase()] ?? "media" : "media";
      const task = {
        id: `t${Date.now()}_${count}`,
        title: data.title,
        status,
        priority,
        store: data.store || "MedSock",
        assigneeId: assignee,
        campaignType: data.campaignType || "Conversión",
        campaignName: data.campaignName || "",
        adAccount: data.adAccount || "",
        dueDate: data.dueDate || new Date().toISOString().split("T")[0],
        urls: [],
        attachments: [],
        comments: [],
        activity: [{ id: `a${Date.now()}_import`, authorId: "u1", action: "importó la tarea desde CSV", createdAt: new Date().toISOString() }],
      };
      addTask(task as import("@/types").Task);
      count++;
    }
    toast.success(`${count} tareas importadas correctamente`);
    onOpenChange(false);
    setCsvRows([]);
    setHeaders([]);
    setMapping({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importar tareas desde CSV</DialogTitle></DialogHeader>
        {headers.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Selecciona un archivo .csv con tus tareas</p>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Seleccionar archivo</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Column mapping */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mapeo de columnas</p>
              <div className="grid grid-cols-2 gap-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-28 truncate shrink-0" title={h}>{h}</span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <select value={mapping[i] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [i]: e.target.value }))}
                      className="flex-1 h-7 text-xs bg-transparent border border-border rounded px-1.5">
                      {taskFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            {/* Preview */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vista previa ({csvRows.length} tareas)</p>
              <div className="rounded-lg border border-border overflow-x-auto max-h-[250px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted/50">{headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {csvRows.slice(0, 10).map((row, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {row.map((cell, ci) => <td key={ci} className="px-2 py-1 truncate max-w-[150px]">{cell}</td>)}
                      </tr>
                    ))}
                    {csvRows.length > 10 && <tr><td colSpan={headers.length} className="px-2 py-1 text-center text-muted-foreground">... y {csvRows.length - 10} más</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCsvRows([]); setHeaders([]); setMapping({}); }}>Cancelar</Button>
              <Button size="sm" onClick={handleImport} disabled={!Object.values(mapping).includes("title")}>
                Importar {csvRows.length} tareas
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── View icon map ───────────────────────────────────────────
function ViewIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "star": return <Star className="h-3.5 w-3.5" />;
    case "chart": return <BarChart3 className="h-3.5 w-3.5" />;
    case "user": return <User className="h-3.5 w-3.5" />;
    case "alert": return <AlertCircle className="h-3.5 w-3.5" />;
    case "calendar": return <CalendarDays className="h-3.5 w-3.5" />;
    default: return <Star className="h-3.5 w-3.5" />;
  }
}

// ── Bulk Actions Bar ────────────────────────────────────────
function BulkActionsBar({ selectedIds, onClear }: { selectedIds: Set<string>; onClear: () => void }) {
  const { bulkMove, bulkAssign, bulkPriority, bulkDelete, bulkDuplicate, getAllTeamMembers } = useBoardStore();
  const allMembers = getAllTeamMembers();
  const ids = Array.from(selectedIds);
  const statuses: Status[] = ["por_hacer", "en_proceso", "en_revision", "completado"];
  const priorities: Priority[] = ["urgente", "alta", "media", "baja"];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 mb-3">
      <span className="text-xs font-semibold">{ids.length} seleccionadas</span>
      <div className="mx-2 h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><ArrowRightToLine className="h-3 w-3" /> Mover a...</Button></DropdownMenuTrigger>
        <DropdownMenuContent>{statuses.map((s) => <DropdownMenuItem key={s} onClick={() => { bulkMove(ids, s); onClear(); }}>{statusLabels[s]}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Users className="h-3 w-3" /> Asignar a...</Button></DropdownMenuTrigger>
        <DropdownMenuContent>{allMembers.map((m) => <DropdownMenuItem key={m.id} onClick={() => { bulkAssign(ids, m.id); onClear(); }}>{m.name}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><AlertCircle className="h-3 w-3" /> Prioridad</Button></DropdownMenuTrigger>
        <DropdownMenuContent>{priorities.map((p) => <DropdownMenuItem key={p} onClick={() => { bulkPriority(ids, p); onClear(); }} className="capitalize">{p}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { bulkDuplicate(ids); onClear(); toast.success(`${ids.length} tareas duplicadas`); }}><Copy className="h-3 w-3" /> Duplicar</Button>
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => { bulkDelete(ids); onClear(); toast.success(`${ids.length} tareas eliminadas`); }}><Trash2 className="h-3 w-3" /> Eliminar</Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClear}><X className="h-3 w-3 mr-1" /> Deseleccionar</Button>
    </div>
  );
}

// ── CellTooltip ─────────────────────────────────────────────
function CellTooltip({ text, children }: { text: string; children: React.ReactElement }) {
  const triggerRef = useRef<HTMLElement>(null);
  const [truncated, setTruncated] = useState(false);
  const check = useCallback(() => {
    const el = triggerRef.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth + 2);
  }, []);
  return (
    <Tooltip>
      <TooltipTrigger asChild ref={triggerRef as React.Ref<HTMLButtonElement>} onMouseEnter={check}>
        {children}
      </TooltipTrigger>
      {truncated && <TooltipContent side="top" className="max-w-[350px] text-xs break-words">{text}</TooltipContent>}
    </Tooltip>
  );
}

// ── Text colors ─────────────────────────────────────────────
const TEXT_COLORS = [
  { label: "Rojo", value: "#ef4444", dot: "bg-red-500" },
  { label: "Naranja", value: "#f97316", dot: "bg-orange-500" },
  { label: "Verde", value: "#22c55e", dot: "bg-green-500" },
  { label: "Azul", value: "#3b82f6", dot: "bg-blue-500" },
  { label: "Morado", value: "#a855f7", dot: "bg-purple-500" },
  { label: "Gris", value: "#6b7280", dot: "bg-gray-500" },
];

// ── Rich title editor ───────────────────────────────────────
function RichTitleEditor({ html, onSave, onCancel }: { html: string; onSave: (h: string) => void; onCancel: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStates, setActiveStates] = useState({ bold: false, italic: false, strike: false });
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedSelRef = useRef<Range | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (el) { el.innerHTML = html; el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateActive = useCallback(() => {
    setActiveStates({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), strike: document.queryCommandState("strikeThrough") });
  }, []);
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); updateActive(); };
  const handleSave = () => { if (linkInputOpen) return; const c = editorRef.current?.innerHTML ?? ""; const t = editorRef.current?.textContent?.trim() ?? ""; if (t) onSave(c); else onCancel(); };
  const handleLinkClick = (e: React.MouseEvent) => { e.preventDefault(); const s = window.getSelection(); if (s && s.rangeCount > 0) savedSelRef.current = s.getRangeAt(0).cloneRange(); setLinkInputOpen(true); setLinkUrl("https://"); setTimeout(() => linkInputRef.current?.focus(), 0); };
  const applyLink = () => { const url = linkUrl.trim(); if (url && url !== "https://") { const s = window.getSelection(); if (savedSelRef.current && s) { s.removeAllRanges(); s.addRange(savedSelRef.current); } document.execCommand("createLink", false, url); editorRef.current?.querySelectorAll("a").forEach((a) => { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }); } setLinkInputOpen(false); setLinkUrl(""); savedSelRef.current = null; editorRef.current?.focus(); };

  return (
    <div className="rounded-md border border-blue-500 bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        <Button variant="ghost" size="icon" className={cn("h-6 w-6", activeStates.bold && "bg-accent text-accent-foreground")} onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} title="Negrita"><Bold className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className={cn("h-6 w-6", activeStates.italic && "bg-accent text-accent-foreground")} onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} title="Cursiva"><Italic className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className={cn("h-6 w-6", activeStates.strike && "bg-accent text-accent-foreground")} onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }} title="Tachado"><Strikethrough className="h-3 w-3" /></Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={handleLinkClick} title="Enlace"><Link className="h-3 w-3" /></Button>
        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={(e) => e.preventDefault()} title="Color"><Palette className="h-3 w-3" /></Button></PopoverTrigger>
          <PopoverContent className="w-auto p-1.5" align="start" onOpenAutoFocus={(e) => e.preventDefault()}><div className="flex gap-1">{TEXT_COLORS.map((c) => (<button key={c.value} className={cn("h-6 w-6 rounded-full transition-all hover:scale-110", c.dot)} title={c.label} onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c.value); }} />))}</div></PopoverContent>
        </Popover>
      </div>
      {linkInputOpen && (
        <div className="flex items-center gap-1.5 border-b border-border px-1.5 py-1">
          <Link className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <Input ref={linkInputRef} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-6 flex-1 text-xs border-none shadow-none focus-visible:ring-0 px-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") { setLinkInputOpen(false); setLinkUrl(""); savedSelRef.current = null; editorRef.current?.focus(); } }} />
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={applyLink}><Check className="h-3 w-3" /></Button>
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning className="min-h-[32px] max-h-[120px] overflow-y-auto px-2 py-1.5 text-xs outline-none [&_a]:text-blue-500 [&_a]:underline"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === "Escape") onCancel(); }}
        onBlur={handleSave} onSelect={updateActive} onKeyUp={updateActive} onMouseUp={updateActive} />
    </div>
  );
}

// ── Title cell ──────────────────────────────────────────────
function TitleCell({ task, onSave, cellId, flashId }: { task: Task; onSave: (v: string) => void; cellId: string; flashId: string | null }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <RichTitleEditor html={task.title} onSave={(h) => { setEditing(false); if (h !== task.title) onSave(h); }} onCancel={() => setEditing(false)} />;
  return (
    <CellTooltip text={task.title.replace(/<[^>]*>/g, "")}>
      <span onClick={(e) => { e.stopPropagation(); setEditing(true); }} className={cn("block cursor-text truncate rounded px-1.5 py-0.5 text-xs transition-all hover:bg-muted", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")} dangerouslySetInnerHTML={{ __html: task.title }} />
    </CellTooltip>
  );
}

// ── Editable text cell ──────────────────────────────────────
function EditableTextCell({ value, onSave, cellId, flashId }: { value: string; onSave: (v: string) => void; cellId: string; flashId: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.focus(), 0); } }, [editing, value]);
  const save = () => { setEditing(false); if (draft.trim() && draft !== value) onSave(draft.trim()); };
  if (editing) return <Input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} className="h-7 text-xs border-blue-500 focus-visible:ring-blue-500/30" onClick={(e) => e.stopPropagation()} />;
  return (
    <CellTooltip text={value}>
      <span onClick={(e) => { e.stopPropagation(); setEditing(true); }} className={cn("block cursor-text truncate rounded px-1.5 py-0.5 text-xs transition-all hover:bg-muted", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}>
        {value || <span className="text-muted-foreground italic">---</span>}
      </span>
    </CellTooltip>
  );
}

// ── OptionItem ──────────────────────────────────────────────
function OptionItem({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (<button onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-accent", selected && "bg-accent")}><span className="flex-1 text-left">{children}</span>{selected && <Check className="h-3 w-3 text-primary" />}</button>);
}

// ── AddNewInput ─────────────────────────────────────────────
function AddNewInput({ label, onAdd }: { label: string; onAdd: (v: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (adding) setTimeout(() => inputRef.current?.focus(), 0); }, [adding]);
  if (!adding) return <button onClick={() => setAdding(true)} className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-primary hover:bg-accent transition-colors"><Plus className="h-3 w-3" />{label}</button>;
  return (<div className="px-2 py-1" onClick={(e) => e.stopPropagation()}><Input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Nombre..." className="h-7 text-xs" onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); setAdding(false); } if (e.key === "Escape") { setVal(""); setAdding(false); } }} /></div>);
}

// ── Status cell ─────────────────────────────────────────────
function StatusCell({ task, onUpdate, cellId, flashId }: { task: Task; onUpdate: (s: Status) => void; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  const statuses: Status[] = ["por_hacer", "en_proceso", "en_revision", "completado"];
  return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button onClick={(e) => e.stopPropagation()} className={cn("rounded transition-all", flashId === cellId && "ring-2 ring-blue-500/50")}><Badge variant="outline" className={cn("text-[10px] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap", statusColors[task.status])}>{statusLabels[task.status]}</Badge></button></PopoverTrigger><PopoverContent className="w-[170px] p-1" align="start">{statuses.map((s) => (<OptionItem key={s} selected={task.status === s} onClick={() => { onUpdate(s); setOpen(false); }}><span className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", statusDotColors[s])} />{statusLabels[s]}</span></OptionItem>))}</PopoverContent></Popover>);
}

// ── Priority cell ───────────────────────────────────────────
function PriorityCell({ task, onUpdate, cellId, flashId }: { task: Task; onUpdate: (p: Priority) => void; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  const priorities: Priority[] = ["urgente", "alta", "media", "baja"];
  return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button onClick={(e) => e.stopPropagation()} className={cn("rounded transition-all", flashId === cellId && "ring-2 ring-blue-500/50")}><Badge variant="outline" className={cn("text-[10px] capitalize cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap", priorityColors[task.priority])}>{task.priority}</Badge></button></PopoverTrigger><PopoverContent className="w-[150px] p-1" align="start">{priorities.map((p) => (<OptionItem key={p} selected={task.priority === p} onClick={() => { onUpdate(p); setOpen(false); }}><span className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", priorityDotColors[p])} /><span className="capitalize">{p}</span></span></OptionItem>))}</PopoverContent></Popover>);
}

// ── Store cell ──────────────────────────────────────────────
function StoreCell({ task, onUpdate, onAddStore, allStores, cellId, flashId }: { task: Task; onUpdate: (s: string) => void; onAddStore: (s: string) => void; allStores: string[]; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button onClick={(e) => e.stopPropagation()} className={cn("rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-all cursor-pointer truncate max-w-full text-left block w-full", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}>{task.store}</button></PopoverTrigger><PopoverContent className="w-[180px] p-1" align="start"><div className="max-h-[200px] overflow-y-auto">{allStores.map((s) => (<OptionItem key={s} selected={task.store === s} onClick={() => { onUpdate(s); setOpen(false); }}>{s}</OptionItem>))}</div><div className="border-t border-border mt-1 pt-1"><AddNewInput label="+ Agregar tienda" onAdd={(n) => { onAddStore(n); onUpdate(n); setOpen(false); }} /></div></PopoverContent></Popover>);
}

// ── Campaign Type cell ──────────────────────────────────────
function CampaignTypeCell({ task, onUpdate, onAddType, allTypes, cellId, flashId }: { task: Task; onUpdate: (t: string) => void; onAddType: (t: string) => void; allTypes: string[]; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button onClick={(e) => e.stopPropagation()} className={cn("rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-all cursor-pointer truncate max-w-full text-left block w-full", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}>{task.campaignType}</button></PopoverTrigger><PopoverContent className="w-[170px] p-1" align="start"><div className="max-h-[200px] overflow-y-auto">{allTypes.map((ct) => (<OptionItem key={ct} selected={task.campaignType === ct} onClick={() => { onUpdate(ct); setOpen(false); }}>{ct}</OptionItem>))}</div><div className="border-t border-border mt-1 pt-1"><AddNewInput label="+ Agregar tipo" onAdd={(n) => { onAddType(n); onUpdate(n); setOpen(false); }} /></div></PopoverContent></Popover>);
}

// ── Assignee cell ───────────────────────────────────────────
function AssigneeCell({ task, onUpdate, cellId, flashId }: { task: Task; onUpdate: (id: string) => void; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  const customTeamMembers = useBoardStore((s) => s.customTeamMembers);
  const allMembers = useMemo(() => [...TEAM_MEMBERS, ...customTeamMembers], [customTeamMembers]);
  const assignee = allMembers.find((m) => m.id === task.assigneeId);
  return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button onClick={(e) => e.stopPropagation()} className={cn("flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-all cursor-pointer max-w-full overflow-hidden", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}><Avatar className="h-5 w-5 flex-shrink-0"><AvatarFallback className={cn("text-[8px]", assignee?.color ? `${assignee.color} text-white` : "bg-muted")}>{assignee?.avatar ?? "?"}</AvatarFallback></Avatar><span className="text-xs truncate">{assignee?.name}</span></button></PopoverTrigger>
    <PopoverContent className="w-[200px] p-1" align="start">{allMembers.map((m) => (<OptionItem key={m.id} selected={task.assigneeId === m.id} onClick={() => { onUpdate(m.id); setOpen(false); }}><span className="flex items-center gap-2"><Avatar className="h-5 w-5"><AvatarFallback className={cn("text-[8px]", m.color ? `${m.color} text-white` : "bg-muted")}>{m.avatar}</AvatarFallback></Avatar><span className="flex flex-col"><span>{m.name}</span><span className="text-[10px] text-muted-foreground">{m.role}</span></span></span></OptionItem>))}</PopoverContent></Popover>);
}

// ── Date cell ───────────────────────────────────────────────
function DateCell({ task, onUpdate, cellId, flashId }: { task: Task; onUpdate: (d: string) => void; cellId: string; flashId: string | null }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.showPicker?.(), 50); }, [editing]);
  const formatted = new Date(task.dueDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  if (editing) return <Input ref={inputRef} type="date" defaultValue={task.dueDate} onBlur={(e) => { setEditing(false); if (e.target.value && e.target.value !== task.dueDate) onUpdate(e.target.value); }} onChange={(e) => { if (e.target.value && e.target.value !== task.dueDate) { onUpdate(e.target.value); setEditing(false); } }} className="h-7 w-full text-xs border-blue-500 focus-visible:ring-blue-500/30" onClick={(e) => e.stopPropagation()} />;
  return <span onClick={(e) => { e.stopPropagation(); setEditing(true); }} className={cn("cursor-pointer rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-all block truncate", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}>{formatted}</span>;
}

// ── Actions cell ────────────────────────────────────────────
function ActionsCell({ onViewDetail, onDuplicate, onDelete }: { onViewDetail: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (<DropdownMenu><DropdownMenuTrigger asChild><button onClick={(e) => e.stopPropagation()} className="rounded p-1 hover:bg-muted transition-colors"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[150px]"><DropdownMenuItem onClick={onViewDetail}>Ver detalle</DropdownMenuItem><DropdownMenuItem onClick={onDuplicate}>Duplicar</DropdownMenuItem><DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500">Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu>);
}

// ── Custom field sub-cells ──────────────────────────────────
function SelectFieldCell({ col, value, onSave, cellId, flashId }: { col: TableColumnDef; value: string; onSave: (v: string) => void; cellId: string; flashId: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} className={cn("rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-all cursor-pointer truncate max-w-full text-left block w-full", flashId === cellId && "ring-2 ring-blue-500/50 bg-blue-500/10")}>
          {value || <span className="italic">---</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[170px] p-1" align="start">
        {(col.selectOptions ?? []).map((opt) => (
          <OptionItem key={opt} selected={value === opt} onClick={() => { onSave(opt); setOpen(false); }}>{opt}</OptionItem>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function UrlFieldCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.focus(), 0); } }, [editing, value]);
  const save = () => { setEditing(false); if (draft !== value) onSave(draft); };
  if (editing) return <Input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} className="h-7 text-xs border-blue-500 focus-visible:ring-blue-500/30" onClick={(e) => e.stopPropagation()} />;
  if (value) return <a href={value} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }} className="block truncate text-xs text-blue-500 hover:underline px-1.5 py-0.5">{value}</a>;
  return <span onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="block cursor-text truncate px-1.5 py-0.5 text-xs text-muted-foreground italic hover:bg-muted rounded">---</span>;
}

// ── Custom field cell (dispatcher) ──────────────────────────
function CustomFieldCell({ col, task, onSave, cellId, flashId }: { col: TableColumnDef; task: Task; onSave: (v: string) => void; cellId: string; flashId: string | null }) {
  const value = task.customFields?.[col.id] ?? "";

  if (col.customType === "checkbox") {
    return (
      <label className="flex items-center justify-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={value === "true"} onChange={(e) => onSave(e.target.checked ? "true" : "false")} className="h-4 w-4 rounded border-border accent-primary" />
      </label>
    );
  }

  if (col.customType === "select") return <SelectFieldCell col={col} value={value} onSave={onSave} cellId={cellId} flashId={flashId} />;
  if (col.customType === "url") return <UrlFieldCell value={value} onSave={onSave} />;

  // text, number, date fallback
  return <EditableTextCell value={value} onSave={onSave} cellId={cellId} flashId={flashId} />;
}

// ── Insert column dialog ────────────────────────────────────
function InsertColumnDialog({ onInsert, onClose }: { onInsert: (label: string, type: CustomColumnType, opts?: string[]) => void; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomColumnType>("text");
  const [opts, setOpts] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 0); }, []);

  const typeLabels: Record<CustomColumnType, string> = { text: "Texto", number: "Número", select: "Selección", date: "Fecha", url: "URL", checkbox: "Checkbox" };

  return (
    <div className="space-y-3 p-1" onClick={(e) => e.stopPropagation()}>
      <Input ref={inputRef} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nombre de columna..." className="h-8 text-xs" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} />
      <div className="flex flex-wrap gap-1">
        {(Object.keys(typeLabels) as CustomColumnType[]).map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn("rounded-md px-2 py-1 text-[10px] border transition-colors", type === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
            {typeLabels[t]}
          </button>
        ))}
      </div>
      {type === "select" && (
        <Input value={opts} onChange={(e) => setOpts(e.target.value)} placeholder="Opciones separadas por coma..." className="h-7 text-xs" />
      )}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" disabled={!label.trim()} onClick={() => { onInsert(label.trim(), type, type === "select" ? opts.split(",").map((o) => o.trim()).filter(Boolean) : undefined); onClose(); }}>
          <Check className="mr-1 h-3 w-3" /> Crear
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}

// ── Column filter popover ───────────────────────────────────
function ColumnFilterContent({ tasks, col, allMembers, activeFilter, onApply, onClear }: {
  tasks: Task[]; col: TableColumnDef;
  allMembers: { id: string; name: string }[];
  activeFilter: string[] | undefined;
  onApply: (values: string[]) => void; onClear: () => void;
}) {
  const uniqueValues = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      const v = getCellValue(t, col, allMembers);
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [tasks, col, allMembers]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(activeFilter ?? []));

  const toggle = (v: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  };

  useEffect(() => {
    if (selected.size === 0) onClear();
    else onApply(Array.from(selected));
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-muted-foreground">Filtrar valores</span>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="text-[10px] text-primary hover:underline">Limpiar</button>
        )}
      </div>
      <ScrollArea className="max-h-[180px]">
        <div className="space-y-0.5">
          {uniqueValues.map((v) => (
            <label key={v} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent cursor-pointer">
              <input type="checkbox" checked={selected.has(v)} onChange={() => toggle(v)} className="h-3.5 w-3.5 rounded border-border accent-primary" />
              <span className="truncate">{v}</span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Column header menu ──────────────────────────────────────
function ColumnHeaderMenu({
  col, sortKey, sortDir, tasks, allMembers,
  onSort, onRenameStart,
}: {
  col: TableColumnDef;
  sortKey: string; sortDir: SortDir;
  tasks: Task[];
  allMembers: { id: string; name: string }[];
  onSort: (key: string, dir: SortDir) => void;
  onRenameStart: () => void;
}) {
  const { toggleVisibility, togglePin, addCustomColumn, removeCustomColumn, columnFilters, setColumnFilter, clearColumnFilter } = useTableColumnsStore();
  const pinnedCount = useTableColumnsStore((s) => { let n = 0; for (const c of s.columns) if (c.pinned) n++; return n; });
  const isPinned = col.pinned;
  const canPin = isPinned || pinnedCount < 2;
  const hasFilter = (columnFilters[col.id]?.length ?? 0) > 0;

  const [filterOpen, setFilterOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState<"left" | "right" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover/th:opacity-100 transition-opacity rounded p-0.5 hover:bg-muted ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {/* Rename */}
          <DropdownMenuItem onClick={onRenameStart}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Renombrar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sort */}
          <DropdownMenuItem onClick={() => onSort(col.key, "asc")} className={cn(sortKey === col.key && sortDir === "asc" && "bg-accent")}>
            <ArrowUp className="mr-2 h-3.5 w-3.5" /> Ordenar A → Z
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort(col.key, "desc")} className={cn(sortKey === col.key && sortDir === "desc" && "bg-accent")}>
            <ArrowDown className="mr-2 h-3.5 w-3.5" /> Ordenar Z → A
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Filter */}
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setFilterOpen(true); }}>
            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar por valores
            {hasFilter && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Pin */}
          <DropdownMenuItem onClick={() => togglePin(col.id)} disabled={!canPin && !isPinned}>
            {isPinned ? <PinOff className="mr-2 h-3.5 w-3.5" /> : <Pin className="mr-2 h-3.5 w-3.5" />}
            {isPinned ? "Desfijar columna" : "Fijar a la izquierda"}
          </DropdownMenuItem>

          {/* Hide */}
          <DropdownMenuItem onClick={() => toggleVisibility(col.id)}>
            <EyeOff className="mr-2 h-3.5 w-3.5" /> Ocultar columna
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Insert */}
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setInsertOpen("left"); }}>
            <ArrowLeftToLine className="mr-2 h-3.5 w-3.5" /> Insertar columna izq.
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setInsertOpen("right"); }}>
            <ArrowRightToLine className="mr-2 h-3.5 w-3.5" /> Insertar columna der.
          </DropdownMenuItem>

          {/* Delete (custom only) */}
          {!col.builtIn && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => removeCustomColumn(col.id)} className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar columna
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter popover */}
      {filterOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[220px] rounded-md border border-border bg-popover p-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Filtro: {col.label}</span>
            <button onClick={() => setFilterOpen(false)} className="rounded p-0.5 hover:bg-muted"><X className="h-3 w-3" /></button>
          </div>
          <ColumnFilterContent tasks={tasks} col={col} allMembers={allMembers} activeFilter={columnFilters[col.id]} onApply={(v) => setColumnFilter(col.id, v)} onClear={() => clearColumnFilter(col.id)} />
        </div>
      )}

      {/* Insert column dialog */}
      {insertOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[260px] rounded-md border border-border bg-popover p-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Nueva columna ({insertOpen === "left" ? "izquierda" : "derecha"})</span>
            <button onClick={() => setInsertOpen(null)} className="rounded p-0.5 hover:bg-muted"><X className="h-3 w-3" /></button>
          </div>
          <InsertColumnDialog
            onInsert={(label, type, opts) => addCustomColumn(col.id, insertOpen, type, label, opts)}
            onClose={() => setInsertOpen(null)}
          />
        </div>
      )}
    </>
  );
}

// ── Columns visibility popover ──────────────────────────────
function ColumnsVisibilityPopover() {
  const columns = useTableColumnsStore((s) => s.columns);
  const { toggleVisibility } = useTableColumnsStore();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Columns3 className="h-3.5 w-3.5" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="end">
        <p className="text-xs font-medium mb-2">Columnas visibles</p>
        <div className="space-y-0.5">
          {columns.map((col) => (
            <label key={col.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => toggleVisibility(col.id)}
                disabled={col.id === "title"}
                className="h-3.5 w-3.5 rounded border-border accent-primary disabled:opacity-40"
              />
              <span className={cn("truncate", !col.visible && "text-muted-foreground")}>{col.label}</span>
              {col.pinned && <Pin className="h-3 w-3 text-muted-foreground ml-auto" />}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Sortable Row wrapper ────────────────────────────────────
function SortableRow({ id, children }: { id: string; children: (props: { handleProps: Record<string, unknown>; isDragging: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <tr ref={setNodeRef} style={style} className={cn("group border-b border-border last:border-b-0 transition-colors", isDragging ? "bg-primary/10 border-primary shadow-lg opacity-80" : "hover:bg-muted/30")}>
      {children({ handleProps: { ...attributes, ...listeners }, isDragging })}
    </tr>
  );
}

// ── Main TableView ──────────────────────────────────────────
export function TableView() {
  const {
    getFilteredTasks, setSelectedTask, updateTaskWithActivity, updateTask,
    addCustomStore, addCustomCampaignType, duplicateTask, deleteTask,
    getAllStores, getAllCampaignTypes, getAllTeamMembers, addQuickTask,
    boards, activeBoardId, getAllViews, activeViewId, setActiveViewId,
    reorderBoardTasks,
  } = useBoardStore();

  const columns = useTableColumnsStore((s) => s.columns);
  const columnFilters = useTableColumnsStore((s) => s.columnFilters);
  const { getVisibleColumns, setColumnWidth } = useTableColumnsStore();

  const [sortKey, setSortKey] = useState<string>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [renamingColId, setRenamingColId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { flashId, flash } = useFlash();
  const dragStartWidth = useRef(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskActive, setQuickTaskActive] = useState(false);
  const quickTaskRef = useRef<HTMLInputElement>(null);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // DnD sensors
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const globalFiltered = getFilteredTasks();
  const boardName = boards.find((b) => b.id === activeBoardId)?.name ?? "Board";
  const allViews = getAllViews();
  const allMembers = getAllTeamMembers();
  const allStores = getAllStores();
  const allCampaignTypes = getAllCampaignTypes();

  const visibleCols = getVisibleColumns();
  const pinnedIds = useMemo(() => new Set(columns.filter((c) => c.pinned).map((c) => c.id)), [columns]);

  // Apply per-column filters
  const filtered = useMemo(() => {
    let result = globalFiltered;
    for (const [colId, values] of Object.entries(columnFilters)) {
      if (!values || values.length === 0) continue;
      const valSet = new Set(values);
      const col = columns.find((c) => c.id === colId);
      if (!col) continue;
      result = result.filter((t) => {
        const cv = getCellValue(t, col, allMembers);
        return valSet.has(cv);
      });
    }
    return result;
  }, [globalFiltered, columnFilters, columns, allMembers]);

  const sorted = sortTasks(filtered, sortKey, sortDir, allMembers);

  const handleSort = (key: string, dir: SortDir) => { setSortKey(key); setSortDir(dir); };

  const startResizeCb = useCallback((colId: string, startX: number) => {
    const col = columns.find((c) => c.id === colId);
    dragStartWidth.current = col?.width ?? 120;
    const onMove = (e: MouseEvent) => {
      const w = Math.min(500, Math.max(80, dragStartWidth.current + e.clientX - startX));
      setColumnWidth(colId, w);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [columns, setColumnWidth]);
  const startResizeRef = useRef(startResizeCb);
  startResizeRef.current = startResizeCb;

  const handleFieldUpdate = (taskId: string, field: string, value: string, cellKey: string) => { updateTaskWithActivity(taskId, { [field]: value }); flash(`${taskId}-${cellKey}`); };
  const handleTextUpdate = (taskId: string, field: string, value: string, cellKey: string) => { updateTask(taskId, { [field]: value }); flash(`${taskId}-${cellKey}`); };
  const handleCustomFieldUpdate = (taskId: string, colId: string, value: string) => {
    const task = globalFiltered.find((t) => t.id === taskId) ?? filtered.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { customFields: { ...(task.customFields ?? {}), [colId]: value } });
    flash(`${taskId}-${colId}`);
  };

  useEffect(() => {
    if (renamingColId) setTimeout(() => { renameInputRef.current?.focus(); renameInputRef.current?.select(); }, 0);
  }, [renamingColId]);

  const saveRename = () => {
    if (renamingColId && renameVal.trim()) {
      useTableColumnsStore.getState().renameColumn(renamingColId, renameVal.trim());
    }
    setRenamingColId(null);
  };

  // Compute pinned offsets for sticky
  const pinnedOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let acc = 0;
    for (const c of visibleCols) {
      if (c.pinned) { offsets[c.id] = acc; acc += c.width; }
    }
    return offsets;
  }, [visibleCols]);

  const totalWidth = visibleCols.reduce((s, c) => s + c.width, 0) + 114; // +24 drag + 40 checkbox + 50 actions

  const hasAnyColumnFilter = Object.values(columnFilters).some((v) => v && v.length > 0);
  const allSelected = sorted.length > 0 && sorted.every((t) => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => { if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(sorted.map((t) => t.id))); };
  const clearSelection = () => setSelectedIds(new Set());

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Reorder based on what the user sees (sorted list)
    const currentIds = sorted.map((t) => t.id);
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(currentIds, oldIndex, newIndex);
    // Rebuild full board taskIds: reordered visible tasks + non-visible tasks at end
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;
    const visibleSet = new Set(currentIds);
    const nonVisible = board.taskIds.filter((id) => !visibleSet.has(id));
    reorderBoardTasks([...reordered, ...nonVisible]);
  }, [sorted, boards, activeBoardId, reorderBoardTasks]);

  const sortedIds = useMemo(() => sorted.map((t) => t.id), [sorted]);

  // ── Render built-in cell ─────────────────────────────────
  function renderBuiltInCell(col: TableColumnDef, task: Task) {
    const cid = `${task.id}-${col.key}`;
    switch (col.key) {
      case "title": return <TitleCell task={task} onSave={(v) => handleTextUpdate(task.id, "title", v, "title")} cellId={cid} flashId={flashId} />;
      case "status": return <StatusCell task={task} onUpdate={(s) => handleFieldUpdate(task.id, "status", s, "status")} cellId={cid} flashId={flashId} />;
      case "store": return <StoreCell task={task} onUpdate={(s) => handleFieldUpdate(task.id, "store", s, "store")} onAddStore={addCustomStore} allStores={allStores} cellId={cid} flashId={flashId} />;
      case "adAccount": return <EditableTextCell value={task.adAccount} onSave={(v) => handleFieldUpdate(task.id, "adAccount", v, "adAccount")} cellId={cid} flashId={flashId} />;
      case "campaignType": return <CampaignTypeCell task={task} onUpdate={(t) => handleFieldUpdate(task.id, "campaignType", t, "campaignType")} onAddType={addCustomCampaignType} allTypes={allCampaignTypes} cellId={cid} flashId={flashId} />;
      case "priority": return <PriorityCell task={task} onUpdate={(p) => handleFieldUpdate(task.id, "priority", p, "priority")} cellId={cid} flashId={flashId} />;
      case "assigneeId": return <AssigneeCell task={task} onUpdate={(id) => handleFieldUpdate(task.id, "assigneeId", id, "assigneeId")} cellId={cid} flashId={flashId} />;
      case "dueDate": return <DateCell task={task} onUpdate={(d) => handleFieldUpdate(task.id, "dueDate", d, "dueDate")} cellId={cid} flashId={flashId} />;
      default: return <span className="text-xs text-muted-foreground">—</span>;
    }
  }

  return (
    <>
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-1 flex-col overflow-auto p-6">
        {/* Saved Views Tabs */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {allViews.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                activeViewId === view.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ViewIcon icon={view.icon} />
              {view.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {hasAnyColumnFilter && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => useTableColumnsStore.getState().clearAllColumnFilters()}>
                <X className="h-3 w-3" /> Limpiar filtros de columna
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Group by */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={groupBy ? "secondary" : "outline"} size="sm" className="h-8 gap-1.5 text-xs">
                  <Layers className="h-3.5 w-3.5" /> Agrupar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={() => setGroupBy(null)} className={cn(!groupBy && "bg-accent")}>Sin agrupar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setGroupBy("status")} className={cn(groupBy === "status" && "bg-accent")}>Por estado</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("store")} className={cn(groupBy === "store" && "bg-accent")}>Por tienda</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("priority")} className={cn(groupBy === "priority" && "bg-accent")}>Por prioridad</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("assigneeId")} className={cn(groupBy === "assigneeId" && "bg-accent")}>Por responsable</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("campaignType")} className={cn(groupBy === "campaignType" && "bg-accent")}>Por tipo de campaña</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Import */}
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCsvImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> Importar
            </Button>
            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { exportCSV(sorted, boardName, allMembers); toast.success("CSV descargado"); }}>Exportar a CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportJSON(sorted, boardName); toast.success("JSON descargado"); }}>Exportar a JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ColumnsVisibilityPopover />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {someSelected && <BulkActionsBar selectedIds={selectedIds} onClear={clearSelection} />}

        {/* Table */}
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed", minWidth: `${totalWidth}px` }}>
            <colgroup>
              <col style={{ width: "24px" }} />
              <col style={{ width: "40px" }} />
              {visibleCols.map((col) => <col key={col.id} style={{ width: `${col.width}px` }} />)}
              <col style={{ width: "50px" }} />
            </colgroup>

            <thead>
              <tr className="border-b border-border bg-muted/30">
                {/* Drag handle header */}
                <th className="w-[24px]" />
                {/* Checkbox header */}
                <th className="w-[40px] px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer" />
                </th>
                {visibleCols.map((col) => {
                  const isPinned = pinnedIds.has(col.id);
                  const hasFilter = (columnFilters[col.id]?.length ?? 0) > 0;
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        "relative px-4 py-2.5 text-left select-none group/th",
                        isPinned && "sticky z-20 bg-muted/80 backdrop-blur-sm border-r border-border/50"
                      )}
                      style={isPinned ? { left: `${(pinnedOffsets[col.id] ?? 0) + 64}px` } : undefined}
                    >
                      {renamingColId === col.id ? (
                        <Input
                          ref={renameInputRef}
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onBlur={saveRename}
                          onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenamingColId(null); }}
                          className="h-6 text-xs font-semibold px-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort(col.key, sortKey === col.key && sortDir === "asc" ? "desc" : "asc")}
                            className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-w-0 flex-1"
                          >
                            {isPinned && <Pin className="h-3 w-3 mr-1 text-primary flex-shrink-0" />}
                            <span className="truncate">{col.label}</span>
                            {hasFilter && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                            {sortKey === col.key ? (
                              sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3 flex-shrink-0" /> : <ArrowDown className="ml-1 h-3 w-3 flex-shrink-0" />
                            ) : (
                              <ArrowUpDown className="ml-1 h-3 w-3 opacity-0 group-hover/th:opacity-40 flex-shrink-0" />
                            )}
                          </button>
                          <ColumnHeaderMenu
                            col={col}
                            sortKey={sortKey}
                            sortDir={sortDir}
                            tasks={filtered}
                            allMembers={allMembers}
                            onSort={handleSort}
                            onRenameStart={() => { setRenamingColId(col.id); setRenameVal(col.label); }}
                          />
                        </div>
                      )}
                      {/* Resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-30 group/rh"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResizeRef.current(col.id, e.clientX); }}
                      >
                        <div className="absolute right-[2px] top-1 bottom-1 w-[2px] rounded-full bg-transparent group-hover/rh:bg-blue-500/50 transition-colors" />
                      </div>
                    </th>
                  );
                })}
                <th className="w-[50px] px-2" />
              </tr>
            </thead>

            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={visibleCols.length + 3} className="px-4 py-8 text-center text-sm text-muted-foreground">No hay tareas que coincidan con los filtros</td></tr>
              ) : (() => {
                // Grouping logic
                if (groupBy) {
                  const groups: Record<string, Task[]> = {};
                  for (const t of sorted) {
                    let key = (t as unknown as Record<string, unknown>)[groupBy] as string ?? "Sin valor";
                    if (groupBy === "assigneeId") { const m = allMembers.find((mm) => mm.id === key); key = m?.name ?? key; }
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(t);
                  }
                  return Object.entries(groups).map(([groupName, groupTasks]) => {
                    const isCollapsed = collapsedGroups.has(groupName);
                    return (
                      <Fragment key={groupName}>
                        <tr className="bg-muted/50">
                          <td colSpan={visibleCols.length + 3} className="px-3 py-2">
                            <button onClick={() => setCollapsedGroups((prev) => { const n = new Set(prev); if (n.has(groupName)) n.delete(groupName); else n.add(groupName); return n; })} className="flex items-center gap-2 text-xs font-semibold">
                              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {groupName} <span className="text-muted-foreground font-normal">({groupTasks.length} tareas)</span>
                            </button>
                          </td>
                        </tr>
                        {!isCollapsed && groupTasks.map((task) => (
                          <tr key={task.id} className="group border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setSelectedTask(task.id)}>
                            <td className="w-[24px] py-2 pl-1" />
                            <td className="px-3 py-2 w-[40px]"><input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer" onClick={(e) => e.stopPropagation()} /></td>
                            {visibleCols.map((col) => (
                              <td key={col.id} className="px-4 py-2 overflow-hidden">
                                {col.builtIn ? renderBuiltInCell(col, task) : <CustomFieldCell col={col} task={task} onSave={(v) => handleCustomFieldUpdate(task.id, col.id, v)} cellId={`${task.id}-${col.id}`} flashId={flashId} />}
                              </td>
                            ))}
                            <td className="px-2 py-2"><div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ActionsCell onViewDetail={() => setSelectedTask(task.id)} onDuplicate={() => { duplicateTask(task.id); toast.success("Tarea duplicada"); }} onDelete={() => { deleteTask(task.id); toast.success("Tarea movida a papelera"); }} /></div></td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  });
                }
                return sorted.map((task) => {
                  const dateBadge = getDateBadge(task.dueDate, task.status);
                  return (
                    <SortableRow key={task.id} id={task.id}>
                      {({ handleProps, isDragging }) => (
                        <>
                          {/* Drag handle */}
                          <td className="w-[24px] py-2 pl-1">
                            <div
                              {...handleProps}
                              className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded p-0.5",
                                isDragging ? "cursor-grabbing opacity-100" : "cursor-grab hover:bg-muted"
                              )}
                            >
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </td>
                          {/* Checkbox */}
                          <td className="px-3 py-2 w-[40px]">
                            <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer" onClick={(e) => e.stopPropagation()} />
                          </td>
                          {visibleCols.map((col) => {
                            const isPinned = pinnedIds.has(col.id);
                            return (
                              <td
                                key={col.id}
                                className={cn(
                                  "px-4 py-2 overflow-hidden",
                                  isPinned && "sticky z-10 bg-card border-r border-border/50"
                                )}
                                style={isPinned ? { left: `${(pinnedOffsets[col.id] ?? 0) + 64}px` } : undefined}
                              >
                                {col.builtIn && col.key === "title" ? (
                                  <div className="flex items-center gap-1 relative">
                                    <div className="flex-1 min-w-0">
                                      {renderBuiltInCell(col, task)}
                                    </div>
                                    <SubtaskIndicator task={task} />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-medium shadow-sm hover:bg-primary/90 flex-shrink-0"
                                    >
                                      <Expand className="h-3 w-3" /> ABRIR
                                    </button>
                                  </div>
                                ) : col.builtIn && col.key === "dueDate" ? (
                                  <div className="flex items-center gap-1.5">
                                    {renderBuiltInCell(col, task)}
                                    {dateBadge && <Badge variant="outline" className={cn("text-[9px] px-1 py-0 whitespace-nowrap", dateBadge.className)}>{dateBadge.label}</Badge>}
                                  </div>
                                ) : col.builtIn ? (
                                  renderBuiltInCell(col, task)
                                ) : (
                                  <CustomFieldCell col={col} task={task} onSave={(v) => handleCustomFieldUpdate(task.id, col.id, v)} cellId={`${task.id}-${col.id}`} flashId={flashId} />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-2">
                            <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ActionsCell onViewDetail={() => setSelectedTask(task.id)} onDuplicate={() => { duplicateTask(task.id); toast.success("Tarea duplicada"); }} onDelete={() => { deleteTask(task.id); toast.success("Tarea movida a papelera"); }} />
                            </div>
                          </td>
                        </>
                      )}
                    </SortableRow>
                  );
                });
              })()}

              {/* Quick Task Row */}
              <tr className="border-t border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                <td className="w-[24px]" />
                <td className="px-3 py-2" />
                <td colSpan={visibleCols.length} className="px-4 py-2">
                  {quickTaskActive ? (
                    <Input
                      ref={quickTaskRef}
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder="Escribe el título de la tarea..."
                      className="h-7 text-xs border-blue-500 focus-visible:ring-blue-500/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && quickTaskTitle.trim()) {
                          addQuickTask(quickTaskTitle.trim());
                          setQuickTaskTitle("");
                          toast.success("Tarea creada");
                        }
                        if (e.key === "Escape") { setQuickTaskActive(false); setQuickTaskTitle(""); }
                      }}
                      onBlur={() => {
                        if (quickTaskTitle.trim()) { addQuickTask(quickTaskTitle.trim()); setQuickTaskTitle(""); }
                        setQuickTaskActive(false);
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => { setQuickTaskActive(true); setTimeout(() => quickTaskRef.current?.focus(), 0); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Crear tarea
                    </button>
                  )}
                </td>
                <td />
              </tr>
            </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      </div>
    </TooltipProvider>
    <CsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} allMembers={allMembers} />
    </>
  );
}
