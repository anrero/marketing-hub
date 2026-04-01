"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, Status, Board, TeamMember, Subtask, SavedView, ReminderOption, Priority, Tag, TaskTemplate } from "@/types";
import { TASKS, BOARDS, COLUMNS, TEAM_MEMBERS, STORES, CAMPAIGN_TYPES } from "@/lib/mock-data";
import { useHistoryStore } from "@/stores/history-store";

// Lazy import to avoid circular dependency
function getSidebarStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/stores/sidebar-store").useSidebarStore;
}

const BUILT_IN_VIEWS: SavedView[] = [
  { id: "v_all", name: "Todas las tareas", icon: "star", builtIn: true, filters: {} },
  { id: "v_status", name: "Por estado", icon: "chart", builtIn: true, filters: { groupByStatus: true } },
  { id: "v_mine", name: "Mis tareas", icon: "user", builtIn: true, filters: { assigneeId: "u1" } },
  { id: "v_urgent", name: "Urgentes", icon: "alert", builtIn: true, filters: { priorities: ["urgente", "alta"] } },
  { id: "v_overdue", name: "Vencidas", icon: "calendar", builtIn: true, filters: { overdue: true } },
  { id: "v_archived", name: "Archivadas", icon: "archive", builtIn: true, filters: {} },
];

interface UndoItem {
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

interface BoardState {
  boards: Board[];
  tasks: Task[];
  activeBoardId: string;
  selectedTaskId: string | null;
  undoStack: UndoItem[];
  redoStack: UndoItem[];
  filterStore: string | null;
  filterPriority: string | null;
  filterAssignee: string | null;
  viewMode: "kanban" | "tabla" | "calendario" | "galeria" | "timeline";
  newTaskDialogOpen: boolean;
  newBoardDialogOpen: boolean;
  settingsOpen: boolean;
  commandOpen: boolean;
  customStores: string[];
  customCampaignTypes: string[];
  customAdAccounts: string[];
  customTeamMembers: TeamMember[];
  savedViews: SavedView[];
  activeViewId: string;
  customViews: SavedView[];
  tags: Tag[];

  setActiveBoard: (id: string) => void;
  setSelectedTask: (id: string | null) => void;
  setFilterStore: (store: string | null) => void;
  setFilterPriority: (priority: string | null) => void;
  setFilterAssignee: (assignee: string | null) => void;
  setViewMode: (mode: "kanban" | "tabla" | "calendario" | "galeria" | "timeline") => void;
  setNewTaskDialogOpen: (open: boolean) => void;
  setNewBoardDialogOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setActiveViewId: (id: string) => void;
  moveTask: (taskId: string, newStatus: Status) => void;
  updateTaskWithActivity: (taskId: string, updates: Partial<Task>, authorId?: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
  addQuickTask: (title: string) => void;
  addBoard: (name: string) => void;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  duplicateBoard: (id: string) => void;
  removeAttachment: (taskId: string, index: number) => void;
  reorderBoardTasks: (taskIds: string[]) => void;
  reorderBoards: (boardIds: string[]) => void;
  addColumn: (title: string, afterColumnId?: string, beforeColumnId?: string) => void;
  removeColumn: (columnId: string) => void;
  renameColumn: (columnId: string, title: string) => void;
  setColumnColor: (columnId: string, color: string) => void;
  addCustomStore: (store: string) => void;
  removeCustomStore: (store: string) => void;
  addCustomCampaignType: (type: string) => void;
  removeCustomCampaignType: (type: string) => void;
  addCustomAdAccount: (account: string) => void;
  removeCustomAdAccount: (account: string) => void;
  addTeamMember: (member: TeamMember) => void;
  removeTeamMember: (memberId: string) => void;
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  duplicateTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  reorderSubtasks: (taskId: string, subtasks: Subtask[]) => void;
  // Reminder
  setReminder: (taskId: string, reminder: ReminderOption) => void;
  // Bulk actions
  bulkMove: (taskIds: string[], status: Status) => void;
  bulkAssign: (taskIds: string[], assigneeId: string) => void;
  bulkPriority: (taskIds: string[], priority: Priority) => void;
  bulkDelete: (taskIds: string[]) => void;
  bulkDuplicate: (taskIds: string[]) => void;
  // Custom views
  addCustomView: (name: string, filters: SavedView["filters"]) => void;
  // Archive
  archiveTask: (taskId: string) => void;
  unarchiveTask: (taskId: string) => void;
  archiveCompleted: () => void;
  // Tags
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  // Task templates
  taskTemplates: TaskTemplate[];
  addTaskTemplate: (t: TaskTemplate) => void;
  removeTaskTemplate: (id: string) => void;
  addTaskFromTemplate: (templateId: string, status?: Status) => void;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  // Getters
  getAllStores: () => string[];
  getAllCampaignTypes: () => string[];
  getAllAdAccounts: () => string[];
  getAllTeamMembers: () => TeamMember[];
  getAllViews: () => SavedView[];
  getFilteredTasks: () => Task[];
  getBoardTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getArchivedTasks: () => Task[];
  getAllTags: () => Tag[];
}

const fieldLabels: Record<string, string> = {
  status: "status", assigneeId: "responsable", priority: "prioridad",
  store: "tienda", campaignType: "tipo de campaña", dueDate: "fecha de entrega",
  adAccount: "cuenta publicitaria", campaignName: "nombre de campaña",
};

const statusLabels: Record<string, string> = {
  por_hacer: "Por hacer", en_proceso: "En proceso", en_revision: "En revisión", completado: "Completado",
};

const DEFAULT_AD_ACCOUNTS = [
  "Act_MedSock_001", "Act_Tendearte_001", "Act_FloraCare_001",
  "Act_WildropShop_001", "Act_Rojucol_001", "Act_Monklic_001",
];

function buildActivityEntries(task: Task, updates: Partial<Task>, authorId: string, allMembers: TeamMember[]): Task["activity"] {
  const entries: Task["activity"] = [];
  const now = new Date().toISOString();
  for (const key of Object.keys(updates) as (keyof Task)[]) {
    if (["activity", "comments", "attachments", "urls", "id", "customFields", "subtasks"].includes(key)) continue;
    const label = fieldLabels[key];
    if (!label) continue;
    const oldVal = task[key];
    const newVal = updates[key];
    if (oldVal === newVal) continue;
    let description: string;
    let oldStr = String(oldVal ?? "");
    let newStr = String(newVal ?? "");
    if (key === "status") {
      oldStr = statusLabels[oldVal as string] ?? oldStr;
      newStr = statusLabels[newVal as string] ?? newStr;
      description = `cambió ${label} de "${oldStr}" a "${newStr}"`;
    } else if (key === "assigneeId") {
      const oldMember = allMembers.find((m) => m.id === oldVal);
      const newMember = allMembers.find((m) => m.id === newVal);
      oldStr = oldMember?.name ?? oldStr;
      newStr = newMember?.name ?? newStr;
      description = `cambió ${label} de "${oldStr}" a "${newStr}"`;
    } else {
      description = `cambió ${label} de "${oldStr}" a "${newStr}"`;
    }
    entries.push({ id: `a${Date.now()}_${key}`, authorId, action: description, field: key, oldValue: oldStr, newValue: newStr, createdAt: now });
  }
  return entries;
}

export const useBoardStore = create<BoardState>()(persist((set, get) => ({
  boards: BOARDS,
  tasks: TASKS,
  activeBoardId: "b1",
  selectedTaskId: null,
  undoStack: [],
  redoStack: [],
  filterStore: null,
  filterPriority: null,
  filterAssignee: null,
  viewMode: "kanban",
  newTaskDialogOpen: false,
  newBoardDialogOpen: false,
  settingsOpen: false,
  commandOpen: false,
  customStores: [],
  customCampaignTypes: [],
  customAdAccounts: [],
  customTeamMembers: [],
  savedViews: BUILT_IN_VIEWS,
  activeViewId: "v_all",
  customViews: [],

  setActiveBoard: (id) => set({ activeBoardId: id }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setFilterStore: (store) => set({ filterStore: store }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setNewTaskDialogOpen: (open) => set({ newTaskDialogOpen: open }),
  setNewBoardDialogOpen: (open) => set({ newBoardDialogOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setActiveViewId: (id) => set({ activeViewId: id }),

  moveTask: (taskId, newStatus) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const oldStatus = task.status;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, activity: [...t.activity, {
          id: `a${Date.now()}_move`, authorId: "u1",
          action: `movió de "${statusLabels[oldStatus]}" a "${statusLabels[newStatus]}"`,
          field: "status", oldValue: statusLabels[oldStatus], newValue: statusLabels[newStatus],
          createdAt: new Date().toISOString(),
        }] } : t
      ),
      undoStack: [...s.undoStack, { action: "moveTask", data: { taskId, fromStatus: oldStatus, toStatus: newStatus } }].slice(-30),
      redoStack: [],
    }));
  },

  updateTaskWithActivity: (taskId, updates, authorId = "u1") =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      const allMembers = [...TEAM_MEMBERS, ...state.customTeamMembers];
      const newEntries = buildActivityEntries(task, updates, authorId, allMembers);
      return { tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...updates, activity: [...t.activity, ...newEntries] } : t) };
    }),

  updateTask: (taskId, updates) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t) })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
      boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, task.id] } : b),
    })),

  addQuickTask: (title) =>
    set((state) => {
      const newId = `t${Date.now()}`;
      const newTask: Task = {
        id: newId, title, status: "por_hacer", priority: "media", store: "", assigneeId: "u1",
        campaignType: "", campaignName: "", adAccount: "", dueDate: new Date().toISOString().split("T")[0],
        urls: [], attachments: [], comments: [], activity: [
          { id: `a${Date.now()}_create`, authorId: "u1", action: "creó la tarea", createdAt: new Date().toISOString() }
        ], subtasks: [],
      };
      return {
        tasks: [...state.tasks, newTask],
        boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b),
      };
    }),

  addBoard: (name) =>
    set((state) => {
      const newId = `b${Date.now()}`;
      return { boards: [...state.boards, { id: newId, name, columns: COLUMNS, taskIds: [] }], activeBoardId: newId };
    }),

  renameBoard: (id, name) =>
    set((state) => ({ boards: state.boards.map((b) => b.id === id ? { ...b, name } : b) })),

  deleteBoard: (id) =>
    set((state) => {
      if (state.boards.length <= 1) return state;
      const remaining = state.boards.filter((b) => b.id !== id);
      return { boards: remaining, activeBoardId: state.activeBoardId === id ? remaining[0].id : state.activeBoardId };
    }),

  duplicateBoard: (id) =>
    set((state) => {
      const board = state.boards.find((b) => b.id === id);
      if (!board) return state;
      const newId = `b${Date.now()}`;
      const newTaskIds: string[] = [];
      const newTasks: Task[] = [];
      for (const tid of board.taskIds) {
        const task = state.tasks.find((t) => t.id === tid);
        if (task) {
          const ntid = `t${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          newTaskIds.push(ntid);
          newTasks.push({ ...task, id: ntid, title: task.title, comments: [], activity: [{ id: `a${Date.now()}`, authorId: "u1", action: "duplicó la tarea", createdAt: new Date().toISOString() }] });
        }
      }
      return { boards: [...state.boards, { ...board, id: newId, name: `${board.name} (copia)`, taskIds: newTaskIds }], tasks: [...state.tasks, ...newTasks], activeBoardId: newId };
    }),

  removeAttachment: (taskId, index) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, attachments: t.attachments.filter((_, i) => i !== index) } : t) })),

  reorderBoardTasks: (taskIds) =>
    set((state) => ({
      boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds } : b),
    })),

  reorderBoards: (boardIds) =>
    set((state) => ({
      boards: boardIds.map((id) => state.boards.find((b) => b.id === id)!).filter(Boolean),
    })),

  addColumn: (title, afterColumnId, beforeColumnId) => set((s) => {
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return s;
    const newCol = { id: `col_${Date.now()}`, title };
    const cols = [...board.columns];
    if (beforeColumnId) {
      const idx = cols.findIndex((c) => c.id === beforeColumnId);
      cols.splice(Math.max(0, idx), 0, newCol);
    } else if (afterColumnId) {
      const idx = cols.findIndex((c) => c.id === afterColumnId);
      cols.splice(idx + 1, 0, newCol);
    } else {
      cols.push(newCol);
    }
    return { boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, columns: cols } : b) };
  }),

  removeColumn: (columnId) => set((s) => {
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return s;
    return {
      boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) } : b),
      tasks: s.tasks.map((t) => board.taskIds.includes(t.id) && t.status === columnId as Status ? { ...t, status: "por_hacer" as Status } : t),
    };
  }),

  renameColumn: (columnId, title) => set((s) => ({
    boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, columns: b.columns.map((c) => c.id === columnId ? { ...c, title } : c) } : b),
  })),

  setColumnColor: (columnId, color) => set((s) => ({
    boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, columns: b.columns.map((c) => c.id === columnId ? { ...c, color } : c) } : b),
  })),

  addCustomStore: (store) => set((s) => ({ customStores: s.customStores.includes(store) ? s.customStores : [...s.customStores, store] })),
  removeCustomStore: (store) => set((s) => ({ customStores: s.customStores.filter((x) => x !== store) })),
  addCustomCampaignType: (type) => set((s) => ({ customCampaignTypes: s.customCampaignTypes.includes(type) ? s.customCampaignTypes : [...s.customCampaignTypes, type] })),
  removeCustomCampaignType: (type) => set((s) => ({ customCampaignTypes: s.customCampaignTypes.filter((x) => x !== type) })),
  addCustomAdAccount: (account) => set((s) => ({ customAdAccounts: s.customAdAccounts.includes(account) ? s.customAdAccounts : [...s.customAdAccounts, account] })),
  removeCustomAdAccount: (account) => set((s) => ({ customAdAccounts: s.customAdAccounts.filter((x) => x !== account) })),
  addTeamMember: (member) => set((s) => ({ customTeamMembers: [...s.customTeamMembers, member] })),
  removeTeamMember: (memberId) => set((s) => ({ customTeamMembers: s.customTeamMembers.filter((m) => m.id !== memberId) })),
  updateTeamMember: (memberId, updates) => set((s) => ({ customTeamMembers: s.customTeamMembers.map((m) => m.id === memberId ? { ...m, ...updates } : m) })),

  duplicateTask: (taskId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      const newId = `t${Date.now()}`;
      const newTask: Task = { ...task, id: newId, title: `${task.title} (copia)`, comments: [], subtasks: [...(task.subtasks ?? []).map((s) => ({ ...s, id: `st${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }))], activity: [{ id: `a${Date.now()}_create`, authorId: "u1", action: "duplicó la tarea", createdAt: new Date().toISOString() }] };
      return { tasks: [...state.tasks, newTask], boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b) };
    }),

  deleteTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Deep copy for undo
    const taskCopy = JSON.parse(JSON.stringify(task));
    const boardId = state.boards.find((b) => b.taskIds.includes(taskId))?.id ?? state.activeBoardId;

    // Also push to sidebar trash for the Papelera UI
    try {
      const useSidebarStore = getSidebarStore();
      const ss = useSidebarStore.getState();
      useSidebarStore.setState({
        trash: [...ss.trash, { id: taskId, type: "task" as const, name: task.title.replace(/<[^>]*>/g, ""), data: { ...taskCopy, _boardId: boardId }, deletedAt: new Date().toISOString() }],
      });
    } catch { /* sidebar store not available */ }

    // Remove task + push undo
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      boards: s.boards.map((b) => ({ ...b, taskIds: b.taskIds.filter((id) => id !== taskId) })),
      selectedTaskId: s.selectedTaskId === taskId ? null : s.selectedTaskId,
      undoStack: [...s.undoStack, { action: "deleteTask", data: { task: taskCopy, boardId } }].slice(-30),
      redoStack: [],
    }));
  },

  // Subtasks
  addSubtask: (taskId, title) =>
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), { id: `st${Date.now()}`, title, completed: false }] } : t),
    })),

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s) } : t),
    })),

  removeSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) } : t),
    })),

  reorderSubtasks: (taskId, subtasks) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t) })),

  setReminder: (taskId, reminder) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, reminder } : t) })),

  // Bulk
  bulkMove: (taskIds, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, status, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: "u1", action: `movió a "${statusLabels[status]}"`, field: "status", newValue: statusLabels[status], createdAt: new Date().toISOString() }] } : t),
    })),

  bulkAssign: (taskIds, assigneeId) =>
    set((state) => {
      const allMembers = [...TEAM_MEMBERS, ...state.customTeamMembers];
      const name = allMembers.find((m) => m.id === assigneeId)?.name ?? assigneeId;
      return { tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, assigneeId, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: "u1", action: `asignó a "${name}"`, field: "assigneeId", newValue: name, createdAt: new Date().toISOString() }] } : t) };
    }),

  bulkPriority: (taskIds, priority) =>
    set((state) => ({
      tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, priority, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: "u1", action: `cambió prioridad a "${priority}"`, field: "priority", newValue: priority, createdAt: new Date().toISOString() }] } : t),
    })),

  bulkDelete: (taskIds) => {
    const state = get();
    // Move each task to trash
    const useSidebarStore = getSidebarStore();
    const sidebarState = useSidebarStore.getState();
    const trashItems = taskIds.map((taskId) => {
      const task = state.tasks.find((t) => t.id === taskId);
      const boardId = state.boards.find((b) => b.taskIds.includes(taskId))?.id;
      return task ? {
        id: task.id,
        type: "task" as const,
        name: task.title.replace(/<[^>]*>/g, ""),
        data: { ...task, _boardId: boardId },
        deletedAt: new Date().toISOString(),
      } : null;
    }).filter(Boolean);
    useSidebarStore.setState({ trash: [...sidebarState.trash, ...trashItems] });

    set((s) => ({
      tasks: s.tasks.filter((t) => !taskIds.includes(t.id)),
      boards: s.boards.map((b) => ({ ...b, taskIds: b.taskIds.filter((id) => !taskIds.includes(id)) })),
      selectedTaskId: taskIds.includes(s.selectedTaskId ?? "") ? null : s.selectedTaskId,
    }));
  },

  bulkDuplicate: (taskIds) =>
    set((state) => {
      const newTasks: Task[] = [];
      const newIds: string[] = [];
      for (const id of taskIds) {
        const task = state.tasks.find((t) => t.id === id);
        if (!task) continue;
        const newId = `t${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        newTasks.push({ ...task, id: newId, title: `${task.title} (copia)`, comments: [], activity: [{ id: `a${Date.now()}_dup`, authorId: "u1", action: "duplicó la tarea", createdAt: new Date().toISOString() }] });
        newIds.push(newId);
      }
      return { tasks: [...state.tasks, ...newTasks], boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, ...newIds] } : b) };
    }),

  addCustomView: (name, filters) =>
    set((s) => ({ customViews: [...s.customViews, { id: `cv_${Date.now()}`, name, icon: "star", builtIn: false, filters }] })),

  getAllStores: () => { const s = get(); return [...STORES, ...s.customStores]; },
  getAllCampaignTypes: () => { const s = get(); return [...CAMPAIGN_TYPES, ...s.customCampaignTypes]; },
  getAllAdAccounts: () => { const s = get(); return [...DEFAULT_AD_ACCOUNTS, ...s.customAdAccounts]; },
  getAllTeamMembers: () => { const s = get(); return [...TEAM_MEMBERS, ...s.customTeamMembers]; },
  getAllViews: () => { const s = get(); return [...s.savedViews, ...s.customViews]; },

  getFilteredTasks: () => {
    const state = get();
    const board = state.boards.find((b) => b.id === state.activeBoardId);
    if (!board) return [];
    let result = board.taskIds.map((id) => state.tasks.find((t) => t.id === id)).filter((t): t is Task => t != null && !t.archivedAt);
    // Apply saved view filters
    const allViews = [...state.savedViews, ...state.customViews];
    const view = allViews.find((v) => v.id === state.activeViewId);
    if (view?.filters) {
      if (view.filters.assigneeId) result = result.filter((t) => t.assigneeId === view.filters.assigneeId);
      if (view.filters.priorities?.length) result = result.filter((t) => view.filters.priorities!.includes(t.priority));
      if (view.filters.overdue) { const today = new Date().toISOString().split("T")[0]; result = result.filter((t) => t.dueDate < today && t.status !== "completado"); }
    }
    // Apply manual filters
    if (state.filterStore) result = result.filter((t) => t.store === state.filterStore);
    if (state.filterPriority) result = result.filter((t) => t.priority === state.filterPriority);
    if (state.filterAssignee) result = result.filter((t) => t.assigneeId === state.filterAssignee);
    return result;
  },

  getBoardTasks: () => {
    const state = get();
    const board = state.boards.find((b) => b.id === state.activeBoardId);
    if (!board) return [];
    return board.taskIds.map((id) => state.tasks.find((t) => t.id === id)).filter((t): t is Task => t != null);
  },

  getOverdueTasks: () => {
    const state = get();
    const today = new Date().toISOString().split("T")[0];
    const board = state.boards.find((b) => b.id === state.activeBoardId);
    if (!board) return [];
    return state.tasks.filter((t) => board.taskIds.includes(t.id) && t.dueDate <= today && t.status !== "completado" && !t.archivedAt);
  },

  getArchivedTasks: () => {
    const state = get();
    const board = state.boards.find((b) => b.id === state.activeBoardId);
    if (!board) return [];
    return state.tasks.filter((t) => board.taskIds.includes(t.id) && !!t.archivedAt);
  },

  getAllTags: () => get().tags,

  // Undo / Redo
  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const lastAction = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);

    if (lastAction.action === "deleteTask") {
      const { task, boardId } = lastAction.data;
      // Remove from sidebar trash
      try {
        const useSidebarStore = getSidebarStore();
        const ss = useSidebarStore.getState();
        useSidebarStore.setState({ trash: ss.trash.filter((t: { id: string }) => t.id !== task.id) });
      } catch { /* ignore */ }
      // Restore task
      set({
        tasks: [...state.tasks, task],
        boards: state.boards.map((b) => b.id === boardId ? { ...b, taskIds: [...b.taskIds, task.id] } : b),
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, lastAction],
      });
      return;
    }

    if (lastAction.action === "moveTask") {
      const { taskId, fromStatus } = lastAction.data;
      set({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status: fromStatus } : t),
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, lastAction],
      });
      return;
    }

    // Default: just pop
    set({ undoStack: newUndoStack, redoStack: [...state.redoStack, lastAction] });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const lastAction = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);

    if (lastAction.action === "deleteTask") {
      const { task, boardId } = lastAction.data;
      set({
        tasks: state.tasks.filter((t) => t.id !== task.id),
        boards: state.boards.map((b) => b.id === boardId ? { ...b, taskIds: b.taskIds.filter((id) => id !== task.id) } : b),
        undoStack: [...state.undoStack, lastAction],
        redoStack: newRedoStack,
      });
      return;
    }

    if (lastAction.action === "moveTask") {
      const { taskId, toStatus } = lastAction.data;
      set({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status: toStatus } : t),
        undoStack: [...state.undoStack, lastAction],
        redoStack: newRedoStack,
      });
      return;
    }

    set({ undoStack: [...state.undoStack, lastAction], redoStack: newRedoStack });
  },

  // Archive
  archiveTask: (taskId) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archivedAt: new Date().toISOString() } : t),
  })),
  unarchiveTask: (taskId) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archivedAt: null } : t),
  })),
  archiveCompleted: () => set((s) => {
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return s;
    const now = new Date().toISOString();
    return {
      tasks: s.tasks.map((t) => board.taskIds.includes(t.id) && t.status === "completado" && !t.archivedAt ? { ...t, archivedAt: now } : t),
    };
  }),

  // Tags
  tags: [
    { id: "tag_1", name: "Urgente", color: "#ef4444" },
    { id: "tag_2", name: "Bloqueada", color: "#f97316" },
    { id: "tag_3", name: "Esperando aprobación", color: "#eab308" },
    { id: "tag_4", name: "Nuevo producto", color: "#22c55e" },
    { id: "tag_5", name: "Seasonal", color: "#3b82f6" },
  ],
  addTag: (tag) => set((s) => ({ tags: [...s.tags, tag] })),
  removeTag: (tagId) => set((s) => ({ tags: s.tags.filter((t) => t.id !== tagId) })),
  updateTag: (tagId, updates) => set((s) => ({ tags: s.tags.map((t) => t.id === tagId ? { ...t, ...updates } : t) })),

  // Task templates
  taskTemplates: [
    { id: "tmpl_1", name: "Nueva campaña Facebook", title: "Campaña Facebook — ", priority: "alta" as Priority, campaignType: "Conversión", subtasks: ["Brief", "Creativos", "Copy", "Segmentación", "Lanzamiento"], tags: [] },
    { id: "tmpl_2", name: "Nuevo producto", title: "Nuevo producto — ", priority: "media" as Priority, subtasks: ["Fotos", "Descripción", "Landing", "Campaña"], tags: [] },
    { id: "tmpl_3", name: "Reporte semanal", title: "Reporte semanal — ", priority: "baja" as Priority, campaignType: "TOF", subtasks: [], tags: [] },
  ],
  addTaskTemplate: (t) => set((s) => ({ taskTemplates: [...s.taskTemplates, t] })),
  removeTaskTemplate: (id) => set((s) => ({ taskTemplates: s.taskTemplates.filter((t) => t.id !== id) })),
  addTaskFromTemplate: (templateId, status) => set((s) => {
    const tmpl = s.taskTemplates.find((t) => t.id === templateId);
    if (!tmpl) return s;
    const newId = `t${Date.now()}`;
    const newTask: Task = {
      id: newId, title: tmpl.title, status: status ?? "por_hacer", priority: tmpl.priority,
      store: tmpl.store ?? "", assigneeId: "", campaignType: tmpl.campaignType ?? "",
      campaignName: "", adAccount: "", dueDate: "", urls: [], attachments: [],
      comments: [], activity: [{ id: `a${Date.now()}`, authorId: "u1", action: "creó tarea desde plantilla", createdAt: new Date().toISOString() }],
      subtasks: tmpl.subtasks.map((title, i) => ({ id: `sub_${Date.now()}_${i}`, title, completed: false })),
      tags: tmpl.tags ?? [],
    };
    return {
      tasks: [...s.tasks, newTask],
      boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b),
    };
  }),
}), {
  name: "mh-board-storage",
  version: 1,
  partialize: (state) => ({
    boards: state.boards,
    tasks: state.tasks,
    activeBoardId: state.activeBoardId,
    customStores: state.customStores,
    customCampaignTypes: state.customCampaignTypes,
    customAdAccounts: state.customAdAccounts,
    customTeamMembers: state.customTeamMembers,
    customViews: state.customViews,
    tags: state.tags,
    taskTemplates: state.taskTemplates,
    viewMode: state.viewMode,
    activeViewId: state.activeViewId,
  }),
}));
