"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  GripVertical, Plus, ChevronRight, ChevronDown, Check,
  Type, Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  CheckSquare, ToggleLeft, Quote, AlertCircle, Minus, Code,
  Image as ImageIcon, Video, FileUp, Link2, Table,
  Bold, Italic, Underline, Strikethrough, Code2, Palette, Highlighter, LinkIcon,
  Columns2, AtSign, Calendar, LayoutGrid,
  X, Copy, Hash, Maximize2, Minimize2, Search, ArrowUp, ArrowDown,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSidebarStore, type Block, type BlockType } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);

// ── Slash command definitions ───────────────────────────────
interface SlashCmd { id: BlockType; icon: React.ReactNode; label: string; desc: string; group: string; shortcut?: string }
const SLASH_CMDS: SlashCmd[] = [
  { id: "text", icon: <Type className="h-4 w-4" />, label: "Texto", desc: "Párrafo normal", group: "Bloques básicos" },
  { id: "h1", icon: <Heading1 className="h-4 w-4" />, label: "Encabezado 1", desc: "Título grande", group: "Bloques básicos", shortcut: "#" },
  { id: "h2", icon: <Heading2 className="h-4 w-4" />, label: "Encabezado 2", desc: "Título mediano", group: "Bloques básicos", shortcut: "##" },
  { id: "h3", icon: <Heading3 className="h-4 w-4" />, label: "Encabezado 3", desc: "Título pequeño", group: "Bloques básicos", shortcut: "###" },
  { id: "h4", icon: <Heading4 className="h-4 w-4" />, label: "Encabezado 4", desc: "Subtítulo", group: "Bloques básicos", shortcut: "####" },
  { id: "bullet-list", icon: <List className="h-4 w-4" />, label: "Lista con viñetas", desc: "Lista simple", group: "Bloques básicos", shortcut: "-" },
  { id: "numbered-list", icon: <ListOrdered className="h-4 w-4" />, label: "Lista numerada", desc: "Lista con números", group: "Bloques básicos", shortcut: "1." },
  { id: "todo", icon: <CheckSquare className="h-4 w-4" />, label: "Lista de tareas", desc: "Checkbox + texto", group: "Bloques básicos", shortcut: "[]" },
  { id: "toggle", icon: <ToggleLeft className="h-4 w-4" />, label: "Desplegable", desc: "Contenido colapsable", group: "Bloques básicos", shortcut: ">" },
  { id: "quote", icon: <Quote className="h-4 w-4" />, label: "Cita", desc: "Texto citado", group: "Avanzados", shortcut: '"' },
  { id: "callout", icon: <AlertCircle className="h-4 w-4" />, label: "Destacado", desc: "Bloque con emoji + color", group: "Avanzados" },
  { id: "divider", icon: <Minus className="h-4 w-4" />, label: "Divisor", desc: "Línea horizontal", group: "Avanzados", shortcut: "---" },
  { id: "code", icon: <Code className="h-4 w-4" />, label: "Código", desc: "Bloque de código", group: "Avanzados", shortcut: "```" },
  { id: "table", icon: <Table className="h-4 w-4" />, label: "Tabla", desc: "Tabla editable", group: "Avanzados" },
  { id: "page-link", icon: <LinkIcon className="h-4 w-4" />, label: "Enlace a página", desc: "Link a otra página", group: "Avanzados" },
  { id: "toc" as BlockType, icon: <Hash className="h-4 w-4" />, label: "Tabla de contenido", desc: "Índice automático", group: "Avanzados" },
  { id: "image", icon: <ImageIcon className="h-4 w-4" />, label: "Imagen", desc: "Subir o pegar URL", group: "Multimedia" },
  { id: "video", icon: <Video className="h-4 w-4" />, label: "Video", desc: "Subir o embed", group: "Multimedia" },
  { id: "file", icon: <FileUp className="h-4 w-4" />, label: "Archivo", desc: "Adjuntar archivo", group: "Multimedia" },
  { id: "bookmark", icon: <Link2 className="h-4 w-4" />, label: "Enlace web", desc: "Link con preview", group: "Multimedia" },
  { id: "columns", icon: <Columns2 className="h-4 w-4" />, label: "2 Columnas", desc: "Dividir en 2 columnas", group: "Columnas" },
  { id: "mention", icon: <AtSign className="h-4 w-4" />, label: "Mención", desc: "Mencionar miembro", group: "Elementos" },
  { id: "date", icon: <Calendar className="h-4 w-4" />, label: "Fecha", desc: "Insertar fecha", group: "Elementos" },
  { id: "database-table", icon: <LayoutGrid className="h-4 w-4" />, label: "Vista de tabla", desc: "Tabla de base de datos", group: "Base de datos" },
  { id: "database-board", icon: <LayoutGrid className="h-4 w-4" />, label: "Vista de tablero", desc: "Kanban inline", group: "Base de datos" },
  { id: "database-list", icon: <List className="h-4 w-4" />, label: "Vista de lista", desc: "Lista de tareas", group: "Base de datos" },
  { id: "database-gallery", icon: <LayoutGrid className="h-4 w-4" />, label: "Vista de galería", desc: "Grid de cards", group: "Base de datos" },
  { id: "database-calendar", icon: <Calendar className="h-4 w-4" />, label: "Vista de calendario", desc: "Calendario mensual", group: "Base de datos" },
];

const CALLOUT_COLORS = ["blue", "green", "yellow", "red", "purple", "gray"];
const EMOJIS_SMALL = ["📄", "📋", "📊", "💡", "🎯", "🚀", "📝", "📌", "🔥", "⭐", "💬", "📣", "🎬", "🎨", "📦", "🔗", "📅", "✅", "❌", "⚡"];

function newBlock(type: BlockType = "text", content = ""): Block {
  return { id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, content,
    ...(type === "todo" ? { checked: false } : {}),
    ...(type === "toggle" ? { expanded: true, toggleContent: "", children: [{ id: `blk_${Date.now()}_c`, type: "text" as BlockType, content: "" }] } : {}),
    ...(type === "callout" ? { emoji: "💡", color: "blue" } : {}),
    ...(type === "code" ? { language: "javascript" } : {}),
    ...(type === "table" ? { tableData: [["", "", ""], ["", "", ""], ["", "", ""]] } : {}),
    ...(type === "columns" ? { columnContents: ["", ""] } : {}),
    ...(type === "date" ? { content: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) } : {}),
    ...(type === "mention" ? { content: content || "" } : {}),
  };
}

// ── Slash Menu ──────────────────────────────────────────────
function SlashMenu({ filter, pos, onSelect, onClose }: { filter: string; pos: { top: number; left: number }; onSelect: (type: BlockType) => void; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const q = filter.toLowerCase();
  const filtered = SLASH_CMDS.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q));
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setIdx(0); }, [filter]);

  // scrollIntoView when idx changes
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest" }); }, [idx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); onSelect(filtered[idx].id); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", h, true);
    return () => document.removeEventListener("keydown", h, true);
  }, [idx, filtered, onSelect, onClose]);

  if (filtered.length === 0) return null;
  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  return (
    <div className="fixed z-[100] w-[300px] rounded-lg border border-border bg-popover shadow-xl" style={{ top: pos.top, left: pos.left }}>
      <div className="max-h-[350px] overflow-y-auto overscroll-contain p-1" style={{ scrollbarWidth: "thin" }}>
        {groups.map((g) => (
          <div key={g}>
            <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover z-10">{g}</p>
            {filtered.filter((c) => c.group === g).map((cmd) => {
              const i = filtered.indexOf(cmd);
              return (
                <button ref={i === idx ? activeRef : undefined} key={cmd.id} className={cn("flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-xs transition-colors", i === idx ? "bg-accent" : "hover:bg-accent/50")} onClick={() => onSelect(cmd.id)} onMouseEnter={() => setIdx(i)}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted flex-shrink-0">{cmd.icon}</span>
                  <div className="text-left flex-1 min-w-0"><p className="font-medium">{cmd.label}</p><p className="text-[10px] text-muted-foreground">{cmd.desc}</p></div>
                  {cmd.shortcut && <code className="text-[10px] text-muted-foreground/70 font-mono bg-muted rounded px-1.5 py-0.5 flex-shrink-0">{cmd.shortcut}</code>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Floating Toolbar (appears on text selection) ────────────
function FloatingToolbar() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false, strike: false });

  useEffect(() => {
    const check = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setPos(null); return; }
      // Only show toolbar when selection is inside a block editor contentEditable
      const anchor = sel.anchorNode;
      const editorContainer = anchor instanceof HTMLElement ? anchor.closest("[data-block-id]") : anchor?.parentElement?.closest("[data-block-id]");
      if (!editorContainer) { setPos(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width < 2) { setPos(null); return; }
      setPos({ top: rect.top - 44, left: rect.left + rect.width / 2 - 160 });
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
      });
    };
    document.addEventListener("selectionchange", check);
    return () => document.removeEventListener("selectionchange", check);
  }, []);

  if (!pos) return null;

  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); };

  const TEXT_COLORS_TB = [
    { label: "Negro", value: "#000000" }, { label: "Gris", value: "#6b7280" },
    { label: "Rojo", value: "#ef4444" }, { label: "Naranja", value: "#f97316" },
    { label: "Verde", value: "#22c55e" }, { label: "Azul", value: "#3b82f6" },
    { label: "Morado", value: "#a855f7" }, { label: "Rosa", value: "#ec4899" },
  ];

  const BG_COLORS_TB = [
    { label: "Ninguno", value: "transparent" },
    { label: "Amarillo", value: "#fef9c3" }, { label: "Verde", value: "#dcfce7" },
    { label: "Azul", value: "#dbeafe" }, { label: "Rosa", value: "#fce7f3" },
    { label: "Morado", value: "#f3e8ff" }, { label: "Gris", value: "#f3f4f6" },
  ];

  const btn = (active: boolean, title: string, onClick: () => void, children: React.ReactNode) => (
    <button
      key={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors", active && "bg-accent text-accent-foreground")}
      title={title}
    >{children}</button>
  );

  return (
    <div className="fixed z-[200] flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1 py-0.5 shadow-xl" style={{ top: Math.max(4, pos.top), left: Math.max(4, pos.left) }}>
      {btn(active.bold, "Negrita", () => exec("bold"), <Bold className="h-3.5 w-3.5" />)}
      {btn(active.italic, "Cursiva", () => exec("italic"), <Italic className="h-3.5 w-3.5" />)}
      {btn(active.underline, "Subrayado", () => exec("underline"), <Underline className="h-3.5 w-3.5" />)}
      {btn(active.strike, "Tachado", () => exec("strikeThrough"), <Strikethrough className="h-3.5 w-3.5" />)}
      {btn(false, "Código", () => { const sel = window.getSelection(); if (sel && !sel.isCollapsed) { exec("insertHTML", `<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">${sel.toString()}</code>`); } }, <Code2 className="h-3.5 w-3.5" />)}
      <div className="w-px h-5 bg-border mx-0.5" />
      {btn(false, "Link", () => { const url = prompt("URL:"); if (url) exec("createLink", url); }, <LinkIcon className="h-3.5 w-3.5" />)}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{btn(false, "Color texto", () => {}, <Palette className="h-3.5 w-3.5" />)}</DropdownMenuTrigger>
        <DropdownMenuContent className="p-1"><div className="grid grid-cols-4 gap-1">{TEXT_COLORS_TB.map((c) => (
          <button key={c.value} onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c.value); }} className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: c.value }} title={c.label} />
        ))}</div></DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{btn(false, "Resaltado", () => {}, <Highlighter className="h-3.5 w-3.5" />)}</DropdownMenuTrigger>
        <DropdownMenuContent className="p-1"><div className="grid grid-cols-4 gap-1">{BG_COLORS_TB.map((c) => (
          <button key={c.value} onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", c.value); }} className="h-6 w-6 rounded border border-border" style={{ backgroundColor: c.value === "transparent" ? undefined : c.value }} title={c.label}>{c.value === "transparent" ? <X className="h-3 w-3 text-muted-foreground mx-auto" /> : null}</button>
        ))}</div></DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Block Editor Component ──────────────────────────────────
function BlockEditor({ block, index, totalBlocks, onUpdate, onDelete, onInsertAfter, onInsertBefore, dragHandleProps }: {
  block: Block; index: number; totalBlocks: number;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onInsertAfter: (type?: BlockType) => void;
  onInsertBefore: (type?: BlockType) => void;
  dragHandleProps?: { listeners: Record<string, unknown>; attributes: Record<string, unknown> };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const contentDebounce = useRef<ReturnType<typeof setTimeout>>();

  // Sync content from store into contentEditable (only on mount or block.id change)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== block.content) {
      ref.current.innerHTML = block.content;
    }
  }, [block.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save content to store on blur (immediate) or debounced during typing
  const flushContent = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    clearTimeout(contentDebounce.current);
    onUpdate({ content: el.innerHTML });
  }, [onUpdate]);

  const debouncedSaveContent = useCallback(() => {
    clearTimeout(contentDebounce.current);
    contentDebounce.current = setTimeout(() => {
      const el = ref.current;
      if (el) onUpdate({ content: el.innerHTML });
    }, 400);
  }, [onUpdate]);

  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const text = el.textContent ?? "";

    // Markdown shortcuts (only when block is currently "text" type) — save immediately
    if (block.type === "text") {
      if (text.startsWith("# ")) { onUpdate({ type: "h1", content: text.slice(2) }); el.innerHTML = text.slice(2); return; }
      if (text.startsWith("## ")) { onUpdate({ type: "h2", content: text.slice(3) }); el.innerHTML = text.slice(3); return; }
      if (text.startsWith("### ")) { onUpdate({ type: "h3", content: text.slice(4) }); el.innerHTML = text.slice(4); return; }
      if (text.startsWith("- ")) { onUpdate({ type: "bullet-list", content: text.slice(2) }); el.innerHTML = text.slice(2); return; }
      if (/^\d+\.\s/.test(text)) { onUpdate({ type: "numbered-list", content: text.replace(/^\d+\.\s/, "") }); el.innerHTML = text.replace(/^\d+\.\s/, ""); return; }
      if (text.startsWith("[] ")) { onUpdate({ type: "todo", content: text.slice(3), checked: false }); el.innerHTML = text.slice(3); return; }
      if (text.startsWith("> ")) { onUpdate({ type: "quote", content: text.slice(2) }); el.innerHTML = text.slice(2); return; }
      if (text === "---") { onUpdate({ type: "divider", content: "" }); el.innerHTML = ""; onInsertAfter(); return; }
      if (text === "```") { onUpdate({ type: "code", content: "", language: "javascript" }); el.innerHTML = ""; return; }
    }

    // Slash command detection
    if (text.endsWith("/") || (slashOpen && text.includes("/"))) {
      const slashIdx = text.lastIndexOf("/");
      if (slashIdx >= 0) {
        const rect = el.getBoundingClientRect();
        setSlashPos({ top: rect.bottom + 4, left: rect.left + Math.min(slashIdx * 7, rect.width - 100) });
        setSlashFilter(text.slice(slashIdx + 1));
        if (!slashOpen) setSlashOpen(true);
      }
    } else if (slashOpen) {
      setSlashOpen(false);
    }

    // Debounced content save (NOT on every keystroke)
    debouncedSaveContent();
  }, [block.type, slashOpen, onUpdate, onInsertAfter, debouncedSaveContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (slashOpen) return; // let slash menu handle keys

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      flushContent(); // save current content before creating new block
      onInsertAfter();
    }

    if (e.key === "Backspace") {
      const el = ref.current;
      if (el && el.textContent === "" && totalBlocks > 1) {
        e.preventDefault();
        onDelete();
      }
    }

    // Bold / Italic / Underline shortcuts
    if (e.key === "b" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("bold"); }
    if (e.key === "i" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("italic"); }
    if (e.key === "u" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); document.execCommand("underline"); }
  }, [slashOpen, onInsertAfter, onDelete, totalBlocks, flushContent]);

  const handleSlashSelect = useCallback((type: BlockType) => {
    setSlashOpen(false);
    // Remove the "/" from content
    if (ref.current) {
      const text = ref.current.textContent ?? "";
      const slashIdx = text.lastIndexOf("/");
      if (slashIdx >= 0) {
        ref.current.innerHTML = text.slice(0, slashIdx);
        onUpdate({ content: text.slice(0, slashIdx) });
      }
    }
    // If current block is empty, convert it
    if (!ref.current?.textContent?.replace("/", "").trim()) {
      onUpdate({ ...newBlock(type), id: block.id });
    } else {
      onInsertAfter(type);
    }
  }, [block.id, onUpdate, onInsertAfter]);

  // ── Render by type ──────────────────────────────────
  if (block.type === "divider") {
    return (
      <div className="group/block relative flex items-center py-2">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <hr className="flex-1 border-border" />
      </div>
    );
  }

  if (block.type === "todo") {
    return (
      <div className="group/block relative flex items-start gap-2 py-0.5">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <input type="checkbox" checked={block.checked ?? false} onChange={() => onUpdate({ checked: !block.checked })} className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer flex-shrink-0" />
        <div ref={ref} contentEditable suppressContentEditableWarning className={cn("flex-1 outline-none text-sm min-h-[1.5em]", block.checked && "line-through text-muted-foreground")} onInput={handleInput} onKeyDown={handleKeyDown} onBlur={flushContent} data-placeholder="Tarea..." />
        {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <div className="group/block relative flex items-start py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className="w-1 rounded-full bg-border mr-3 self-stretch flex-shrink-0" />
        <div ref={ref} contentEditable suppressContentEditableWarning className="flex-1 outline-none text-sm italic text-muted-foreground min-h-[1.5em]" onInput={handleInput} onKeyDown={handleKeyDown} onBlur={flushContent} data-placeholder="Cita..." />
        {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
      </div>
    );
  }

  if (block.type === "callout") {
    const bgColors: Record<string, string> = { blue: "bg-blue-500/10 border-blue-500/30", green: "bg-emerald-500/10 border-emerald-500/30", yellow: "bg-yellow-500/10 border-yellow-500/30", red: "bg-red-500/10 border-red-500/30", purple: "bg-purple-500/10 border-purple-500/30", gray: "bg-muted border-border" };
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className={cn("rounded-lg border px-4 py-3 flex items-start gap-3", bgColors[block.color ?? "blue"])}>
          <button onClick={() => {
            const cur = CALLOUT_COLORS.indexOf(block.color ?? "blue");
            onUpdate({ color: CALLOUT_COLORS[(cur + 1) % CALLOUT_COLORS.length] });
          }} className="text-xl flex-shrink-0 hover:scale-110 transition-transform" title="Cambiar color">
            {block.emoji ?? "💡"}
          </button>
          <div ref={ref} contentEditable suppressContentEditableWarning className="flex-1 outline-none text-sm min-h-[1.5em]" onInput={handleInput} onKeyDown={handleKeyDown} onBlur={flushContent} data-placeholder="Escribe aquí..." />
        </div>
        {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
      </div>
    );
  }

  if (block.type === "code") {
    const copyCode = () => {
      const text = ref.current?.textContent ?? "";
      navigator.clipboard.writeText(text).then(() => toast.success("Código copiado"));
    };
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className="rounded-lg border border-border overflow-hidden" style={{ background: "#1e1e1e" }}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
            <select value={block.language ?? "javascript"} onChange={(e) => onUpdate({ language: e.target.value })} className="text-[10px] bg-transparent border-none outline-none text-gray-400 cursor-pointer">
              {["javascript", "typescript", "python", "html", "css", "json", "sql", "bash", "php", "ruby"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={copyCode} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 transition-colors" title="Copiar">
              <Copy className="h-3 w-3" /> Copiar
            </button>
          </div>
          <div ref={ref} contentEditable suppressContentEditableWarning className="px-4 py-3 font-mono text-xs outline-none min-h-[2em] whitespace-pre-wrap text-gray-200" style={{ background: "#1e1e1e" }} onInput={handleInput} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); handleInput(); } else handleKeyDown(e); }} onBlur={() => {
            flushContent();
            // Apply syntax highlighting
            const el = ref.current;
            if (el) {
              const text = el.textContent ?? "";
              const lang = block.language ?? "javascript";
              try {
                const result = hljs.highlight(text, { language: lang, ignoreIllegals: true });
                el.innerHTML = result.value;
              } catch { /* ignore */ }
            }
          }} data-placeholder="// código..." />
        </div>
        {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
      </div>
    );
  }

  if (block.type === "toggle") {
    const isExpanded = block.expanded ?? true;
    return (
      <div className="group/block relative py-0.5">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div>
          <div className="flex items-start gap-1">
            <button onClick={() => onUpdate({ expanded: !isExpanded })} className="mt-0.5 p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div ref={ref} contentEditable suppressContentEditableWarning className="flex-1 outline-none text-sm font-medium min-h-[1.5em]" onInput={handleInput} onKeyDown={handleKeyDown} onBlur={flushContent} data-placeholder="Desplegable..." />
          </div>
          {isExpanded && (
            <ToggleChildrenEditor content={block.toggleContent ?? ""} onChange={(val) => onUpdate({ toggleContent: val })} />
          )}
        </div>
        {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
      </div>
    );
  }

  if (block.type === "table" && block.tableData) {
    const data = block.tableData;
    const updateCell = (r: number, c: number, val: string) => {
      const newData = data.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : [...row]);
      onUpdate({ tableData: newData });
    };
    const addRow = () => onUpdate({ tableData: [...data, Array(data[0]?.length ?? 3).fill("")] });
    const addCol = () => onUpdate({ tableData: data.map((row) => [...row, ""]) });
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className={cn(ri === 0 && "bg-muted/50 font-medium")}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-r border-b border-border last:border-r-0 px-2 py-1.5">
                      <input value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)} className="w-full bg-transparent outline-none text-xs" placeholder="..." />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex">
            <button onClick={addRow} className="flex-1 py-1 text-[10px] text-muted-foreground hover:bg-muted transition-colors">+ Fila</button>
            <button onClick={addCol} className="flex-1 py-1 text-[10px] text-muted-foreground hover:bg-muted transition-colors border-l border-border">+ Columna</button>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "image" || block.type === "video" || block.type === "file" || block.type === "bookmark") {
    if (block.url) {
      return (
        <div className="group/block relative py-1">
          <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
          {block.type === "image" && <img src={block.url} alt="" className="max-w-full rounded-lg border border-border" />}
          {block.type === "video" && <div className="rounded-lg border border-border overflow-hidden aspect-video"><iframe src={getEmbedUrl(block.url!) ?? block.url} className="w-full h-full" allowFullScreen /></div>}
          {block.type === "file" && <div className="rounded-lg border border-border px-4 py-3 flex items-center gap-3"><FileUp className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs font-medium">{block.fileName ?? "Archivo"}</p><p className="text-[10px] text-muted-foreground">{block.fileSize ?? ""}</p></div></div>}
          {block.type === "bookmark" && <a href={block.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-border px-4 py-3 hover:bg-muted/50 transition-colors"><p className="text-xs font-medium text-blue-500 truncate">{block.url}</p><p className="text-[10px] text-muted-foreground truncate">{block.content || "Enlace externo"}</p></a>}
        </div>
      );
    }
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <MediaUploader type={block.type} onSubmit={(url, name, size) => onUpdate({ url, fileName: name, fileSize: size })} />
      </div>
    );
  }

  // ── Columns block ────────────────────────────────
  if (block.type === "columns") {
    const cols = block.columnContents ?? ["", ""];
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className={cn("grid gap-4 rounded-lg border border-dashed border-border p-3", cols.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {cols.map((colContent, ci) => (
            <ColumnCellEditor key={ci} content={colContent} placeholder={`Columna ${ci + 1}...`} onChange={(val) => { const updated = [...cols]; updated[ci] = val; onUpdate({ columnContents: updated }); }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Page link block with selector ───────────────
  if (block.type === "page-link") {
    const allPages = useSidebarStore.getState().pages;
    const linkedPage = block.url ? allPages.find((p) => p.id === block.url) : null;
    if (linkedPage) {
      return (
        <div className="group/block relative py-1">
          <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
          <button onClick={() => { useSidebarStore.getState().setActivePageId(linkedPage.id); useSidebarStore.getState().setMainView("page"); }}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs hover:bg-muted/50 transition-colors w-full text-left">
            <span className="text-base">{linkedPage.emoji}</span>
            <span className="font-medium">{linkedPage.title}</span>
          </button>
        </div>
      );
    }
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <PageLinkSelector onSelect={(pageId) => { const p = allPages.find((pg) => pg.id === pageId); if (p) onUpdate({ url: pageId, content: p.title }); }} />
      </div>
    );
  }

  // ── Mention block ───────────────────────────────
  if (block.type === "mention") {
    return (
      <div className="group/block relative py-0.5">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">
          <AtSign className="h-3 w-3" />@{block.content || "usuario"}
        </span>
      </div>
    );
  }

  // ── Date block ──────────────────────────────────
  if (block.type === "date") {
    return (
      <div className="group/block relative py-0.5">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
          <Calendar className="h-3 w-3" />{block.content || new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>
    );
  }

  // ── Table of Contents block ─────────────────────
  if (block.type === "toc") {
    return <TocBlockWrapper onInsertBefore={() => onInsertBefore()} dragHandleProps={dragHandleProps} />;
  }

  // ── Database view placeholders ──────────────────
  if (block.type.startsWith("database-")) {
    const viewLabels: Record<string, string> = { "database-table": "Vista de tabla", "database-board": "Vista de tablero", "database-list": "Vista de lista", "database-gallery": "Vista de galería", "database-calendar": "Vista de calendario" };
    return (
      <div className="group/block relative py-1">
        <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center">
          <LayoutGrid className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{viewLabels[block.type] ?? "Base de datos"}</p>
          <p className="text-xs text-muted-foreground mt-1">Conectar datos (próximamente con Supabase)</p>
        </div>
      </div>
    );
  }

  // ── Default text-like blocks ──────────────────────────
  const textStyles: Record<string, string> = {
    text: "text-sm", h1: "text-2xl font-bold", h2: "text-xl font-semibold", h3: "text-lg font-semibold", h4: "text-base font-medium",
    "bullet-list": "text-sm", "numbered-list": "text-sm",
  };

  const prefix = block.type === "bullet-list" ? <span className="mr-2 text-muted-foreground select-none">•</span>
    : block.type === "numbered-list" ? <span className="mr-2 text-muted-foreground select-none tabular-nums">{index + 1}.</span>
    : null;

  const placeholder = block.type === "h1" ? "Encabezado 1" : block.type === "h2" ? "Encabezado 2" : block.type === "h3" ? "Encabezado 3" : "Escribe aquí, usa '/' para comandos...";

  return (
    <div className="group/block relative flex items-start py-0.5">
      <BlockHandle onInsert={() => onInsertBefore()} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
      {prefix}
      <div ref={ref} contentEditable suppressContentEditableWarning className={cn("flex-1 outline-none min-h-[1.5em]", textStyles[block.type] ?? "text-sm")} onInput={handleInput} onKeyDown={handleKeyDown} onBlur={flushContent} data-placeholder={placeholder} />
      {slashOpen && <SlashMenu filter={slashFilter} pos={slashPos} onSelect={handleSlashSelect} onClose={() => setSlashOpen(false)} />}
    </div>
  );
}

// ── Page Link Selector ──────────────────────────────────────
function PageLinkSelector({ onSelect }: { onSelect: (pageId: string) => void }) {
  const [search, setSearch] = useState("");
  const pages = useSidebarStore((s) => s.pages);
  const filtered = useMemo(() => pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())), [pages, search]);
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar página..." className="w-full bg-transparent text-xs outline-none border-b border-border pb-1.5 placeholder:text-muted-foreground/60" autoFocus />
      <div className="max-h-[150px] overflow-y-auto space-y-0.5">
        {filtered.length === 0 && <p className="text-[10px] text-muted-foreground py-2 text-center">No se encontraron páginas</p>}
        {filtered.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)} className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-accent/50 transition-colors text-left">
            <span>{p.emoji}</span><span className="truncate">{p.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Table of Contents Wrapper (reactive to store changes) ───
function TocBlockWrapper({ onInsertBefore, dragHandleProps }: { onInsertBefore: () => void; dragHandleProps?: { listeners: Record<string, unknown>; attributes: Record<string, unknown> } }) {
  const activePageId = useSidebarStore((s) => s.activePageId);
  const pages = useSidebarStore((s) => s.pages);
  const allBlocks = useMemo(() => pages.find((p) => p.id === activePageId)?.blocks ?? [], [pages, activePageId]);
  return (
    <div className="group/block relative py-1">
      <BlockHandle onInsert={onInsertBefore} dragListeners={dragHandleProps?.listeners} dragAttributes={dragHandleProps?.attributes} />
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tabla de contenido</p>
        <TocBlock blocks={allBlocks} />
      </div>
    </div>
  );
}

// ── Table of Contents Block ─────────────────────────────────
function TocBlock({ blocks }: { blocks: Block[] }) {
  const headings = useMemo(() => blocks.filter((b) => ["h1", "h2", "h3", "h4"].includes(b.type)).map((b) => ({ id: b.id, type: b.type, text: b.content.replace(/<[^>]*>/g, "") })), [blocks]);
  const indents: Record<string, string> = { h1: "pl-0", h2: "pl-4", h3: "pl-8", h4: "pl-12" };
  if (headings.length === 0) return <p className="text-xs text-muted-foreground italic py-2">Agrega encabezados (H1-H4) para generar el índice</p>;
  return (
    <div className="border-l-2 border-primary/30 pl-4 space-y-1 py-1">
      {headings.map((h) => (
        <button key={h.id} onClick={() => { const el = document.querySelector(`[data-block-id="${h.id}"]`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          className={cn("block text-xs text-primary hover:underline cursor-pointer text-left truncate", indents[h.type])}>
          {h.text || "Sin título"}
        </button>
      ))}
    </div>
  );
}

// ── Toggle Children Editor ──────────────────────────────────
function ToggleChildrenEditor({ content, onChange }: { content: string; onChange: (val: string) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { if (elRef.current && elRef.current.innerHTML !== content) elRef.current.innerHTML = content; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useCallback(() => { if (elRef.current) onChange(elRef.current.innerHTML); }, [onChange]);
  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      className="ml-6 pl-3 border-l border-border mt-1 text-sm text-muted-foreground outline-none min-h-[1.5em]"
      data-placeholder="Escribe contenido..."
      onInput={() => { clearTimeout(debounceRef.current); debounceRef.current = setTimeout(save, 400); }}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.execCommand("insertLineBreak"); } }}
    />
  );
}

// ── Column Cell Editor ──────────────────────────────────────
function ColumnCellEditor({ content, placeholder, onChange }: { content: string; placeholder: string; onChange: (val: string) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { if (elRef.current && elRef.current.innerHTML !== content) elRef.current.innerHTML = content; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useCallback(() => { if (elRef.current) onChange(elRef.current.innerHTML); }, [onChange]);
  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      className="min-h-[40px] rounded border border-border/50 p-2 text-xs text-muted-foreground outline-none"
      data-placeholder={placeholder}
      onInput={() => { clearTimeout(debounceRef.current); debounceRef.current = setTimeout(save, 300); }}
      onBlur={save}
    />
  );
}

// ── Block Handle (drag + add) ───────────────────────────────
function BlockHandle({ onInsert, dragListeners, dragAttributes }: { onInsert: () => void; dragListeners?: Record<string, unknown>; dragAttributes?: Record<string, unknown> }) {
  return (
    <div className="absolute -left-6 md:-left-10 top-0.5 flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
      <button onClick={onInsert} className="rounded p-0.5 hover:bg-muted transition-colors" title="Agregar bloque"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></button>
      <div className="rounded p-0.5 cursor-grab hover:bg-muted transition-colors" {...(dragListeners ?? {})} {...(dragAttributes ?? {})}><GripVertical className="h-3.5 w-3.5 text-muted-foreground" /></div>
    </div>
  );
}

// ── Media uploader ──────────────────────────────────────────
// P2-16: Smart URL embed detection
function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function MediaUploader({ type, onSubmit }: { type: string; onSubmit: (url: string, name?: string, size?: string) => void }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const labels: Record<string, string> = { image: "imagen", video: "video", file: "archivo", bookmark: "URL" };
  const accepts: Record<string, string> = { image: "image/*", video: "video/*", file: "*", bookmark: "" };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("field", "block");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Fallback to blob URL if Cloudinary not configured
        if (res.status === 503) {
          const blobUrl = URL.createObjectURL(f);
          const size = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;
          onSubmit(blobUrl, f.name, size);
          return;
        }
        console.error("Upload error:", err);
        return;
      }
      const data = await res.json();
      const size = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;
      onSubmit(data.url, f.name, size);
    } catch {
      // Fallback to blob URL on error
      const blobUrl = URL.createObjectURL(f);
      const size = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;
      onSubmit(blobUrl, f.name, size);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-border p-4 text-center space-y-2">
      <p className="text-xs text-muted-foreground">{uploading ? "Subiendo..." : `Agregar ${labels[type] ?? type}`}</p>
      <div className="flex items-center justify-center gap-2">
        {type !== "bookmark" && (
          <>
            <input ref={fileRef} type="file" accept={accepts[type]} onChange={handleFile} className="hidden" />
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Subiendo..." : "Subir archivo"}</Button>
          </>
        )}
        <div className="flex items-center gap-1">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Pegar URL..." className="h-7 w-40 rounded border border-border px-2 text-xs bg-transparent outline-none" onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) onSubmit(url.trim()); }} />
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => url.trim() && onSubmit(url.trim())}><Check className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
}

// ── Emoji picker (small) ────────────────────────────────────
function EmojiPicker({ current, onChange }: { current: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-4xl hover:bg-muted rounded-lg p-1 transition-colors">{current}</button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
          {EMOJIS_SMALL.map((e) => <button key={e} onClick={() => { onChange(e); setOpen(false); }} className="text-xl rounded p-1 hover:bg-accent">{e}</button>)}
        </div>
      )}
    </div>
  );
}

// ── CSS for empty contentEditable placeholder ───────────────
const placeholderCSS = `[contenteditable]:empty:before { content: attr(data-placeholder); color: hsl(var(--muted-foreground)); opacity: 0.5; pointer-events: none; }`;

// ── Sortable Block Wrapper ──────────────────────────────────
function SortableBlock({ block, index, totalBlocks, onUpdate, onDelete, onInsertAfter, onInsertBefore }: {
  block: Block; index: number; totalBlocks: number;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onInsertAfter: (type?: BlockType) => void;
  onInsertBefore: (type?: BlockType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} data-block-id={block.id}>
      <BlockEditor
        block={block}
        index={index}
        totalBlocks={totalBlocks}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onInsertAfter={onInsertAfter}
        onInsertBefore={onInsertBefore}
        dragHandleProps={{ listeners: listeners as unknown as Record<string, unknown>, attributes: attributes as unknown as Record<string, unknown> }}
      />
    </div>
  );
}

// ── Main PageEditor ─────────────────────────────────────────
export function PageEditor() {
  const { activePageId, pages, updatePage, setMainView, setActivePageId, workspaces, activeWorkspaceId, focusMode, setFocusMode } = useSidebarStore();
  const page = useMemo(() => pages.find((p) => p.id === activePageId), [pages, activePageId]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [editingBreadcrumb, setEditingBreadcrumb] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<Element[]>([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const titleRef = useRef<HTMLInputElement>(null);
  const bcInputRef = useRef<HTMLInputElement>(null);

  const blocks = useMemo(() => page?.blocks ?? [], [page?.blocks]);
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);
  const ws = workspaces.find((w) => w.id === activeWorkspaceId);
  const parent = page?.parentId ? pages.find((p) => p.id === page.parentId) : null;

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleBlockDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activePageId) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      updatePage(activePageId, { blocks: newBlocks });
    }
  }, [blocks, activePageId, updatePage]);

  useEffect(() => { if (editingBreadcrumb) setTimeout(() => { bcInputRef.current?.focus(); bcInputRef.current?.select(); }, 10); }, [editingBreadcrumb]);

  // Ctrl+A: second consecutive press selects all blocks
  const ctrlACount = useRef(0);
  const ctrlATimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const target = e.target as HTMLElement;
        if (!target.isContentEditable) return;
        const editorContainer = document.querySelector("[data-page-editor]");
        if (!editorContainer || !editorContainer.contains(target)) return;

        ctrlACount.current++;
        clearTimeout(ctrlATimer.current);
        ctrlATimer.current = setTimeout(() => { ctrlACount.current = 0; }, 500);

        if (ctrlACount.current >= 2) {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(editorContainer);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          ctrlACount.current = 0;
        }
        // First press: let native Ctrl+A select within the block
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Ctrl+F search handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        const editorContainer = document.querySelector("[data-page-editor]");
        if (!editorContainer) return;
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && searchOpen) {
        clearSearchHighlights();
        setSearchOpen(false);
        setSearchQuery("");
        setSearchMatches([]);
      }
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen, focusMode, setFocusMode]);

  // Search logic
  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      clearSearchHighlights();
      setSearchMatches([]);
      return;
    }
    const container = document.querySelector("[data-page-editor]");
    if (!container) return;
    clearSearchHighlights();
    const query = searchQuery.toLowerCase();
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const marks: Element[] = [];
    const ranges: { node: Text; start: number; end: number }[] = [];
    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      const text = textNode.textContent?.toLowerCase() ?? "";
      let startPos = 0;
      let idx = text.indexOf(query, startPos);
      while (idx !== -1) {
        ranges.push({ node: textNode, start: idx, end: idx + query.length });
        startPos = idx + query.length;
        idx = text.indexOf(query, startPos);
      }
    }
    // Apply highlights in reverse order to preserve positions
    for (let i = ranges.length - 1; i >= 0; i--) {
      const { node, start, end } = ranges[i];
      try {
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, end);
        const mark = document.createElement("mark");
        mark.className = "search-highlight bg-yellow-300/70 dark:bg-yellow-500/40 rounded-sm";
        mark.setAttribute("data-search-mark", "true");
        range.surroundContents(mark);
        marks.unshift(mark);
      } catch { /* skip if range is invalid */ }
    }
    setSearchMatches(marks);
    setSearchIdx(0);
    if (marks.length > 0) marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchQuery, searchOpen]);

  function clearSearchHighlights() {
    document.querySelectorAll("[data-search-mark]").forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
        parent.normalize();
      }
    });
  }

  function navigateSearch(dir: 1 | -1) {
    if (searchMatches.length === 0) return;
    // Remove active style from current
    searchMatches[searchIdx]?.classList.remove("ring-2", "ring-blue-500");
    const next = (searchIdx + dir + searchMatches.length) % searchMatches.length;
    setSearchIdx(next);
    const el = searchMatches[next];
    if (el) {
      el.classList.add("ring-2", "ring-blue-500");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const saveBlocks = useCallback((newBlocks: Block[]) => {
    if (!activePageId) return;
    setSaveStatus("saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePage(activePageId, { blocks: newBlocks });
      setSaveStatus("saved");
    }, 500);
  }, [activePageId, updatePage]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map((b) => b.id === blockId ? { ...b, ...updates } : b);
    saveBlocks(newBlocks);
  }, [blocks, saveBlocks]);

  const deleteBlock = useCallback((blockId: string) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex((b) => b.id === blockId);
    const prevBlock = idx > 0 ? blocks[idx - 1] : null;
    const newBlocks = blocks.filter((b) => b.id !== blockId);
    if (activePageId) updatePage(activePageId, { blocks: newBlocks });
    // Focus previous block at end
    if (prevBlock) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const wrapper = document.querySelector(`[data-block-id="${prevBlock.id}"]`);
          const editable = wrapper?.querySelector("[contenteditable]") as HTMLElement;
          if (editable) {
            editable.focus();
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editable);
            range.collapse(false); // end of content
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        });
      });
    }
  }, [blocks, activePageId, updatePage]);

  const insertAfter = useCallback((blockId: string, type?: BlockType) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const nb = newBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, nb);
    // Save immediately (bypass debounce for structural changes)
    if (activePageId) updatePage(activePageId, { blocks: newBlocks });
    // Focus new block after React re-renders
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wrapper = document.querySelector(`[data-block-id="${nb.id}"]`);
        const editable = wrapper?.querySelector("[contenteditable]") as HTMLElement;
        if (editable) {
          editable.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editable);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    });
  }, [blocks, activePageId, updatePage]);

  const insertBefore = useCallback((blockId: string, type?: BlockType) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const nb = newBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(idx, 0, nb);
    saveBlocks(newBlocks);
  }, [blocks, saveBlocks]);

  if (!page) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground"><p className="text-sm">Selecciona una página del sidebar</p></div>;
  }

  const todoDone = blocks.filter((b) => b.type === "todo" && b.checked).length;
  const todoTotal = blocks.filter((b) => b.type === "todo").length;

  return (
    <div className={cn("flex-1 overflow-auto", focusMode && "bg-background")}>
      <style>{placeholderCSS}</style>
      <FloatingToolbar />

      {/* Focus mode top bar */}
      {focusMode && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-2 bg-background/90 backdrop-blur-sm border-b border-border/50">
          <span className="text-sm font-medium text-muted-foreground truncate">{page?.emoji} {page?.title}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={() => setFocusMode(false)}>
            <Minimize2 className="h-3.5 w-3.5" /> Salir
          </Button>
        </div>
      )}

      {/* Search bar */}
      {searchOpen && (
        <div className="sticky top-0 z-40 flex items-center gap-2 px-4 py-2 bg-background border-b border-border shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en esta página..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") navigateSearch(1);
              if (e.key === "Escape") { clearSearchHighlights(); setSearchOpen(false); setSearchQuery(""); setSearchMatches([]); }
            }}
          />
          {searchQuery && (
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {searchMatches.length > 0 ? `${searchIdx + 1} de ${searchMatches.length}` : "0 resultados"}
            </span>
          )}
          <button onClick={() => navigateSearch(-1)} className="rounded p-1 hover:bg-muted transition-colors" title="Anterior"><ArrowUp className="h-3.5 w-3.5" /></button>
          <button onClick={() => navigateSearch(1)} className="rounded p-1 hover:bg-muted transition-colors" title="Siguiente"><ArrowDown className="h-3.5 w-3.5" /></button>
          <button onClick={() => { clearSearchHighlights(); setSearchOpen(false); setSearchQuery(""); setSearchMatches([]); }} className="rounded p-1 hover:bg-muted transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className={cn("max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6", focusMode && "max-w-2xl py-8 md:py-12")}>
        {/* Status + breadcrumb (navigable + editable) */}
        <div className={cn("flex items-center justify-between mb-6", focusMode && "hidden")} data-breadcrumb>
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <button onClick={() => setMainView("dashboard")} className="hover:underline hover:text-foreground cursor-pointer transition-colors">{ws?.name ?? "Workspace"}</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setMainView("dashboard")} className="hover:underline hover:text-foreground cursor-pointer transition-colors">{page.isPrivate ? "Privado" : "Páginas"}</button>
            {parent && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button onClick={() => { setActivePageId(parent.id); setMainView("page"); }} className="hover:underline hover:text-foreground cursor-pointer transition-colors">{parent.title}</button>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            {editingBreadcrumb ? (
              <input
                ref={bcInputRef}
                defaultValue={page.title}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) updatePage(page.id, { title: v }); setEditingBreadcrumb(false); }
                  if (e.key === "Escape") setEditingBreadcrumb(false);
                }}
                onBlur={(e) => { const v = e.target.value.trim(); if (v) updatePage(page.id, { title: v }); setEditingBreadcrumb(false); }}
                className="bg-transparent border-b border-primary outline-none text-sm font-medium text-foreground max-w-[200px]"
              />
            ) : (
              <span onDoubleClick={() => setEditingBreadcrumb(true)} className="text-foreground font-medium cursor-default">{page.title}</span>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{saveStatus === "saving" ? "Guardando..." : "Guardado"}</span>
            <button onClick={() => setFocusMode(true)} className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Modo Focus">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Cover image */}
        {page.coverImage ? (
          <div className="relative -mx-4 md:-mx-8 mb-4 h-48 bg-cover bg-center group" style={{ backgroundImage: `url(${page.coverImage})` }}>
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    if (res.ok) { const { url } = await res.json(); updatePage(page.id, { coverImage: url }); }
                  } catch { /* ignore */ }
                };
                input.click();
              }} className="rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">Cambiar</button>
              <button onClick={() => updatePage(page.id, { coverImage: null })} className="rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">Quitar</button>
            </div>
          </div>
        ) : (
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
                if (res.ok) { const { url } = await res.json(); updatePage(page.id, { coverImage: url }); }
              } catch { /* ignore */ }
            };
            input.click();
          }} className="text-[10px] text-muted-foreground hover:text-foreground mb-2">+ Agregar portada</button>
        )}

        {/* Emoji + Title */}
        <div className="flex items-start gap-3 mb-2">
          <EmojiPicker current={page.emoji} onChange={(e) => updatePage(page.id, { emoji: e })} />
          <input
            ref={titleRef}
            defaultValue={page.title}
            onBlur={(e) => { if (e.target.value.trim()) updatePage(page.id, { title: e.target.value.trim() }); }}
            className="flex-1 bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50"
            placeholder="Sin título"
          />
        </div>

        {/* Todo progress */}
        {todoTotal > 0 && (
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{todoDone}/{todoTotal} completadas</span>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${todoTotal > 0 ? (todoDone / todoTotal) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Blocks with Drag & Drop */}
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleBlockDragEnd}>
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="pl-6 md:pl-10 space-y-0.5" data-page-editor>
              {blocks.map((block, i) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  index={i}
                  totalBlocks={blocks.length}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onInsertAfter={(type) => insertAfter(block.id, type)}
                  onInsertBefore={(type) => insertBefore(block.id, type)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty state click area */}
        {blocks.length === 0 && (
          <div className="py-8 text-center space-y-4">
            <button onClick={() => saveBlocks([newBlock()])} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Click para empezar a escribir, o usa <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">/</kbd> para comandos
            </button>
            <div>
              <p className="text-[10px] text-muted-foreground mb-2">O crear desde plantilla:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {useSidebarStore.getState().pageTemplates.map((tmpl) => (
                  <button key={tmpl.id} onClick={() => {
                    if (activePageId) {
                      const now = Date.now();
                      const newBlocks = tmpl.blocks.map((b, i) => ({ ...b, id: `blk_${now}_${i}` }));
                      updatePage(activePageId, { blocks: newBlocks, title: tmpl.name, emoji: tmpl.emoji });
                    }
                  }} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors">
                    {tmpl.emoji} {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
