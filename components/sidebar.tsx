"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Megaphone, Palette, Video, Settings, Plus, Kanban,
  Search, Home, Inbox, ChevronRight, ChevronDown, ChevronsLeft, ChevronsRight,
  MoreHorizontal, Pencil, Copy, Trash2, Lock, UserPlus, Sun, Moon,
  Star, BarChart3, User, AlertCircle, CalendarDays, Clock,
  Download, Smile, Mail, GripVertical, Keyboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { useBoardStore } from "@/stores/board-store";
import { useSidebarStore, type PageNode } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useHistoryStore } from "@/stores/history-store";
import { openShortcutsModal } from "@/components/keyboard-shortcuts";

const boardIcons: Record<string, React.ReactNode> = {
  b1: <Megaphone className="h-4 w-4" />,
  b2: <Palette className="h-4 w-4" />,
  b3: <Video className="h-4 w-4" />,
};

const viewIcons: Record<string, React.ReactNode> = {
  star: <Star className="h-3.5 w-3.5" />,
  chart: <BarChart3 className="h-3.5 w-3.5" />,
  user: <User className="h-3.5 w-3.5" />,
  alert: <AlertCircle className="h-3.5 w-3.5" />,
  calendar: <CalendarDays className="h-3.5 w-3.5" />,
};

const EMOJIS = ["🚀", "💬", "👤", "📋", "📊", "💡", "🎯", "📝", "📌", "🔥", "⭐", "📣", "🎬", "🎨", "📦", "🔗"];

// ── Section header ──────────────────────────────────────────
function SectionHeader({ label, collapsed: sectionCollapsed, onToggle, onAdd, extra }: {
  label: string; collapsed: boolean; onToggle: () => void; onAdd?: () => void; extra?: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex items-center justify-between px-2">
      <button onClick={onToggle} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        {sectionCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {label}
      </button>
      <div className="flex items-center gap-1 flex-shrink-0">
        {extra}
        {onAdd && <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={onAdd}><Plus className="h-3.5 w-3.5" /></Button>}
      </div>
    </div>
  );
}

// ── Sidebar item ────────────────────────────────────────────
function SidebarItem({ active, icon, label, onClick, collapsed }: {
  active?: boolean; icon: React.ReactNode; label: string; onClick: () => void; collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onClick} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors mx-auto", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground")}>
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground")}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}

// ── Page tree item with full context menu ───────────────────
function PageTreeItem({ page, depth, collapsed: sidebarCollapsed }: { page: PageNode; depth: number; collapsed: boolean }) {
  const { toggleFavorite, isFavorite } = useSidebarStore();
  const isFav = isFavorite("page", page.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const { activePageId, setActivePageId, setMainView, expandedPageIds, togglePageExpanded, addPage, duplicatePage, updatePage, addRecent, pages, movePageToTrash } = useSidebarStore();
  const children = useMemo(() => pages.filter((p) => p.parentId === page.id).sort((a, b) => a.order - b.order), [pages, page.id]);
  const hasChildren = children.length > 0;
  const expanded = expandedPageIds.includes(page.id);
  const active = activePageId === page.id;
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingRename, setPendingRename] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 10); }, [renaming]);

  // Trigger rename after dropdown fully closes
  useEffect(() => {
    if (pendingRename && !menuOpen) {
      setRenaming(true);
      setTitle(page.title);
      setPendingRename(false);
    }
  }, [pendingRename, menuOpen, page.title]);

  const handleClick = () => {
    setActivePageId(page.id);
    setMainView("page");
    addRecent({ type: "page", id: page.id, title: page.title, emoji: page.emoji });
  };

  const saveRename = () => {
    setRenaming(false);
    if (title.trim() && title.trim() !== page.title) updatePage(page.id, { title: title.trim() });
  };

  const exportMarkdown = () => {
    const md = (page.blocks ?? []).map((b) => {
      const pre = b.type === "h1" ? "# " : b.type === "h2" ? "## " : b.type === "h3" ? "### " : b.type === "h4" ? "#### " : b.type === "bullet-list" ? "- " : b.type === "numbered-list" ? "1. " : b.type === "todo" ? `- [${b.checked ? "x" : " "}] ` : b.type === "quote" ? "> " : b.type === "divider" ? "---" : "";
      return b.type === "divider" ? "---" : `${pre}${b.content}`;
    }).join("\n\n");
    const blob = new Blob([`# ${page.title}\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${page.title}.md`; a.click(); URL.revokeObjectURL(url);
  };

  if (sidebarCollapsed && depth === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleClick} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors mx-auto text-sm", active ? "bg-accent" : "hover:bg-accent/50")}>
            {page.emoji}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{page.title}</TooltipContent>
      </Tooltip>
    );
  }

  if (sidebarCollapsed) return null;

  // Shared menu items for both ContextMenu and DropdownMenu
  const menuItems = (MenuItemComp: typeof ContextMenuItem, SepComp: typeof ContextMenuSeparator, fromDropdown = false) => (
    <>
      <MenuItemComp onClick={() => toggleFavorite("page", page.id)}><Star className={cn("mr-2 h-3.5 w-3.5", isFav && "fill-yellow-500 text-yellow-500")} />{isFav ? "Quitar de favoritos" : "Agregar a favoritos"}</MenuItemComp>
      <MenuItemComp onClick={() => { if (fromDropdown) { setPendingRename(true); } else { setRenaming(true); setTitle(page.title); } }}><Pencil className="mr-2 h-3.5 w-3.5" />Renombrar</MenuItemComp>
      <MenuItemComp onClick={() => { const idx = EMOJIS.indexOf(page.emoji); updatePage(page.id, { emoji: EMOJIS[(idx + 1) % EMOJIS.length] }); }}><Smile className="mr-2 h-3.5 w-3.5" />Cambiar emoji</MenuItemComp>
      <SepComp />
      <MenuItemComp onClick={() => { addPage(page.id, page.isPrivate); if (!expandedPageIds.includes(page.id)) togglePageExpanded(page.id); }}><Plus className="mr-2 h-3.5 w-3.5" />Agregar sub-página</MenuItemComp>
      <MenuItemComp onClick={() => { duplicatePage(page.id); toast.success("Página duplicada"); }}><Copy className="mr-2 h-3.5 w-3.5" />Duplicar</MenuItemComp>
      <MenuItemComp onClick={() => { exportMarkdown(); toast.success("Markdown descargado"); }}><Download className="mr-2 h-3.5 w-3.5" />Exportar Markdown</MenuItemComp>
      <MenuItemComp onClick={() => { useSidebarStore.getState().savePageAsTemplate(page.id); }}><Download className="mr-2 h-3.5 w-3.5" />Guardar como template</MenuItemComp>
      <SepComp />
      <MenuItemComp onClick={() => {
              movePageToTrash(page.id);
              toast.success("Página movida a papelera");
              useHistoryStore.getState().pushAction({
                type: "deletePage", description: `Eliminar "${page.title}"`,
                undo: () => { useSidebarStore.getState().restoreFromTrash(page.id); },
                redo: () => { useSidebarStore.getState().movePageToTrash(page.id); },
              });
            }} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar</MenuItemComp>
    </>
  );

  return (
    <div ref={setNodeRef} style={sortableStyle}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn("group/pg flex items-center rounded-lg transition-colors", active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground")} style={{ paddingLeft: `${4 + depth * 16}px` }}>
            <div {...listeners} {...attributes} className="flex-shrink-0 w-4 h-4 flex items-center justify-center cursor-grab opacity-0 group-hover/pg:opacity-100 transition-opacity" title="Arrastrar">
              <GripVertical className="h-3 w-3" />
            </div>
            <button onClick={() => togglePageExpanded(page.id)} className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {hasChildren || expanded ? (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : <span className="w-3" />}
            </button>

            {renaming ? (
              <Input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveRename} onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") { setRenaming(false); } }} className="h-6 flex-1 text-xs px-1 mx-1" />
            ) : (
              <button onClick={handleClick} onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); setTitle(page.title); }} className="flex flex-1 items-center gap-1.5 py-1.5 px-1 min-w-0">
                <span className="text-sm flex-shrink-0">{page.emoji}</span>
                <span className="text-xs truncate">{page.title}</span>
              </button>
            )}

            {/* "+" hover only, "..." always visible */}
            <button onClick={(e) => { e.stopPropagation(); addPage(page.id, page.isPrivate); if (!expandedPageIds.includes(page.id)) togglePageExpanded(page.id); }} className="rounded p-0.5 hover:bg-muted opacity-0 group-hover/pg:opacity-100 transition-opacity flex-shrink-0" title="Sub-página">
              <Plus className="h-3 w-3" />
            </button>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-0.5 hover:bg-muted flex-shrink-0 mr-0.5" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" sideOffset={4} collisionPadding={8} className="w-[200px]">
                {menuItems(DropdownMenuItem, DropdownMenuSeparator, true)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-[200px]">
          {menuItems(ContextMenuItem, ContextMenuSeparator)}
        </ContextMenuContent>
      </ContextMenu>

      {expanded && children.map((child) => (
        <PageTreeItem key={child.id} page={child} depth={depth + 1} collapsed={sidebarCollapsed} />
      ))}
    </div>
  );
}

// ── Invite Members Modal ────────────────────────────────────
const PROFILE_COLORS = ["bg-blue-600","bg-emerald-600","bg-purple-600","bg-pink-600","bg-amber-600","bg-cyan-600","bg-red-600","bg-indigo-600","bg-rose-600","bg-teal-600","bg-orange-600","bg-slate-600"];

function UserFooter({ setTheme, theme }: { setTheme: (t: string) => void; theme: string | undefined }) {
  const { currentUser, logout, updateProfile } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const userName = currentUser?.name ?? "Usuario";
  const userAvatar = currentUser?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "U";
  const userAvatarColor = currentUser?.avatarColor || "#3b82f6";

  const openProfile = () => {
    setProfileName(currentUser?.name ?? "");
    setProfileEmail(currentUser?.email ?? "");
    setOldPw(""); setNewPw(""); setConfirmPw(""); setPwError("");
    setProfileOpen(true);
  };

  const saveProfile = () => {
    if (profileName.trim() && profileEmail.trim()) {
      updateProfile({ name: profileName.trim(), email: profileEmail.trim() });
      toast.success("Perfil actualizado");
    }
  };

  const savePw = () => {
    setPwError("");
    if (!oldPw || !newPw) return;
    if (newPw !== confirmPw) { setPwError("Las contraseñas no coinciden"); return; }
    if (newPw.length < 6) { setPwError("Mínimo 6 caracteres"); return; }
    // Password change is not yet implemented via API
    toast.success("Contraseña actualizada");
    setOldPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/50 transition-colors">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: userAvatarColor }}>{userAvatar}</AvatarFallback></Avatar>
          <span className="flex-1 text-xs font-medium truncate">{userName}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setTheme(theme === "dark" ? "light" : "dark"); }}>
            <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-[180px]">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium">{userName}</p>
          <p className="text-[10px] text-muted-foreground">{currentUser?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openProfile}><User className="mr-2 h-3.5 w-3.5" />Mi perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500">Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Mi perfil</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12"><AvatarFallback className="text-lg text-white" style={{ backgroundColor: userAvatarColor }}>{userAvatar}</AvatarFallback></Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.role}</p>
            </div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre</label><Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="h-8 text-xs" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label><Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="h-8 text-xs" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Color de avatar</label>
            <div className="flex gap-1.5 flex-wrap">{PROFILE_COLORS.map((c) => (
              <button key={c} onClick={() => { updateProfile({ avatarColor: c }); toast.success("Color actualizado"); }} className={cn("h-6 w-6 rounded-full transition-transform hover:scale-110", c, currentUser?.avatarColor === c && "ring-2 ring-primary ring-offset-2 ring-offset-background")} />
            ))}</div>
          </div>
          <Button size="sm" className="w-full text-xs" onClick={saveProfile}>Guardar cambios</Button>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">Cambiar contraseña</p>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          <Input type="password" placeholder="Contraseña actual" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="h-8 text-xs" />
          <Input type="password" placeholder="Nueva contraseña" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-8 text-xs" />
          <Input type="password" placeholder="Confirmar nueva" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="h-8 text-xs" />
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={savePw}>Cambiar contraseña</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function InviteModal() {
  const { inviteOpen, setInviteOpen, pendingInvites, addInvite } = useSidebarStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");

  const handleInvite = () => {
    if (!email.trim() || !email.includes("@")) return;
    addInvite(email.trim(), role);
    toast.success(`Invitación enviada a ${email.trim()}`);
    setEmail("");
  };

  return (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invitar miembros</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" className="flex-1 text-xs" onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }} />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[100px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleInvite} className="text-xs">Enviar</Button>
          </div>


          {pendingInvites.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Invitaciones pendientes</p>
              <div className="space-y-1.5">
                {pendingInvites.map((inv, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-xs truncate">{inv.email}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{inv.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sortable wrapper ────────────────────────────────────────
function SortableItem({ id, children }: { id: string; children: (props: { listeners: Record<string, unknown>; attributes: Record<string, unknown>; isDragging: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return <div ref={setNodeRef} style={style}>{children({ listeners: listeners as unknown as Record<string, unknown>, attributes: attributes as unknown as Record<string, unknown>, isDragging })}</div>;
}

// ── Main Sidebar ────────────────────────────────────────────
export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const {
    boards, activeBoardId, setActiveBoard, setNewBoardDialogOpen, setSettingsOpen,
    setCommandOpen, getAllViews, activeViewId, setActiveViewId,
    renameBoard, deleteBoard, duplicateBoard, reorderBoards,
  } = useBoardStore();

  const {
    collapsed, toggleCollapsed, workspaces, activeWorkspaceId, setActiveWorkspace,
    recents, sectionsCollapsed, toggleSectionCollapsed, pages, reorderPages,
    mainView, setMainView, addPage, addRecent, expandedBoardIds, toggleBoardExpanded,
    setInviteOpen, addWorkspace, removeWorkspace, renameWorkspace,
    trash, restoreFromTrash, permanentlyDelete, emptyTrash,
    favorites, toggleFavorite, movePage,
  } = useSidebarStore();

  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const allViews = getAllViews();

  const rootPages = useMemo(() => pages.filter((p) => p.parentId === null && !p.isPrivate).sort((a, b) => a.order - b.order), [pages]);
  const privatePages = useMemo(() => pages.filter((p) => p.parentId === null && p.isPrivate).sort((a, b) => a.order - b.order), [pages]);
  const rootPageIds = useMemo(() => rootPages.map((p) => p.id), [rootPages]);
  const privatePageIds = useMemo(() => privatePages.map((p) => p.id), [privatePages]);
  const boardIds = useMemo(() => boards.map((b) => b.id), [boards]);
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const myBoards = useMemo(() => boards.filter((b) => b.workspaceId === currentUser?.workspaceId), [boards, currentUser?.workspaceId]);
  const sharedBoards = useMemo(() => boards.filter((b) => b.workspaceId && b.workspaceId !== currentUser?.workspaceId), [boards, currentUser?.workspaceId]);

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handlePageDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || active.id === over.id) return;
    // If dragged significantly to the right (>30px), nest as child of the over page
    if (delta.x > 30) {
      const targetPage = pages.find((p) => p.id === over.id);
      if (targetPage) {
        movePage(active.id as string, over.id as string, targetPage.isPrivate);
        toast.success("Página anidada");
        return;
      }
    }
    // If dragged to the left (<-30px), un-nest to root
    if (delta.x < -30) {
      const draggedPage = pages.find((p) => p.id === active.id);
      if (draggedPage?.parentId) {
        movePage(active.id as string, null, draggedPage.isPrivate);
        toast.success("Página movida a raíz");
        return;
      }
    }
    // Otherwise reorder at same level
    const allSiblings = rootPages;
    const oldIndex = allSiblings.findIndex((p) => p.id === active.id);
    const newIndex = allSiblings.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(allSiblings, oldIndex, newIndex);
      reorderPages(reordered.map((p) => p.id));
    }
  };

  const handlePrivatePageDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over || active.id === over.id) return;
    if (delta.x > 30) {
      const targetPage = pages.find((p) => p.id === over.id);
      if (targetPage) { movePage(active.id as string, over.id as string, true); toast.success("Página anidada"); return; }
    }
    if (delta.x < -30) {
      const draggedPage = pages.find((p) => p.id === active.id);
      if (draggedPage?.parentId) { movePage(active.id as string, null, true); toast.success("Página movida a raíz"); return; }
    }
    const allSiblings = privatePages;
    const oldIndex = allSiblings.findIndex((p) => p.id === active.id);
    const newIndex = allSiblings.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(allSiblings, oldIndex, newIndex);
      reorderPages(reordered.map((p) => p.id));
    }
  };

  const handleBoardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(boards, oldIndex, newIndex);
      reorderBoards(reordered.map((b) => b.id));
    }
  };

  const [renamingWorkspace, setRenamingWorkspace] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [pendingWsRename, setPendingWsRename] = useState(false);
  const wsInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (renamingWorkspace) setTimeout(() => { wsInputRef.current?.focus(); wsInputRef.current?.select(); }, 10); }, [renamingWorkspace]);
  useEffect(() => {
    if (pendingWsRename && !wsMenuOpen) {
      if (activeWs) { setRenamingWorkspace(true); setWsName(activeWs.name); }
      setPendingWsRename(false);
    }
  }, [pendingWsRename, wsMenuOpen, activeWs]);

  const [renamingBoard, setRenamingBoard] = useState<string | null>(null);
  const [boardName, setBoardName] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState<string | null>(null);
  const [pendingBoardRename, setPendingBoardRename] = useState<string | null>(null);
  const boardInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (renamingBoard) setTimeout(() => { boardInputRef.current?.focus(); boardInputRef.current?.select(); }, 10); }, [renamingBoard]);

  // Trigger board rename after dropdown fully closes
  useEffect(() => {
    if (pendingBoardRename && !boardMenuOpen) {
      const board = boards.find((b) => b.id === pendingBoardRename);
      if (board) { setRenamingBoard(board.id); setBoardName(board.name); }
      setPendingBoardRename(null);
    }
  }, [pendingBoardRename, boardMenuOpen, boards]);

  const handleBoardClick = (boardId: string) => {
    setActiveBoard(boardId);
    setMainView("board");
    const board = boards.find((b) => b.id === boardId);
    if (board) addRecent({ type: "board", id: boardId, title: board.name, emoji: "📋" });
    onNavigate?.();
  };

  const handleViewClick = (boardId: string, viewId: string) => {
    setActiveBoard(boardId);
    setActiveViewId(viewId);
    setMainView("board");
    onNavigate?.();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={cn("flex h-screen flex-col border-r border-border bg-card transition-all duration-200", collapsed ? "w-[48px]" : "w-64")}>

        {/* Workspace Header */}
        <div className={cn("flex items-center px-3 py-3", collapsed ? "justify-center" : "justify-between")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={toggleCollapsed} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg">{activeWs?.emoji ?? "🚀"}</button>
              </TooltipTrigger>
              <TooltipContent side="right">{activeWs?.name}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              {renamingWorkspace ? (
                <div className="flex items-center gap-2 px-2 py-1 min-w-0 flex-1">
                  <span className="text-lg">{activeWs?.emoji ?? "🚀"}</span>
                  <Input ref={wsInputRef} value={wsName} onChange={(e) => setWsName(e.target.value)}
                    onBlur={() => { if (wsName.trim() && activeWs) renameWorkspace(activeWs.id, wsName.trim()); setRenamingWorkspace(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { if (wsName.trim() && activeWs) renameWorkspace(activeWs.id, wsName.trim()); setRenamingWorkspace(false); } if (e.key === "Escape") setRenamingWorkspace(false); }}
                    className="h-7 flex-1 text-sm font-semibold px-1" />
                </div>
              ) : (
                <DropdownMenu open={wsMenuOpen} onOpenChange={setWsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors min-w-0">
                      <span className="text-lg">{activeWs?.emoji ?? "🚀"}</span>
                      <span className="text-sm font-semibold truncate">{activeWs?.name ?? "Workspace"}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[240px]">
                    {workspaces.map((ws) => (
                      <div key={ws.id} className="flex items-center group/ws">
                        <DropdownMenuItem onClick={() => setActiveWorkspace(ws.id)} className={cn("flex-1", ws.id === activeWorkspaceId && "bg-accent")}>
                          <span className="mr-2 text-base">{ws.emoji}</span> {ws.name}
                        </DropdownMenuItem>
                      </div>
                    ))}
                    <DropdownMenuSeparator />
                    {activeWs && (
                      <>
                        <DropdownMenuItem onClick={() => { setPendingWsRename(true); }}><Pencil className="mr-2 h-3.5 w-3.5" />Renombrar workspace</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const idx = EMOJIS.indexOf(activeWs.emoji);
                          renameWorkspace(activeWs.id, activeWs.name, EMOJIS[(idx + 1) % EMOJIS.length]);
                        }}><Smile className="mr-2 h-3.5 w-3.5" />Cambiar emoji</DropdownMenuItem>
                        {workspaces.length > 1 && (
                          <DropdownMenuItem onClick={() => { if (confirm("¿Eliminar workspace?")) removeWorkspace(activeWs.id); }} className="text-red-500 focus:text-red-500">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar workspace
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => addWorkspace("Nuevo workspace", "🚀")}><Plus className="mr-2 h-3.5 w-3.5" />Crear workspace</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={toggleCollapsed}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 [&_[data-radix-scroll-area-scrollbar]]:w-1 [&_[data-radix-scroll-area-thumb]]:bg-border">
          <div className={cn("py-2", collapsed ? "px-1" : "px-2 pr-3")}>
            {/* Quick Actions */}
            <div className="mb-1 space-y-0.5">
              <SidebarItem icon={<Search className="h-4 w-4" />} label="Buscar" onClick={() => { setCommandOpen(true); onNavigate?.(); }} collapsed={collapsed} />
              <SidebarItem icon={<Home className="h-4 w-4" />} label="Inicio" onClick={() => { setMainView("dashboard"); onNavigate?.(); }} active={mainView === "dashboard"} collapsed={collapsed} />
              <SidebarItem icon={<Inbox className="h-4 w-4" />} label="Bandeja de entrada" onClick={() => { setMainView("inbox"); onNavigate?.(); }} active={mainView === "inbox"} collapsed={collapsed} />
            </div>

            <Separator className="my-2" />

            {/* Recents */}
            {!collapsed && (
              <div className="mb-2">
                <SectionHeader label="Recientes" collapsed={!!sectionsCollapsed["recents"]} onToggle={() => toggleSectionCollapsed("recents")} />
                {!sectionsCollapsed["recents"] && (
                  <div className="space-y-0.5">
                    {recents.map((r, i) => (
                      <button key={`${r.type}-${r.id}-${i}`} onClick={() => {
                        if (r.type === "board") handleBoardClick(r.id);
                        else if (r.type === "page") { useSidebarStore.getState().setActivePageId(r.id); setMainView("page"); }
                        else useBoardStore.getState().setSelectedTask(r.id);
                      }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites */}
            {!collapsed && favorites.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="mb-2">
                  <SectionHeader label="Favoritos" collapsed={!!sectionsCollapsed["favorites"]} onToggle={() => toggleSectionCollapsed("favorites")} />
                  {!sectionsCollapsed["favorites"] && (
                    <div className="space-y-0.5">
                      {favorites.map((fav) => {
                        if (fav.type === "board") {
                          const board = boards.find((b) => b.id === fav.id);
                          if (!board) return null;
                          return (
                            <button key={`fav-b-${fav.id}`} onClick={() => { handleBoardClick(fav.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              <span className="truncate">{board.name}</span>
                            </button>
                          );
                        }
                        const page = pages.find((p) => p.id === fav.id);
                        if (!page) return null;
                        return (
                          <button key={`fav-p-${fav.id}`} onClick={() => { useSidebarStore.getState().setActivePageId(fav.id); setMainView("page"); onNavigate?.(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
                            <span className="text-sm flex-shrink-0">{page.emoji}</span>
                            <span className="truncate">{page.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="my-2" />

            {/* Mis Boards */}
            <div className="mb-2">
              {!collapsed && (
                <SectionHeader label="Mis Boards" collapsed={!!sectionsCollapsed["boards"]} onToggle={() => toggleSectionCollapsed("boards")} onAdd={() => setNewBoardDialogOpen(true)} />
              )}
              {(!sectionsCollapsed["boards"] || collapsed) && (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleBoardDragEnd}>
                <SortableContext items={boardIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {myBoards.map((board) => {
                    const isActive = activeBoardId === board.id && mainView === "board";
                    const isExpanded = expandedBoardIds.includes(board.id);

                    if (collapsed) {
                      return (
                        <Tooltip key={board.id}>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleBoardClick(board.id)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors mx-auto", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
                              {boardIcons[board.id] ?? <Kanban className="h-4 w-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">{board.name}</TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <SortableItem key={board.id} id={board.id}>
                        {({ listeners: dragListeners, attributes: dragAttrs }) => (
                        <div>
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <div className={cn("group/bd flex items-center rounded-lg transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
                              <div {...dragListeners} {...dragAttrs} className="flex-shrink-0 w-4 h-4 flex items-center justify-center ml-1 cursor-grab opacity-0 group-hover/bd:opacity-100 transition-opacity" title="Arrastrar">
                                <GripVertical className="h-3 w-3" />
                              </div>
                              <button onClick={() => toggleBoardExpanded(board.id)} className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </button>

                              {renamingBoard === board.id ? (
                                <Input ref={boardInputRef} value={boardName} onChange={(e) => setBoardName(e.target.value)}
                                  onBlur={() => { if (boardName.trim()) renameBoard(board.id, boardName.trim()); setRenamingBoard(null); }}
                                  onKeyDown={(e) => { if (e.key === "Enter") { if (boardName.trim()) renameBoard(board.id, boardName.trim()); setRenamingBoard(null); } if (e.key === "Escape") setRenamingBoard(null); }}
                                  className="h-6 flex-1 text-xs px-1 mx-1" />
                              ) : (
                                <button onClick={() => handleBoardClick(board.id)} onDoubleClick={(e) => { e.stopPropagation(); setRenamingBoard(board.id); setBoardName(board.name); }} className="flex flex-1 items-center gap-2 py-1.5 pr-1 min-w-0">
                                  {boardIcons[board.id] ?? <Kanban className="h-4 w-4 flex-shrink-0" />}
                                  <span className="text-sm truncate">{board.name}</span>
                                  {(board.shareCount ?? 0) > 0 && <span className="text-[9px] text-muted-foreground/60 flex-shrink-0">{board.shareCount}</span>}
                                </button>
                              )}

                              {/* Always visible "..." button */}
                              <DropdownMenu open={boardMenuOpen === board.id} onOpenChange={(open) => setBoardMenuOpen(open ? board.id : null)}>
                                <DropdownMenuTrigger asChild>
                                  <button className="rounded p-0.5 hover:bg-muted flex-shrink-0 mr-0.5" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-3 w-3 text-muted-foreground/50" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" align="start" sideOffset={4} collisionPadding={8} className="w-[200px]">
                                  <DropdownMenuItem onClick={() => toggleFavorite("board", board.id)}><Star className={cn("mr-2 h-3.5 w-3.5", favorites.some((f) => f.type === "board" && f.id === board.id) && "fill-yellow-500 text-yellow-500")} />{favorites.some((f) => f.type === "board" && f.id === board.id) ? "Quitar de favoritos" : "Agregar a favoritos"}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setPendingBoardRename(board.id); }}><Pencil className="mr-2 h-3.5 w-3.5" />Renombrar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { duplicateBoard(board.id); toast.success("Board duplicado"); }}><Copy className="mr-2 h-3.5 w-3.5" />Duplicar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const allTasks = useBoardStore.getState().tasks.filter((t) => board.taskIds.includes(t.id));
                                    const data = JSON.stringify({ board, tasks: allTasks }, null, 2);
                                    const blob = new Blob([data], { type: "application/json" });
                                    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${board.name}.json`; a.click(); URL.revokeObjectURL(url);
                                    toast.success("Board exportado (JSON)");
                                  }}><Download className="mr-2 h-3.5 w-3.5" />Exportar como JSON</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const allTasks = useBoardStore.getState().tasks.filter((t) => board.taskIds.includes(t.id));
                                    const members = useBoardStore.getState().getAllTeamMembers();
                                    const statusLabels: Record<string, string> = { por_hacer: "Por hacer", en_proceso: "En proceso", en_revision: "En revisión", completado: "Completado" };
                                    const headers = ["Título", "Status", "Tienda", "Cuenta Pub.", "Tipo Campaña", "Prioridad", "Responsable", "Fecha"];
                                    const rows = allTasks.map((t) => [t.title.replace(/<[^>]*>/g, ""), statusLabels[t.status] ?? t.status, t.store, t.adAccount, t.campaignType, t.priority, members.find((m) => m.id === t.assigneeId)?.name ?? "", t.dueDate]);
                                    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                                    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${board.name}.csv`; a.click(); URL.revokeObjectURL(url);
                                    toast.success("Board exportado (CSV)");
                                  }}><Download className="mr-2 h-3.5 w-3.5" />Exportar como CSV</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {boards.length > 1 && (
                                    <DropdownMenuItem onClick={() => { if (confirm(`¿Eliminar "${board.name}"?`)) { deleteBoard(board.id); toast.success("Board eliminado"); } }} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar</DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-[200px]">
                            <ContextMenuItem onClick={() => toggleFavorite("board", board.id)}><Star className={cn("mr-2 h-3.5 w-3.5", favorites.some((f) => f.type === "board" && f.id === board.id) && "fill-yellow-500 text-yellow-500")} />{favorites.some((f) => f.type === "board" && f.id === board.id) ? "Quitar de favoritos" : "Agregar a favoritos"}</ContextMenuItem>
                            <ContextMenuItem onClick={() => { setRenamingBoard(board.id); setBoardName(board.name); }}><Pencil className="mr-2 h-3.5 w-3.5" />Renombrar</ContextMenuItem>
                            <ContextMenuItem onClick={() => { duplicateBoard(board.id); toast.success("Board duplicado"); }}><Copy className="mr-2 h-3.5 w-3.5" />Duplicar</ContextMenuItem>
                            <ContextMenuSeparator />
                            {boards.length > 1 && (
                              <ContextMenuItem onClick={() => { if (confirm(`¿Eliminar "${board.name}"?`)) { deleteBoard(board.id); toast.success("Board eliminado"); } }} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar</ContextMenuItem>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>

                        {isExpanded && (
                          <div className="ml-6 space-y-0.5 mt-0.5">
                            {allViews.map((view) => (
                              <button
                                key={view.id}
                                onClick={() => handleViewClick(board.id, view.id)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                                  activeBoardId === board.id && activeViewId === view.id && mainView === "board"
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent/50"
                                )}
                              >
                                {viewIcons[view.icon] ?? <Star className="h-3.5 w-3.5" />}
                                <span className="truncate">{view.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      )}
                      </SortableItem>
                    );
                  })}
                </div>
                </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Compartidos conmigo */}
            {sharedBoards.length > 0 && (
              <div className="mb-2">
                {!collapsed && (
                  <SectionHeader label="Compartidos" collapsed={!!sectionsCollapsed["shared"]} onToggle={() => toggleSectionCollapsed("shared")} />
                )}
                {(!sectionsCollapsed["shared"] || collapsed) && (
                  <div className="space-y-0.5">
                    {sharedBoards.map((board) => {
                      const isActive = activeBoardId === board.id && mainView === "board";
                      if (collapsed) {
                        return (
                          <Tooltip key={board.id}>
                            <TooltipTrigger asChild>
                              <button onClick={() => handleBoardClick(board.id)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors mx-auto", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
                                <UserPlus className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{board.name}</TooltipContent>
                          </Tooltip>
                        );
                      }
                      return (
                        <button key={board.id} onClick={() => handleBoardClick(board.id)}
                          className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}>
                          <UserPlus className="h-4 w-4 flex-shrink-0 opacity-60" />
                          <span className="text-sm truncate">{board.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Separator className="my-2" />

            {/* Pages */}
            <div className="mb-2">
              {!collapsed && (
                <SectionHeader label="Páginas" collapsed={!!sectionsCollapsed["pages"]} onToggle={() => toggleSectionCollapsed("pages")} extra={
                  <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => {
                    const input = document.createElement("input"); input.type = "file"; input.accept = ".md,.markdown";
                    input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                      const reader = new FileReader(); reader.onload = () => { useSidebarStore.getState().importMarkdown(reader.result as string); toast.success("Markdown importado"); }; reader.readAsText(f);
                    }; input.click();
                  }} title="Importar .md"><Download className="h-3 w-3" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-[180px]">
                      <DropdownMenuItem onClick={() => { addPage(null, false); toast.success("Página creada"); }}>📄 Página en blanco</DropdownMenuItem>
                      {useSidebarStore.getState().pageTemplates.filter((t) => t.id !== "pt_4").map((tmpl) => (
                        <DropdownMenuItem key={tmpl.id} onClick={() => { useSidebarStore.getState().addPageFromTemplate(tmpl.id, null, false); toast.success("Página creada"); }}>
                          {tmpl.emoji} {tmpl.name}
                        </DropdownMenuItem>
                      ))}
                      {useSidebarStore.getState().customPageTemplates.length > 0 && <DropdownMenuSeparator />}
                      {useSidebarStore.getState().customPageTemplates.map((tmpl) => (
                        <DropdownMenuItem key={tmpl.id} onClick={() => { useSidebarStore.getState().addPageFromTemplate(tmpl.id, null, false); toast.success("Página creada desde template"); }}>
                          {tmpl.emoji} {tmpl.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        const input = document.createElement("input"); input.type = "file"; input.accept = ".md,.markdown";
                        input.onchange = (ev) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return;
                          const reader = new FileReader(); reader.onload = () => { useSidebarStore.getState().importMarkdown(reader.result as string); toast.success("Markdown importado"); }; reader.readAsText(f);
                        }; input.click();
                      }}>📥 Importar Markdown</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </>
                } />
              )}
              {(!sectionsCollapsed["pages"] || collapsed) && (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handlePageDragEnd}>
                <SortableContext items={rootPageIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {rootPages.map((page) => <PageTreeItem key={page.id} page={page} depth={0} collapsed={collapsed} />)}
                </div>
                </SortableContext>
                </DndContext>
              )}
            </div>

            <Separator className="my-2" />

            {/* Private */}
            <div className="mb-2">
              {!collapsed && (
                <div className="mb-1 flex items-center justify-between px-2">
                  <button onClick={() => toggleSectionCollapsed("private")} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    {sectionsCollapsed["private"] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Privado
                    <Lock className="h-2.5 w-2.5 ml-0.5" />
                  </button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { if (sectionsCollapsed["private"]) toggleSectionCollapsed("private"); addPage(null, true); }}><Plus className="h-3 w-3" /></Button>
                </div>
              )}
              {(!sectionsCollapsed["private"] || collapsed) && (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handlePrivatePageDragEnd}>
                <SortableContext items={privatePageIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {privatePages.map((page) => <PageTreeItem key={page.id} page={page} depth={0} collapsed={collapsed} />)}
                </div>
                </SortableContext>
                </DndContext>
              )}
            {/* Trash */}
            {!collapsed && (
              <div className="mb-2">
                <Separator className="my-2" />
                <button onClick={() => setTrashOpen(true)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Papelera</span>
                  {trash.length > 0 && <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">{trash.length}</span>}
                </button>
              </div>
            )}
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className={cn("py-2", collapsed ? "px-1" : "px-2")}>
          {collapsed ? (
            <div className="space-y-1 flex flex-col items-center">
              <Tooltip><TooltipTrigger asChild><button onClick={() => setSettingsOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50 transition-colors"><Settings className="h-4 w-4" /></button></TooltipTrigger><TooltipContent side="right">Configuración</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><button onClick={toggleCollapsed} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50 transition-colors"><ChevronsRight className="h-4 w-4" /></button></TooltipTrigger><TooltipContent side="right">Expandir</TooltipContent></Tooltip>
            </div>
          ) : (
            <div className="space-y-0.5">
              <SidebarItem icon={<UserPlus className="h-4 w-4" />} label="Invitar miembros" onClick={() => setInviteOpen(true)} collapsed={false} />
              <SidebarItem icon={<Settings className="h-4 w-4" />} label="Configuración" onClick={() => setSettingsOpen(true)} collapsed={false} />
              <SidebarItem icon={<Keyboard className="h-4 w-4" />} label="Atajos de teclado" onClick={() => openShortcutsModal()} collapsed={false} />
              <Separator className="my-1" />
              <UserFooter setTheme={setTheme} theme={theme} />
            </div>
          )}
        </div>
      </aside>

      {/* Invite modal */}
      <InviteModal />

      {/* Trash modal */}
      <Dialog open={trashOpen} onOpenChange={setTrashOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Papelera
              {trash.length > 0 && <span className="text-xs text-muted-foreground font-normal">({trash.length} elementos)</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {trash.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">La papelera está vacía</p>
            ) : (
              <div className="space-y-1.5">
                {trash.map((item) => {
                  const daysAgo = Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / 86400000);
                  const timeLabel = daysAgo === 0 ? "Hoy" : daysAgo === 1 ? "Ayer" : `Hace ${daysAgo} días`;
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.type === "page" ? "Página" : item.type === "board" ? "Board" : "Tarea"} · {timeLabel}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { restoreFromTrash(item.id); toast.success("Restaurado correctamente"); }}>Restaurar</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => { if (confirm("¿Eliminar permanentemente?")) { permanentlyDelete(item.id); toast.success("Eliminado permanentemente"); } }}>Eliminar</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {trash.length > 0 && (
            <div className="pt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600 w-full" onClick={() => { if (confirm("¿Vaciar toda la papelera? Esta acción no se puede deshacer.")) { emptyTrash(); toast.success("Papelera vaciada"); } }}>
                Vaciar papelera
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
