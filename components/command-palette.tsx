"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import {
  Plus,
  Search,
  LayoutDashboard,
  AlertTriangle,
  User,
} from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { FileText } from "lucide-react";

export function CommandPalette() {
  const {
    commandOpen,
    setCommandOpen,
    tasks,
    boards,
    setSelectedTask,
    setActiveBoard,
    setNewTaskDialogOpen,
    setNewBoardDialogOpen,
    setFilterAssignee,
    setFilterPriority,
    getAllTeamMembers,
  } = useBoardStore();

  const { pages, setActivePageId, setMainView, addPage } = useSidebarStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const allMembers = getAllTeamMembers();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandOpen, setCommandOpen]);

  if (!commandOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setCommandOpen(false)}
      />
      <Command className="relative z-50 w-full max-w-[520px] rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input
            placeholder="Buscar tareas, boards, acciones..."
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
            No se encontraron resultados
          </Command.Empty>

          {/* Acciones rápidas */}
          <Command.Group
            heading={
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Acciones rápidas
              </span>
            }
          >
            <Command.Item
              onSelect={() => {
                setCommandOpen(false);
                setNewTaskDialogOpen(true);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Nueva tarea
            </Command.Item>
            <Command.Item
              onSelect={() => {
                setCommandOpen(false);
                if (currentUser) setFilterAssignee(currentUser.id);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Mis tareas ({currentUser?.name ?? "Usuario"})
            </Command.Item>
            <Command.Item
              onSelect={() => {
                setCommandOpen(false);
                setFilterPriority("urgente");
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
            >
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Tareas urgentes
            </Command.Item>
            <Command.Item onSelect={() => { setCommandOpen(false); setMainView("dashboard"); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />Ir a Inicio
            </Command.Item>
            <Command.Item onSelect={() => { setCommandOpen(false); setMainView("inbox"); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent">
              <Search className="h-4 w-4 text-muted-foreground" />Ir a Bandeja de entrada
            </Command.Item>
            <Command.Item onSelect={() => { setCommandOpen(false); setNewBoardDialogOpen(true); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent">
              <Plus className="h-4 w-4 text-muted-foreground" />Crear nuevo board
            </Command.Item>
            <Command.Item onSelect={() => { setCommandOpen(false); addPage(null, false); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent">
              <FileText className="h-4 w-4 text-muted-foreground" />Crear nueva página
            </Command.Item>
          </Command.Group>

          {/* Boards */}
          <Command.Group
            heading={
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Boards
              </span>
            }
          >
            {boards.map((board) => (
              <Command.Item
                key={board.id}
                value={`board ${board.name}`}
                onSelect={() => {
                  setCommandOpen(false);
                  setActiveBoard(board.id);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                {board.name}
              </Command.Item>
            ))}
          </Command.Group>

          {/* Tareas */}
          <Command.Group
            heading={
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tareas
              </span>
            }
          >
            {tasks.map((task) => {
              const assignee = allMembers.find(
                (m) => m.id === task.assigneeId
              );
              return (
                <Command.Item
                  key={task.id}
                  value={`${task.title} ${task.store} ${assignee?.name ?? ""}`}
                  onSelect={() => {
                    setCommandOpen(false);
                    setSelectedTask(task.id);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {task.store}
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>

          {/* Páginas (busca en contenido) */}
          <Command.Group
            heading={
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Páginas
              </span>
            }
          >
            {pages.map((page) => {
              const blockTexts = (page.blocks ?? []).map((b) => b.content.replace(/<[^>]*>/g, "")).join(" ");
              const searchVal = `${page.title} ${page.emoji} ${blockTexts}`;
              return (
                <Command.Item
                  key={page.id}
                  value={searchVal}
                  onSelect={() => {
                    setCommandOpen(false);
                    setActivePageId(page.id);
                    setMainView("page");
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{page.emoji} {page.title}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{blockTexts.slice(0, 80)}{blockTexts.length > 80 ? "..." : ""}</p>
                  </div>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
