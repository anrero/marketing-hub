"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BlockType =
  | "text" | "h1" | "h2" | "h3" | "h4"
  | "bullet-list" | "numbered-list" | "todo" | "toggle"
  | "quote" | "callout" | "divider" | "code"
  | "image" | "video" | "file" | "bookmark"
  | "table" | "columns" | "page-link" | "mention" | "date"
  | "database-table" | "database-board" | "database-list" | "database-gallery" | "database-calendar"
  | "toc";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;        // todo blocks
  expanded?: boolean;       // toggle blocks
  language?: string;        // code blocks
  emoji?: string;           // callout blocks
  color?: string;           // callout blocks
  url?: string;             // image/video/file/bookmark blocks
  fileName?: string;        // file blocks
  fileSize?: string;        // file blocks
  tableData?: string[][];   // table blocks
  children?: Block[];       // toggle blocks (nested content)
  toggleContent?: string;   // toggle blocks (editable body text)
  columnContents?: string[]; // columns blocks (one string per column)
}

export interface PageNode {
  id: string;
  emoji: string;
  title: string;
  content: string;          // legacy plain text (unused when blocks exist)
  blocks: Block[];
  parentId: string | null;
  isPrivate: boolean;
  order: number;
  coverImage?: string | null;
}

export interface PageTemplate {
  id: string;
  name: string;
  emoji: string;
  blocks: Block[];
}

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
}

export interface TrashItem {
  id: string;
  type: "board" | "page" | "task";
  name: string;
  data: unknown;
  deletedAt: string;
}

interface SidebarState {
  collapsed: boolean;
  activeWorkspaceId: string;
  workspaces: Workspace[];
  pages: PageNode[];
  recents: { type: "board" | "task" | "page"; id: string; title: string; emoji: string }[];
  expandedBoardIds: string[];
  expandedPageIds: string[];
  sectionsCollapsed: Record<string, boolean>;
  activePageId: string | null;
  mainView: "board" | "dashboard" | "page" | "inbox";
  trash: TrashItem[];
  favorites: { type: "board" | "page"; id: string }[];
  _pagesLoaded: boolean;

  loadPagesFromServer: (workspaceId: string) => Promise<void>;
  loadWorkspacesFromServer: (workspaceId: string) => Promise<void>;
  toggleCollapsed: () => void;
  setActiveWorkspace: (id: string) => void;
  addRecent: (item: { type: "board" | "task" | "page"; id: string; title: string; emoji: string }) => void;
  toggleBoardExpanded: (id: string) => void;
  togglePageExpanded: (id: string) => void;
  toggleSectionCollapsed: (key: string) => void;
  setActivePageId: (id: string | null) => void;
  setMainView: (view: "board" | "dashboard" | "page" | "inbox") => void;
  addPage: (parentId: string | null, isPrivate: boolean) => string;
  updatePage: (id: string, updates: Partial<PageNode>) => void;
  removePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  movePage: (id: string, newParentId: string | null, isPrivate: boolean) => void;
  reorderPages: (pageIds: string[]) => void;
  addWorkspace: (name: string, emoji: string) => void;
  removeWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string, emoji?: string) => void;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
  pendingInvites: { email: string; role: string }[];
  addInvite: (email: string, role: string) => void;
  focusMode: boolean;
  setFocusMode: (mode: boolean) => void;
  toggleFavorite: (type: "board" | "page", id: string) => void;
  isFavorite: (type: "board" | "page", id: string) => boolean;
  movePageToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  pageTemplates: PageTemplate[];
  addPageFromTemplate: (templateId: string, parentId: string | null, isPrivate: boolean) => string;
  importMarkdown: (markdown: string) => string;
}

function b(id: string, type: BlockType, content: string, extra?: Partial<Block>): Block {
  return { id, type, content, ...extra };
}

// ── Transform API page to frontend PageNode ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformApiPage(apiPage: any): PageNode {
  return {
    id: apiPage.id,
    emoji: apiPage.emoji || "📄",
    title: apiPage.title || "Sin título",
    content: "",
    blocks: (apiPage.blocks || []).map((blk: { id: string; type: string; content: string; properties?: Record<string, unknown> }, i: number) => {
      const props = blk.properties || {};
      return {
        id: blk.id,
        type: (blk.type || "text") as BlockType,
        content: blk.content || "",
        checked: props.checked as boolean | undefined,
        expanded: props.expanded as boolean | undefined,
        language: props.language as string | undefined,
        emoji: props.emoji as string | undefined,
        color: props.color as string | undefined,
        url: props.url as string | undefined,
        fileName: props.fileName as string | undefined,
        fileSize: props.fileSize as string | undefined,
        tableData: props.tableData as string[][] | undefined,
        toggleContent: props.toggleContent as string | undefined,
        columnContents: props.columnContents as string[] | undefined,
      };
    }),
    parentId: apiPage.parentId || null,
    isPrivate: apiPage.isPrivate || false,
    order: apiPage.position ?? 0,
    coverImage: apiPage.coverImage || null,
  };
}

// ── API helpers ──

function apiUpdatePage(pageId: string, data: Record<string, unknown>) {
  fetch(`/api/pages/${pageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch((e) => console.error("API update page error:", e));
}

function apiDeletePage(pageId: string) {
  fetch(`/api/pages/${pageId}`, { method: "DELETE" }).catch((e) => console.error("API delete page error:", e));
}

export const useSidebarStore = create<SidebarState>()(persist((set, get) => ({
  collapsed: false,
  activeWorkspaceId: "",
  workspaces: [],
  pages: [],
  recents: [],
  expandedBoardIds: [],
  expandedPageIds: [],
  sectionsCollapsed: {},
  activePageId: null,
  mainView: "board",
  favorites: [],
  _pagesLoaded: false,

  // ── Load pages from server ──
  loadPagesFromServer: async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/pages?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const apiPages = await res.json();
      const pages = apiPages.map(transformApiPage);
      set({ pages, _pagesLoaded: true });
    } catch (e) {
      console.error("Error loading pages:", e);
    }
  },

  // ── Load workspace info from server ──
  loadWorkspacesFromServer: async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/workspace?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const ws = await res.json();
      set({
        workspaces: [{ id: ws.id, name: ws.name, emoji: ws.emoji }],
        activeWorkspaceId: ws.id,
      });
    } catch (e) {
      console.error("Error loading workspaces:", e);
    }
  },

  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  addRecent: (item) => set((s) => {
    const filtered = s.recents.filter((r) => !(r.type === item.type && r.id === item.id));
    return { recents: [item, ...filtered].slice(0, 5) };
  }),

  toggleBoardExpanded: (id) => set((s) => ({
    expandedBoardIds: s.expandedBoardIds.includes(id)
      ? s.expandedBoardIds.filter((x) => x !== id)
      : [...s.expandedBoardIds, id],
  })),

  togglePageExpanded: (id) => set((s) => ({
    expandedPageIds: s.expandedPageIds.includes(id)
      ? s.expandedPageIds.filter((x) => x !== id)
      : [...s.expandedPageIds, id],
  })),

  toggleSectionCollapsed: (key) => set((s) => ({
    sectionsCollapsed: { ...s.sectionsCollapsed, [key]: !s.sectionsCollapsed[key] },
  })),

  setActivePageId: (id) => set({ activePageId: id }),
  setMainView: (view) => set({ mainView: view }),

  addPage: (parentId, isPrivate) => {
    const id = `pg_${Date.now()}`;
    set((s) => ({
      pages: [...s.pages, { id, emoji: "📄", title: "Sin título", content: "", blocks: [{ id: `blk_${Date.now()}`, type: "text" as BlockType, content: "" }], parentId, isPrivate, order: s.pages.length }],
      activePageId: id,
      mainView: "page" as const,
    }));
    // Create on server
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    const workspaceId = authData?.state?.currentUser?.workspaceId;
    if (workspaceId) {
      fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, parentId, isPrivate }),
      }).then((r) => r.json()).then((saved) => {
        const serverPage = transformApiPage(saved);
        set((s) => ({
          pages: s.pages.map((p) => p.id === id ? serverPage : p),
          activePageId: s.activePageId === id ? saved.id : s.activePageId,
        }));
      }).catch((e) => console.error("API create page error:", e));
    }
    return id;
  },

  updatePage: (id, updates) => {
    set((s) => ({
      pages: s.pages.map((p) => p.id === id ? { ...p, ...updates } : p),
    }));
    // Persist to server
    const serverData: Record<string, unknown> = {};
    if (updates.title !== undefined) serverData.title = updates.title;
    if (updates.emoji !== undefined) serverData.emoji = updates.emoji;
    if (updates.coverImage !== undefined) serverData.coverImage = updates.coverImage;
    if (updates.isPrivate !== undefined) serverData.isPrivate = updates.isPrivate;
    if (updates.blocks !== undefined) {
      serverData.blocks = updates.blocks.map((blk) => ({
        type: blk.type,
        content: blk.content,
        properties: {
          ...(blk.checked !== undefined && { checked: blk.checked }),
          ...(blk.expanded !== undefined && { expanded: blk.expanded }),
          ...(blk.language && { language: blk.language }),
          ...(blk.emoji && { emoji: blk.emoji }),
          ...(blk.color && { color: blk.color }),
          ...(blk.url && { url: blk.url }),
          ...(blk.fileName && { fileName: blk.fileName }),
          ...(blk.fileSize && { fileSize: blk.fileSize }),
          ...(blk.tableData && { tableData: blk.tableData }),
          ...(blk.toggleContent && { toggleContent: blk.toggleContent }),
          ...(blk.columnContents && { columnContents: blk.columnContents }),
        },
      }));
    }
    if (Object.keys(serverData).length > 0) {
      apiUpdatePage(id, serverData);
    }
  },

  removePage: (id) => set((s) => {
    // Collect all descendant IDs recursively
    const toRemove = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of s.pages) {
        if (p.parentId && toRemove.has(p.parentId) && !toRemove.has(p.id)) {
          toRemove.add(p.id);
          changed = true;
        }
      }
    }
    // Delete each on server
    toRemove.forEach((pid) => apiDeletePage(pid));
    return {
      pages: s.pages.filter((p) => !toRemove.has(p.id)),
      activePageId: toRemove.has(s.activePageId ?? "") ? null : s.activePageId,
      mainView: toRemove.has(s.activePageId ?? "") ? "board" as const : s.mainView,
    };
  }),

  duplicatePage: (id) => set((s) => {
    const page = s.pages.find((p) => p.id === id);
    if (!page) return s;

    // ── Smart copy name: "(copia)", "(copia 2)", "(copia 3)", etc. ──
    const siblings = s.pages.filter((p) => p.parentId === page.parentId && p.isPrivate === page.isPrivate);
    const baseTitle = page.title.replace(/ \(copia(?: \d+)?\)$/, "");
    let copyNum = 1;
    const existingCopies = siblings.filter((p) => {
      if (p.title === `${baseTitle} (copia)`) return true;
      const m = p.title.match(new RegExp(`^${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(copia (\\d+)\\)$`));
      if (m) { copyNum = Math.max(copyNum, parseInt(m[1])); return true; }
      return false;
    });
    const copyTitle = existingCopies.length === 0
      ? `${baseTitle} (copia)`
      : `${baseTitle} (copia ${copyNum + 1})`;

    // ── Collect all descendants recursively ──
    const idMap = new Map<string, string>();
    const toDuplicate = [page];
    const collectChildren = (parentId: string) => {
      for (const p of s.pages) {
        if (p.parentId === parentId) {
          toDuplicate.push(p);
          collectChildren(p.id);
        }
      }
    };
    collectChildren(page.id);

    // ── Generate unique IDs ──
    let counter = 0;
    const now = Date.now();
    for (const p of toDuplicate) {
      idMap.set(p.id, `pg_${now}_${counter++}`);
    }

    // ── Bump order of siblings after the original to make room ──
    const insertOrder = page.order + 1;
    const updatedPages = s.pages.map((p) => {
      if (p.parentId === page.parentId && p.isPrivate === page.isPrivate && p.order >= insertOrder) {
        return { ...p, order: p.order + toDuplicate.length };
      }
      return p;
    });

    // ── Create duplicated pages ──
    const newPages = toDuplicate.map((p, i) => ({
      ...p,
      id: idMap.get(p.id)!,
      title: p.id === id ? copyTitle : p.title,
      // Root copy keeps same parentId & isPrivate; children point to new parent IDs
      parentId: p.id === id ? page.parentId : (idMap.get(p.parentId!) ?? p.parentId),
      isPrivate: p.isPrivate,
      blocks: p.blocks.map((b, bi) => ({ ...b, id: `blk_${now}_${counter++}_${bi}` })),
      // Root copy goes right after original; children keep relative order
      order: p.id === id ? insertOrder : p.order,
    }));

    // ── Insert new pages right after the original in the array ──
    const originalIndex = updatedPages.findIndex((p) => p.id === id);
    const result = [...updatedPages];
    result.splice(originalIndex + 1, 0, ...newPages);

    return { pages: result };
  }),

  reorderPages: (pageIds) => set((s) => ({
    pages: s.pages.map((p) => {
      const idx = pageIds.indexOf(p.id);
      return idx >= 0 ? { ...p, order: idx } : p;
    }),
  })),

  movePage: (id, newParentId, isPrivate) => {
    set((s) => ({
      pages: s.pages.map((p) => p.id === id ? { ...p, parentId: newParentId, isPrivate } : p),
    }));
    apiUpdatePage(id, { parentId: newParentId, isPrivate });
  },

  addWorkspace: (name, emoji) => set((s) => ({
    workspaces: [...s.workspaces, { id: `ws_${Date.now()}`, name, emoji }],
  })),

  removeWorkspace: (id) => set((s) => {
    if (s.workspaces.length <= 1) return s;
    const remaining = s.workspaces.filter((w) => w.id !== id);
    return {
      workspaces: remaining,
      activeWorkspaceId: s.activeWorkspaceId === id ? remaining[0].id : s.activeWorkspaceId,
    };
  }),

  renameWorkspace: (id, name, emoji) => set((s) => ({
    workspaces: s.workspaces.map((w) => w.id === id ? { ...w, name, ...(emoji ? { emoji } : {}) } : w),
  })),

  inviteOpen: false,
  setInviteOpen: (open) => set({ inviteOpen: open }),
  pendingInvites: [],
  addInvite: (email, role) => set((s) => ({
    pendingInvites: [...s.pendingInvites, { email, role }],
  })),

  trash: [],
  focusMode: false,
  setFocusMode: (mode) => set({ focusMode: mode }),

  toggleFavorite: (type, id) => set((s) => {
    const exists = s.favorites.some((f) => f.type === type && f.id === id);
    return { favorites: exists ? s.favorites.filter((f) => !(f.type === type && f.id === id)) : [...s.favorites, { type, id }] };
  }),
  isFavorite: (type, id) => get().favorites.some((f) => f.type === type && f.id === id),

  movePageToTrash: (id) => set((s) => {
    const page = s.pages.find((p) => p.id === id);
    if (!page) return s;
    // Collect all descendants
    const toRemove = new Set<string>([id]);
    let changed = true;
    while (changed) { changed = false; for (const p of s.pages) { if (p.parentId && toRemove.has(p.parentId) && !toRemove.has(p.id)) { toRemove.add(p.id); changed = true; } } }
    const removedPages = s.pages.filter((p) => toRemove.has(p.id));
    // Soft delete on server
    toRemove.forEach((pid) => apiDeletePage(pid));
    return {
      pages: s.pages.filter((p) => !toRemove.has(p.id)),
      trash: [...s.trash, { id, type: "page", name: page.title, data: removedPages, deletedAt: new Date().toISOString() }],
      activePageId: toRemove.has(s.activePageId ?? "") ? null : s.activePageId,
      mainView: toRemove.has(s.activePageId ?? "") ? "board" as const : s.mainView,
    };
  }),

  restoreFromTrash: (id) => {
    const s = get();
    const item = s.trash.find((t) => t.id === id);
    if (!item) return;
    if (item.type === "page") {
      const restoredPages = (item.data as PageNode[]) ?? [];
      set({ trash: s.trash.filter((t) => t.id !== id), pages: [...s.pages, ...restoredPages] });
      return;
    }
    if (item.type === "task") {
      // Restore task to board-store
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useBoardStore } = require("@/stores/board-store");
        const taskData = item.data as Record<string, unknown>;
        const boardId = (taskData._boardId as string) ?? "";
        const boardStore = useBoardStore.getState();
        useBoardStore.setState({
          tasks: [...boardStore.tasks, taskData as unknown as import("@/types").Task],
          boards: boardStore.boards.map((b: { id: string; taskIds: string[] }) => b.id === boardId ? { ...b, taskIds: [...b.taskIds, id] } : b),
        });
      } catch { /* ignore if board-store not available */ }
      set({ trash: s.trash.filter((t) => t.id !== id) });
      return;
    }
    set({ trash: s.trash.filter((t) => t.id !== id) });
  },

  permanentlyDelete: (id) => set((s) => ({
    trash: s.trash.filter((t) => t.id !== id),
  })),

  emptyTrash: () => set({ trash: [] }),

  // Page templates
  pageTemplates: [
    { id: "pt_1", name: "SOP", emoji: "📋", blocks: [
      b("pt1_1", "h1", "Título del SOP"), b("pt1_2", "h2", "Objetivo"), b("pt1_3", "text", "Describir el objetivo del proceso..."),
      b("pt1_4", "h2", "Pasos"), b("pt1_5", "numbered-list", "Paso 1"), b("pt1_6", "numbered-list", "Paso 2"), b("pt1_7", "numbered-list", "Paso 3"),
      b("pt1_8", "h2", "Notas"), b("pt1_9", "callout", "Notas importantes aquí", { emoji: "💡", color: "blue" }),
    ]},
    { id: "pt_2", name: "Brief de campaña", emoji: "📊", blocks: [
      b("pt2_1", "h1", "Brief — Campaña"),
      b("pt2_2", "callout", "Cliente: ... | Presupuesto: $... | Duración: ... días", { emoji: "📌", color: "yellow" }),
      b("pt2_3", "h2", "Objetivos"), b("pt2_4", "bullet-list", "Objetivo 1"), b("pt2_5", "bullet-list", "Objetivo 2"),
      b("pt2_6", "h2", "Audiencia"), b("pt2_7", "bullet-list", "Segmento 1"), b("pt2_8", "bullet-list", "Segmento 2"),
      b("pt2_9", "h2", "Creativos necesarios"), b("pt2_10", "todo", "Video 1", { checked: false }), b("pt2_11", "todo", "Carrusel", { checked: false }),
      b("pt2_12", "quote", "Notas del cliente aquí"),
    ]},
    { id: "pt_3", name: "Notas de reunión", emoji: "📝", blocks: [
      b("pt3_1", "h1", `Reunión — ${new Date().toLocaleDateString("es-ES")}`),
      b("pt3_2", "h2", "Asistentes"), b("pt3_3", "bullet-list", "Nombre 1"), b("pt3_4", "bullet-list", "Nombre 2"),
      b("pt3_5", "h2", "Agenda"), b("pt3_6", "numbered-list", "Tema 1"), b("pt3_7", "numbered-list", "Tema 2"),
      b("pt3_8", "h2", "Acuerdos"), b("pt3_9", "todo", "Acuerdo 1", { checked: false }),
      b("pt3_10", "h2", "Próximos pasos"), b("pt3_11", "todo", "Acción 1", { checked: false }),
    ]},
    { id: "pt_4", name: "Página en blanco", emoji: "📄", blocks: [
      b("pt4_1", "text", ""),
    ]},
  ],

  addPageFromTemplate: (templateId, parentId, isPrivate) => {
    const state = get();
    const tmpl = state.pageTemplates.find((t) => t.id === templateId);
    if (!tmpl) return "";
    const id = `pg_${Date.now()}`;
    const now = Date.now();
    const blocks = tmpl.blocks.map((blk, i) => ({ ...blk, id: `blk_${now}_${i}` }));
    set((s) => ({
      pages: [...s.pages, { id, emoji: tmpl.emoji, title: tmpl.name, content: "", blocks, parentId, isPrivate, order: s.pages.length }],
      activePageId: id,
      mainView: "page" as const,
    }));
    // Create on server
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    const workspaceId = authData?.state?.currentUser?.workspaceId;
    if (workspaceId) {
      fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tmpl.name, emoji: tmpl.emoji, workspaceId, parentId, isPrivate }),
      }).then((r) => r.json()).then((saved) => {
        // Update page blocks on server
        apiUpdatePage(saved.id, {
          blocks: blocks.map((blk) => ({
            type: blk.type,
            content: blk.content,
            properties: {
              ...(blk.checked !== undefined && { checked: blk.checked }),
              ...(blk.emoji && { emoji: blk.emoji }),
              ...(blk.color && { color: blk.color }),
            },
          })),
        });
        set((s) => ({
          pages: s.pages.map((p) => p.id === id ? { ...p, id: saved.id } : p),
          activePageId: s.activePageId === id ? saved.id : s.activePageId,
        }));
      }).catch((e) => console.error("API create page from template error:", e));
    }
    return id;
  },

  importMarkdown: (markdown) => {
    const id = `pg_${Date.now()}`;
    const now = Date.now();
    let counter = 0;
    const lines = markdown.split("\n");
    const blocks: Block[] = [];
    let title = "Importado";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const bid = `blk_${now}_${counter++}`;
      if (trimmed.startsWith("#### ")) { blocks.push({ id: bid, type: "h4", content: trimmed.slice(5) }); }
      else if (trimmed.startsWith("### ")) { blocks.push({ id: bid, type: "h3", content: trimmed.slice(4) }); }
      else if (trimmed.startsWith("## ")) { blocks.push({ id: bid, type: "h2", content: trimmed.slice(3) }); }
      else if (trimmed.startsWith("# ")) { if (blocks.length === 0) title = trimmed.slice(2); blocks.push({ id: bid, type: "h1", content: trimmed.slice(2) }); }
      else if (trimmed.startsWith("- [x] ")) { blocks.push({ id: bid, type: "todo", content: trimmed.slice(6), checked: true }); }
      else if (trimmed.startsWith("- [ ] ")) { blocks.push({ id: bid, type: "todo", content: trimmed.slice(6), checked: false }); }
      else if (trimmed.startsWith("- ")) { blocks.push({ id: bid, type: "bullet-list", content: trimmed.slice(2) }); }
      else if (/^\d+\.\s/.test(trimmed)) { blocks.push({ id: bid, type: "numbered-list", content: trimmed.replace(/^\d+\.\s/, "") }); }
      else if (trimmed.startsWith("> ")) { blocks.push({ id: bid, type: "quote", content: trimmed.slice(2) }); }
      else if (trimmed === "---") { blocks.push({ id: bid, type: "divider", content: "" }); }
      else if (trimmed.startsWith("```")) { blocks.push({ id: bid, type: "code", content: "", language: trimmed.slice(3) || "javascript" }); }
      else { blocks.push({ id: bid, type: "text", content: trimmed }); }
    }
    if (blocks.length === 0) blocks.push({ id: `blk_${now}_0`, type: "text", content: "" });
    set((s) => ({
      pages: [...s.pages, { id, emoji: "📄", title, content: "", blocks, parentId: null, isPrivate: false, order: s.pages.length }],
      activePageId: id,
      mainView: "page" as const,
    }));
    return id;
  },

}), {
  name: "mh-sidebar-storage",
  version: 3,
  partialize: (state) => ({
    favorites: state.favorites,
    recents: state.recents,
    expandedBoardIds: state.expandedBoardIds,
    expandedPageIds: state.expandedPageIds,
    sectionsCollapsed: state.sectionsCollapsed,
    pendingInvites: state.pendingInvites,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persisted: any) => {
    // Wipe pages/workspaces that may have leaked from old versions
    if (persisted && typeof persisted === "object") {
      delete persisted.pages;
      delete persisted.workspaces;
      delete persisted.activeWorkspaceId;
      delete persisted.trash;
      delete persisted._pagesLoaded;
    }
    return persisted;
  },
}));
