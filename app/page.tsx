"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { BoardHeader } from "@/components/board-header";
import { KanbanBoard } from "@/components/kanban-board";
import { TableView } from "@/components/table-view";
import { TaskDetail } from "@/components/task-detail";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { NewBoardDialog } from "@/components/new-board-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { CommandPalette } from "@/components/command-palette";
import { Dashboard } from "@/components/dashboard";
import { PageEditor } from "@/components/page-editor";
import { useBoardStore } from "@/stores/board-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { CalendarView } from "@/components/calendar-view";
import { GalleryView } from "@/components/gallery-view";
import { TimelineView } from "@/components/timeline-view";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { Onboarding } from "@/components/onboarding";
import { ChatWidget } from "@/components/chat-widget";
import { LoginPage } from "@/components/login-page";
import { useAuthStore } from "@/stores/auth-store";
import { Inbox, Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function InboxView() {
  const setSelectedTask = useBoardStore((s) => s.setSelectedTask);
  const allTasks = useBoardStore((s) => s.tasks);
  const customTeamMembers = useBoardStore((s) => s.customTeamMembers);
  const currentUser = useAuthStore((s) => s.currentUser);
  const userId = currentUser?.id ?? "u1";

  // Generate dynamic notifications
  const notifications = useMemo(() => {
    const TEAM_MEMBERS = [
      { id: "u1", name: "Andrey" }, { id: "u2", name: "María" },
      { id: "u3", name: "Carlos" }, { id: "u4", name: "Ana" },
    ];
    const members = [...TEAM_MEMBERS, ...customTeamMembers];
    const notifs: { id: string; icon: string; text: string; time: string; taskId: string | null; read: boolean }[] = [];
    const today = new Date().toISOString().split("T")[0];

    // Overdue tasks assigned to current user
    allTasks.filter((t) => t.assigneeId === userId && t.dueDate && t.dueDate < today && t.status !== "completado" && !t.archivedAt).forEach((t) => {
      notifs.push({ id: `ovr_${t.id}`, icon: "⚠️", text: `Tarea vencida: ${t.title.replace(/<[^>]*>/g, "")}`, time: t.dueDate, taskId: t.id, read: false });
    });

    // Tasks assigned to current user (recent activity)
    allTasks.filter((t) => t.assigneeId === userId && !t.archivedAt).slice(0, 3).forEach((t) => {
      const lastActivity = t.activity[t.activity.length - 1];
      if (lastActivity && lastActivity.authorId !== userId) {
        const author = members.find((m) => m.id === lastActivity.authorId);
        notifs.push({ id: `act_${t.id}`, icon: "👤", text: `${author?.name ?? "Alguien"} ${lastActivity.action} en: ${t.title.replace(/<[^>]*>/g, "")}`, time: lastActivity.createdAt, taskId: t.id, read: false });
      }
    });

    // Recent comments on user's tasks
    allTasks.filter((t) => t.assigneeId === userId && t.comments.length > 0 && !t.archivedAt).forEach((t) => {
      const lastComment = t.comments[t.comments.length - 1];
      if (lastComment && lastComment.authorId !== userId) {
        const author = members.find((m) => m.id === lastComment.authorId);
        notifs.push({ id: `cmt_${t.id}`, icon: "💬", text: `${author?.name ?? "Alguien"} comentó en: ${t.title.replace(/<[^>]*>/g, "")}`, time: lastComment.createdAt, taskId: t.id, read: false });
      }
    });

    // Completed tasks (by others)
    allTasks.filter((t) => t.status === "completado" && t.assigneeId !== userId && !t.archivedAt).slice(0, 2).forEach((t) => {
      const author = members.find((m) => m.id === t.assigneeId);
      notifs.push({ id: `done_${t.id}`, icon: "✅", text: `${author?.name ?? "Alguien"} completó: ${t.title.replace(/<[^>]*>/g, "")}`, time: t.activity[t.activity.length - 1]?.createdAt ?? "", taskId: t.id, read: true });
    });

    return notifs.slice(0, 15);
  }, [allTasks, userId, customTeamMembers]);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const unread = notifications.filter((n) => !n.read && !readIds.has(n.id)).length;
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Bandeja de entrada</h2>
            {unread > 0 && <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">{unread}</span>}
          </div>
          {unread > 0 && (
            <button onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))} className="text-xs text-primary hover:underline">
              Marcar todas como leídas
            </button>
          )}
        </div>
        <div className="space-y-1">
          {notifications.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No hay notificaciones</p>}
          {notifications.map((n) => {
            const isRead = n.read || readIds.has(n.id);
            return (
              <button key={n.id} onClick={() => { if (n.taskId) setSelectedTask(n.taskId); setReadIds((s) => { const next = new Set(Array.from(s)); next.add(n.id); return next; }); }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${isRead ? "text-muted-foreground hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10 font-medium"}`}>
                <span className="text-lg flex-shrink-0">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground">{n.time ? new Date(n.time).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}</p>
                </div>
                {!isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoardView() {
  const viewMode = useBoardStore((s) => s.viewMode);
  return (
    <>
      <BoardHeader />
      {viewMode === "kanban" && <KanbanBoard />}
      {viewMode === "tabla" && <TableView />}
      {viewMode === "calendario" && <CalendarView />}
      {viewMode === "galeria" && <GalleryView />}
      {viewMode === "timeline" && <TimelineView />}
    </>
  );
}

export default function Home() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const checkSession = useAuthStore((s) => s.checkSession);
  const [hydrated, setHydrated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Check session on mount
  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      setSessionChecked(true);
      return;
    }
    checkSession().then(() => setSessionChecked(true));
  }, [hydrated, currentUser, checkSession]);

  if (!hydrated || !sessionChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;
  return <AppShell />;
}

function AppShell() {
  const mainView = useSidebarStore((s) => s.mainView);
  const activePageId = useSidebarStore((s) => s.activePageId);
  const pages = useSidebarStore((s) => s.pages);
  const focusMode = useSidebarStore((s) => s.focusMode);
  const boards = useBoardStore((s) => s.boards);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const viewMode = useBoardStore((s) => s.viewMode);
  const serverLoaded = useBoardStore((s) => s._serverLoaded);
  const loadFromServer = useBoardStore((s) => s.loadFromServer);
  const refreshFromServer = useBoardStore((s) => s.refreshFromServer);
  const loadPagesFromServer = useSidebarStore((s) => s.loadPagesFromServer);
  const loadWorkspacesFromServer = useSidebarStore((s) => s.loadWorkspacesFromServer);
  const currentUser = useAuthStore((s) => s.currentUser);
  const workspaceId = currentUser?.workspaceId;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loadedForWorkspace = useRef<string | null>(null);

  // Load workspace data on mount or when workspace changes (new login)
  const loadAllData = async (wsId: string) => {
    setDataLoading(true);
    setLoadError(false);
    const [boardsOk] = await Promise.all([
      loadFromServer(wsId),
      loadPagesFromServer(wsId),
      loadWorkspacesFromServer(wsId),
    ]);
    if (!boardsOk) setLoadError(true);
    setDataLoading(false);
  };

  useEffect(() => {
    if (!workspaceId || loadedForWorkspace.current === workspaceId) return;
    loadedForWorkspace.current = workspaceId;
    loadAllData(workspaceId);
  }, [workspaceId, loadFromServer, loadPagesFromServer, loadWorkspacesFromServer]);

  // Polling every 30s for multi-user sync
  useEffect(() => {
    if (!workspaceId) return;
    const interval = setInterval(() => {
      refreshFromServer(workspaceId);
    }, 30000);
    return () => clearInterval(interval);
  }, [workspaceId, refreshFromServer]);

  // P2-18: Dynamic page title
  useEffect(() => {
    let title = "Marketing Hub";
    if (mainView === "dashboard") title = "Inicio — Marketing Hub";
    else if (mainView === "inbox") title = "Bandeja de entrada — Marketing Hub";
    else if (mainView === "page") {
      const page = pages.find((p) => p.id === activePageId);
      title = page ? `${page.title} — Marketing Hub` : "Página — Marketing Hub";
    } else if (mainView === "board") {
      const board = boards.find((b) => b.id === activeBoardId);
      const name = board?.name ?? "Board";
      if (viewMode === "tabla") title = `${name} (Tabla) — Marketing Hub`;
      else if (viewMode === "calendario") title = `${name} (Calendario) — Marketing Hub`;
      else if (viewMode === "galeria") title = `${name} (Galería) — Marketing Hub`;
      else if (viewMode === "timeline") title = `${name} (Timeline) — Marketing Hub`;
      else title = `${name} — Marketing Hub`;
    }
    document.title = title;
  }, [mainView, activePageId, pages, activeBoardId, boards, viewMode]);

  if (dataLoading && !serverLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando datos del workspace...</p>
        </div>
      </div>
    );
  }

  if (loadError && !serverLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <p className="text-4xl">&#9888;&#65039;</p>
          <p className="text-sm font-medium">No se pudo conectar con el servidor</p>
          <p className="text-xs text-muted-foreground">Verifica tu conexión e intenta de nuevo</p>
          <button
            onClick={() => workspaceId && loadAllData(workspaceId)}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile or focus mode */}
      {!focusMode && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && !focusMode && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full w-72">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-border md:hidden", focusMode && "hidden")}>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold truncate">Marketing Hub</span>
        </div>

        <div key={mainView} className="flex flex-1 flex-col overflow-hidden animate-view-in">
          {mainView === "dashboard" && <Dashboard />}
          {mainView === "board" && <BoardView />}
          {mainView === "page" && <PageEditor />}
          {mainView === "inbox" && <InboxView />}
        </div>
      </main>
      <TaskDetail />
      <NewTaskDialog />
      <NewBoardDialog />
      <SettingsDialog />
      <CommandPalette />
      <KeyboardShortcuts />
      <GlobalShortcuts />
      <Onboarding />
      <ChatWidget />
    </div>
  );
}
