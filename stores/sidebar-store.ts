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

const MOCK_PAGES: PageNode[] = [
  { id: "pg1", emoji: "📋", title: "SOP - Proceso de Campañas", content: "", parentId: null, isPrivate: false, order: 0, blocks: [
    b("b1a", "h2", "1. Brief"), b("b1b", "text", "Recibir brief del cliente con objetivos, presupuesto y timeline."),
    b("b1c", "h2", "2. Research"), b("b1d", "text", "Analizar competencia, audiencias y tendencias."),
    b("b1e", "h2", "3. Estrategia"), b("b1f", "text", "Definir canales, segmentación y creativos."),
    b("b1g", "h2", "4. Ejecución"), b("b1h", "text", "Crear campañas en plataforma, subir creativos."),
    b("b1i", "h2", "5. Optimización"), b("b1j", "text", "Monitorear métricas diariamente, ajustar pujas y audiencias."),
    b("b1k", "callout", "Siempre documentar los resultados de cada fase antes de avanzar.", { emoji: "💡", color: "blue" }),
  ]},
  { id: "pg2", emoji: "📊", title: "Brief Campaña Día de la Madre", content: "", parentId: null, isPrivate: false, order: 1, blocks: [
    b("b2a", "callout", "Cliente: Tendearte | Presupuesto: $2,000 USD | Duración: 15 días", { emoji: "📌", color: "yellow" }),
    b("b2b", "h2", "Objetivos"), b("b2c", "bullet-list", "Incrementar ventas 30%"), b("b2d", "bullet-list", "ROAS mínimo 3.5x"),
    b("b2e", "h2", "Audiencia"), b("b2f", "bullet-list", "Mujeres 25-45 años"), b("b2g", "bullet-list", "Intereses: regalos, decoración"),
    b("b2h", "h2", "Creativos necesarios"), b("b2i", "todo", "3 videos cortos (15s)", { checked: true }), b("b2j", "todo", "5 imágenes carrusel", { checked: false }), b("b2k", "todo", "2 stories", { checked: false }),
    b("b2l", "divider", ""),
    b("b2m", "quote", "El deadline es el 10 de mayo. No hay margen de error."),
  ]},
  { id: "pg3", emoji: "💡", title: "Ideas de Contenido", content: "", parentId: null, isPrivate: false, order: 2, blocks: [
    b("b3a", "bullet-list", "Behind the scenes de sesiones de fotos"), b("b3b", "bullet-list", "Testimonios de clientes reales"),
    b("b3c", "bullet-list", "Tutoriales de uso del producto"), b("b3d", "bullet-list", "Trends de TikTok adaptados"),
  ]},
  { id: "pg4", emoji: "🎬", title: "Videos TikTok", content: "", parentId: "pg3", isPrivate: false, order: 0, blocks: [
    b("b4a", "numbered-list", "Unboxing con reacción"), b("b4b", "numbered-list", "POV: cuando llega tu pedido"),
    b("b4c", "numbered-list", "Trend del momento con producto"), b("b4d", "numbered-list", "Comparación antes/después"),
  ]},
  { id: "pg5", emoji: "📝", title: "Notas personales", content: "", parentId: null, isPrivate: true, order: 0, blocks: [
    b("b5a", "todo", "Revisar métricas de FloraCare el lunes", { checked: false }),
    b("b5b", "todo", "Llamar a proveedor de creativos", { checked: true }),
    b("b5c", "todo", "Preparar reporte mensual", { checked: false }),
  ]},
];

const MOCK_WORKSPACES: Workspace[] = [
  { id: "ws1", name: "REDKING Marketing", emoji: "🚀" },
  { id: "ws2", name: "Talkyria", emoji: "💬" },
  { id: "ws3", name: "Personal", emoji: "👤" },
];

export const useSidebarStore = create<SidebarState>()(persist((set, get) => ({
  collapsed: false,
  activeWorkspaceId: "ws1",
  workspaces: MOCK_WORKSPACES,
  pages: MOCK_PAGES.map((p) => ({ ...p })),
  recents: [
    { type: "task" as const, id: "t4", title: "Copies A/B WildropShop", emoji: "📝" },
    { type: "board" as const, id: "b1", title: "Campañas Facebook", emoji: "📣" },
    { type: "task" as const, id: "t1", title: "Campaña Conversión MedSock", emoji: "📝" },
  ],
  expandedBoardIds: [],
  expandedPageIds: ["pg3"],
  sectionsCollapsed: {},
  activePageId: null,
  mainView: "board",
  favorites: [],

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
    return id;
  },

  updatePage: (id, updates) => set((s) => ({
    pages: s.pages.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),

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

  movePage: (id, newParentId, isPrivate) => set((s) => ({
    pages: s.pages.map((p) => p.id === id ? { ...p, parentId: newParentId, isPrivate } : p),
  })),

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
  pendingInvites: [
    { email: "maria@redking.co", role: "Editor" },
  ],
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
  version: 1,
  partialize: (state) => ({
    pages: state.pages,
    workspaces: state.workspaces,
    favorites: state.favorites,
    recents: state.recents,
    trash: state.trash,
    pendingInvites: state.pendingInvites,
    expandedBoardIds: state.expandedBoardIds,
    expandedPageIds: state.expandedPageIds,
    sectionsCollapsed: state.sectionsCollapsed,
  }),
}));
