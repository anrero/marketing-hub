"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileUp, Image as ImageIcon, Video, ListTodo, Link2, MessageSquare,
  Calendar, AtSign, Minus, CheckSquare,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBoardStore } from "@/stores/board-store";
import { cn } from "@/lib/utils";

interface SlashCommand {
  id: string;
  names: string[];
  label: string;
  description: string;
  icon: React.ReactNode;
  group: string;
}

const COMMANDS: SlashCommand[] = [
  { id: "file", names: ["/archivo", "/file"], label: "Archivo", description: "Subir archivo adjunto", icon: <FileUp className="h-4 w-4" />, group: "Archivos" },
  { id: "image", names: ["/imagen", "/image"], label: "Imagen", description: "Subir imagen", icon: <ImageIcon className="h-4 w-4" />, group: "Archivos" },
  { id: "video", names: ["/video"], label: "Video", description: "Subir video", icon: <Video className="h-4 w-4" />, group: "Archivos" },
  { id: "task", names: ["/tarea", "/task"], label: "Tarea", description: "Referencia a otra tarea", icon: <ListTodo className="h-4 w-4" />, group: "Tareas" },
  { id: "subtask", names: ["/subtarea", "/subtask"], label: "Subtarea", description: "Crear subtarea", icon: <CheckSquare className="h-4 w-4" />, group: "Tareas" },
  { id: "link", names: ["/link", "/enlace"], label: "Enlace", description: "Insertar un link", icon: <Link2 className="h-4 w-4" />, group: "Contenido" },
  { id: "comment", names: ["/comentario", "/comment"], label: "Comentario", description: "Agregar comentario rápido", icon: <MessageSquare className="h-4 w-4" />, group: "Contenido" },
  { id: "date", names: ["/fecha", "/date"], label: "Fecha", description: "Insertar fecha", icon: <Calendar className="h-4 w-4" />, group: "Contenido" },
  { id: "mention", names: ["/mencion", "/mention"], label: "Mención", description: "Mencionar miembro", icon: <AtSign className="h-4 w-4" />, group: "Contenido" },
  { id: "divider", names: ["/separador", "/divider"], label: "Separador", description: "Línea separadora", icon: <Minus className="h-4 w-4" />, group: "Contenido" },
  { id: "checklist", names: ["/checklist"], label: "Checklist", description: "Lista de checkboxes", icon: <CheckSquare className="h-4 w-4" />, group: "Contenido" },
];

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  filter: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ position, filter, onSelect, onClose }: SlashCommandMenuProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((cmd) => {
    const q = filter.toLowerCase();
    return cmd.names.some((n) => n.includes(q)) || cmd.label.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q);
  });

  useEffect(() => { setActiveIdx(0); }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[activeIdx]) { e.preventDefault(); onSelect(filtered[activeIdx]); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [activeIdx, filtered, onSelect, onClose]);

  if (filtered.length === 0) return null;

  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-[260px] rounded-lg border border-border bg-popover shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ScrollArea className="max-h-[280px]">
        <div className="p-1">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">{group}</p>
              {filtered.filter((c) => c.group === group).map((cmd) => {
                const idx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    className={cn("flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-xs transition-colors", idx === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50")}
                    onClick={() => onSelect(cmd)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted">{cmd.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{cmd.label}</p>
                      <p className="text-[10px] text-muted-foreground">{cmd.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Mention menu (@user) ────────────────────────────────────
interface MentionMenuProps {
  position: { top: number; left: number };
  filter: string;
  onSelect: (member: { id: string; name: string; avatar: string }) => void;
  onClose: () => void;
}

export function MentionMenu({ position, filter, onSelect, onClose }: MentionMenuProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const { getAllTeamMembers } = useBoardStore();
  const members = getAllTeamMembers().filter((m) =>
    m.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => { setActiveIdx(0); }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, members.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && members[activeIdx]) { e.preventDefault(); onSelect(members[activeIdx]); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [activeIdx, members, onSelect, onClose]);

  if (members.length === 0) return null;

  return (
    <div className="fixed z-[100] w-[220px] rounded-lg border border-border bg-popover shadow-lg" style={{ top: position.top, left: position.left }}>
      <ScrollArea className="max-h-[200px]">
        <div className="p-1">
          {members.map((m, idx) => (
            <button
              key={m.id}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors", idx === activeIdx ? "bg-accent" : "hover:bg-accent/50")}
              onClick={() => onSelect(m)}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback className={cn("text-[8px]", m.color ? `${m.color} text-white` : "bg-muted")}>{m.avatar}</AvatarFallback>
              </Avatar>
              <span>{m.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{m.role}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Hook to manage slash commands in a text field
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useSlashCommands(_taskId?: string) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.currentTarget.value;
    const pos = e.currentTarget.selectionStart ?? 0;

    if (e.key === "/" && (pos === 0 || val[pos - 1] === " ")) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSlashPos({ top: rect.bottom + 4, left: rect.left });
      setSlashOpen(true);
      setSlashFilter("/");
    }
    if (e.key === "@" && (pos === 0 || val[pos - 1] === " ")) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMentionPos({ top: rect.bottom + 4, left: rect.left });
      setMentionOpen(true);
      setMentionFilter("");
    }
  }, []);

  const handleChange = useCallback((val: string) => {
    if (slashOpen) {
      const slashIdx = val.lastIndexOf("/");
      if (slashIdx >= 0) setSlashFilter(val.slice(slashIdx));
      else { setSlashOpen(false); setSlashFilter(""); }
    }
    if (mentionOpen) {
      const atIdx = val.lastIndexOf("@");
      if (atIdx >= 0) setMentionFilter(val.slice(atIdx + 1));
      else { setMentionOpen(false); setMentionFilter(""); }
    }
  }, [slashOpen, mentionOpen]);

  const closeAll = useCallback(() => {
    setSlashOpen(false);
    setMentionOpen(false);
  }, []);

  return { slashOpen, slashFilter, slashPos, mentionOpen, mentionFilter, mentionPos, handleKeyDown, handleChange, closeAll, setSlashOpen, setMentionOpen };
}
