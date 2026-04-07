"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, Status, Board, TeamMember, Subtask, SavedView, ReminderOption, Priority, Tag, TaskTemplate } from "@/types";
import { COLUMNS, TEAM_MEMBERS, STORES, CAMPAIGN_TYPES } from "@/lib/mock-data";


// Lazy import to avoid circular dependency
function getSidebarStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/stores/sidebar-store").useSidebarStore;
}

const BUILT_IN_VIEWS: SavedView[] = [
  { id: "v_all", name: "Todas las tareas", icon: "star", builtIn: true, filters: {} },
  { id: "v_status", name: "Por estado", icon: "chart", builtIn: true, filters: { groupByStatus: true } },
  { id: "v_mine", name: "Mis tareas", icon: "user", builtIn: true, filters: { assigneeId: "__CURRENT_USER__" } },
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
  serverTeamMembers: TeamMember[];
  _serverLoaded: boolean;

  loadFromServer: (workspaceId: string) => Promise<boolean>;
  refreshFromServer: (workspaceId: string) => Promise<void>;
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
  addQuickTask: (title: string, overrides?: { status?: Status; dueDate?: string }) => void;
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
  // URL actions
  addTaskUrl: (taskId: string, url: string) => void;
  removeTaskUrl: (taskId: string, urlId: string) => void;
  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  reorderSubtasks: (taskId: string, subtasks: Subtask[]) => void;
  // Comments
  addComment: (taskId: string, content: string) => void;
  // Tags (relation-safe)
  addTaskTag: (taskId: string, tagId: string) => void;
  removeTaskTag: (taskId: string, tagId: string) => void;
  // Dependencies (relation-safe)
  addDependency: (taskId: string, blockerTaskId: string) => void;
  removeDependency: (taskId: string, blockerTaskId: string) => void;
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

// ── Get current user ID from auth store ──

function getCurrentUserId(): string {
  try {
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    return authData?.state?.currentUser?.id || "";
  } catch { return ""; }
}

// ── API helpers (fire-and-forget with error logging) ──

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const userId = getCurrentUserId();
  if (userId) headers["x-user-id"] = userId;
  return headers;
}

function apiPatchTask(taskId: string, data: Record<string, unknown>) {
  const hasDesc = "description" in data;
  if (hasDesc) console.log("[API PATCH] sending description for task", taskId, ":", String(data.description).substring(0, 80));
  return fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (hasDesc) console.log("[API PATCH] response status:", res.status);
    if (!res.ok) {
      const t = await res.text().catch(() => "unknown error");
      console.error("[API PATCH] FAILED:", res.status, t);
      return { ok: false, status: res.status, error: t };
    }
    return { ok: true, status: res.status };
  }).catch((e) => {
    console.error("[API PATCH] network error:", e);
    return { ok: false, status: 0, error: String(e) };
  });
}

function apiDeleteTask(taskId: string) {
  fetch(`/api/tasks/${taskId}`, { method: "DELETE", headers: getAuthHeaders() }).catch((e) => console.error("API delete task error:", e));
}

function apiPatchBoard(boardId: string, data: Record<string, unknown>) {
  fetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).catch((e) => console.error("API patch board error:", e));
}

function apiDeleteBoard(boardId: string) {
  fetch(`/api/boards/${boardId}`, { method: "DELETE", headers: getAuthHeaders() }).catch((e) => console.error("API delete board error:", e));
}

// ── Transform Prisma API data to frontend types ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformApiTask(apiTask: any): Task {
  return {
    id: apiTask.id,
    title: apiTask.title || "",
    status: apiTask.status || "por_hacer",
    priority: apiTask.priority || "media",
    store: apiTask.store || "",
    assigneeId: apiTask.assigneeId || "",
    campaignType: apiTask.campaignType || "",
    campaignName: apiTask.campaignName || "",
    adAccount: apiTask.adAccount || "",
    dueDate: apiTask.dueDate ? new Date(apiTask.dueDate).toISOString().split("T")[0] : "",
    description: apiTask.description ?? "",
    urls: (apiTask.urls || []).map((u: { id: string; url: string }) => ({ id: u.id, url: u.url })),
    attachments: (apiTask.attachments || []).map((a: { id: string; name: string; size: number; type?: string; url?: string }) => ({
      id: a.id,
      name: a.name,
      size: a.size >= 1048576 ? `${(a.size / 1048576).toFixed(1)} MB` : `${(a.size / 1024).toFixed(0)} KB`,
      type: a.type,
      url: a.url,
    })),
    comments: (apiTask.comments || []).map((c: { id: string; authorId: string; content: string; createdAt: string }) => ({
      id: c.id,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
    })),
    activity: (apiTask.activities || []).map((a: { id: string; userId: string; action: string; field?: string; oldValue?: string; newValue?: string; createdAt: string }) => ({
      id: a.id,
      authorId: a.userId,
      action: a.action,
      field: a.field,
      oldValue: a.oldValue,
      newValue: a.newValue,
      createdAt: a.createdAt,
    })),
    subtasks: (apiTask.subtasks || []).map((s: { id: string; title: string; completed: boolean }) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
    })),
    tags: (apiTask.tags || []).map((t: { tag: { id: string } }) => t.tag.id),
    reminder: apiTask.reminder || undefined,
    archivedAt: apiTask.archivedAt || null,
    blockedBy: (apiTask.blockedBy || []).map((d: { blocker: { id: string } }) => d.blocker.id),
    estimatedTime: apiTask.estimatedTime || undefined,
    estimatedUnit: apiTask.estimatedUnit || undefined,
    actualTime: apiTask.realTime || undefined,
    actualUnit: apiTask.realUnit || undefined,
    coverImage: apiTask.coverImage || null,
  };
}

// Map server column names to frontend status IDs
const COLUMN_NAME_TO_STATUS: Record<string, string> = {
  "por hacer": "por_hacer",
  "en proceso": "en_proceso",
  "en revisión": "en_revision",
  "completado": "completado",
};

function columnNameToStatusId(name: string): string {
  return COLUMN_NAME_TO_STATUS[name.toLowerCase()] || name.toLowerCase().replace(/\s+/g, "_");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformApiBoard(apiBoard: any, taskIds: string[]): Board {
  return {
    id: apiBoard.id,
    name: apiBoard.name,
    columns: (apiBoard.columns || []).map((c: { id: string; name: string; color?: string }) => ({
      id: columnNameToStatusId(c.name),
      title: c.name,
      serverId: c.id, // Keep the real server UUID for API calls
    })),
    taskIds,
  };
}

export const useBoardStore = create<BoardState>()(persist((set, get) => ({
  boards: [],
  tasks: [],
  activeBoardId: "",
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
  serverTeamMembers: [],
  savedViews: BUILT_IN_VIEWS,
  activeViewId: "v_all",
  customViews: [],
  _serverLoaded: false,

  // ── Load all boards + tasks from server ──
  loadFromServer: async (workspaceId: string) => {
    try {
      // 1. Fetch boards + workspace members in parallel
      const authH = { headers: getAuthHeaders() };
      const [boardsRes, wsRes] = await Promise.all([
        fetch(`/api/boards?workspaceId=${workspaceId}`, authH),
        fetch(`/api/workspace?workspaceId=${workspaceId}`, authH),
      ]);
      if (!boardsRes.ok) {
        console.error("Failed to load boards:", boardsRes.status, await boardsRes.text().catch(() => ""));
        return false;
      }
      const apiBoards = await boardsRes.json();

      // 2. Parse workspace members
      let serverMembers: TeamMember[] = [];
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        serverMembers = (wsData.members || []).map((m: { id: string; name: string; avatarColor?: string; role?: string }) => ({
          id: m.id,
          name: m.name,
          avatar: m.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
          role: m.role || "editor",
          color: m.avatarColor,
        }));
      }

      // 3. Fetch tasks for each board in parallel
      const taskResults = await Promise.all(
        apiBoards.map((b: { id: string }) =>
          fetch(`/api/tasks?boardId=${b.id}`, { headers: getAuthHeaders() }).then((r) => r.ok ? r.json() : [])
        )
      );

      // 4. Transform and collect
      const allTasks: Task[] = [];
      const boards: Board[] = [];
      for (let i = 0; i < apiBoards.length; i++) {
        const apiTasks = taskResults[i] || [];
        const tasks = apiTasks.map(transformApiTask);
        allTasks.push(...tasks);
        boards.push(transformApiBoard(apiBoards[i], tasks.map((t: Task) => t.id)));
      }

      const state = get();

      set({
        boards,
        tasks: allTasks,
        serverTeamMembers: serverMembers,
        activeBoardId: state.activeBoardId && boards.some((b) => b.id === state.activeBoardId)
          ? state.activeBoardId
          : boards[0]?.id || "",
        _serverLoaded: true,
      });
      return true;
    } catch (e) {
      console.error("Error loading from server:", e);
      return false;
    }
  },

  // ── Refresh without resetting UI state ──
  refreshFromServer: async (workspaceId: string) => {
    try {
      const boardsRes = await fetch(`/api/boards?workspaceId=${workspaceId}`, { headers: getAuthHeaders() });
      if (!boardsRes.ok) return;
      const apiBoards = await boardsRes.json();

      const taskResults = await Promise.all(
        apiBoards.map((b: { id: string }) =>
          fetch(`/api/tasks?boardId=${b.id}`, { headers: getAuthHeaders() }).then((r) => r.ok ? r.json() : [])
        )
      );

      const allTasks: Task[] = [];
      const boards: Board[] = [];
      for (let i = 0; i < apiBoards.length; i++) {
        const apiTasks = taskResults[i] || [];
        const tasks = apiTasks.map(transformApiTask);
        allTasks.push(...tasks);
        boards.push(transformApiBoard(apiBoards[i], tasks.map((t: Task) => t.id)));
      }

      const state = get();
      set({
        boards,
        tasks: allTasks,
        activeBoardId: state.activeBoardId && boards.some((b) => b.id === state.activeBoardId)
          ? state.activeBoardId
          : boards[0]?.id || "",
      });
    } catch (e) {
      console.error("Error refreshing from server:", e);
    }
  },

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
          id: `a${Date.now()}_move`, authorId: getCurrentUserId(),
          action: `movió de "${statusLabels[oldStatus]}" a "${statusLabels[newStatus]}"`,
          field: "status", oldValue: statusLabels[oldStatus], newValue: statusLabels[newStatus],
          createdAt: new Date().toISOString(),
        }] } : t
      ),
      undoStack: [...s.undoStack, { action: "moveTask", data: { taskId, fromStatus: oldStatus, toStatus: newStatus } }].slice(-30),
      redoStack: [],
    }));
    // Persist to server (status + activity)
    const userId = getCurrentUserId();
    apiPatchTask(taskId, {
      status: newStatus,
      _addActivity: {
        action: `movió de "${statusLabels[oldStatus]}" a "${statusLabels[newStatus]}"`,
        field: "status",
        oldValue: statusLabels[oldStatus],
        newValue: statusLabels[newStatus],
        userId,
      },
    });
  },

  updateTaskWithActivity: (taskId, updates, authorId = getCurrentUserId()) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const allMembers = state.serverTeamMembers.length > 0 ? [...state.serverTeamMembers, ...state.customTeamMembers] : [...TEAM_MEMBERS, ...state.customTeamMembers];
    const newEntries = buildActivityEntries(task, updates, authorId, allMembers);
    set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, ...updates, activity: [...t.activity, ...newEntries] } : t) }));
    // Persist relevant fields + activity to server
    const serverUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (["activity", "comments", "attachments", "urls", "subtasks", "tags", "blockedBy"].includes(key)) continue;
      if (key === "actualTime") { serverUpdates.realTime = value; continue; }
      if (key === "actualUnit") { serverUpdates.realUnit = value; continue; }
      if (key === "dueDate" && value) serverUpdates.dueDate = value;
      else serverUpdates[key] = value;
    }
    // Send first activity entry to server
    if (newEntries.length > 0) {
      const entry = newEntries[0];
      serverUpdates._addActivity = { action: entry.action, field: entry.field, oldValue: entry.oldValue, newValue: entry.newValue, userId: authorId };
    }
    if (Object.keys(serverUpdates).length > 0) {
      apiPatchTask(taskId, serverUpdates);
    }
  },

  updateTask: (taskId, updates) => {
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t) }));
    // Persist relevant fields to server
    const serverUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (["activity", "comments", "attachments", "urls", "subtasks", "tags", "blockedBy"].includes(key)) continue;
      if (key === "actualTime") { serverUpdates.realTime = value; continue; }
      if (key === "actualUnit") { serverUpdates.realUnit = value; continue; }
      if (key === "dueDate" && value) serverUpdates.dueDate = value;
      else serverUpdates[key] = value;
    }
    if (Object.keys(serverUpdates).length > 0) {
      apiPatchTask(taskId, serverUpdates).then((result) => {
        if ("description" in serverUpdates) {
          if (result?.ok) {
            console.log("[updateTask] description saved OK to server");
          } else {
            console.error("[updateTask] description FAILED to save:", result?.status, result?.error);
          }
        }
      });
    }
  },

  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
      boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, task.id] } : b),
    }));
    // Persist to server - the task was created locally with a temp ID
    // We POST to create it on the server, then update the local ID
    const state = get();
    const boardId = state.activeBoardId;
    fetch("/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        boardId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        store: task.store || undefined,
        assigneeId: task.assigneeId || undefined,
        campaignType: task.campaignType || undefined,
        campaignName: task.campaignName || undefined,
        adAccount: task.adAccount || undefined,
        dueDate: task.dueDate || undefined,
      }),
    }).then((r) => r.json()).then((saved) => {
      // Replace temp ID with server ID
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === task.id ? { ...t, id: saved.id } : t),
        boards: s.boards.map((b) => ({
          ...b,
          taskIds: b.taskIds.map((id) => id === task.id ? saved.id : id),
        })),
        selectedTaskId: s.selectedTaskId === task.id ? saved.id : s.selectedTaskId,
      }));
    }).catch((e) => console.error("API create task error:", e));
  },

  addQuickTask: (title, overrides?: { status?: Status; dueDate?: string }) => {
    const newId = `t${Date.now()}`;
    const status = overrides?.status || "por_hacer";
    const dueDate = overrides?.dueDate || new Date().toISOString().split("T")[0];
    const newTask: Task = {
      id: newId, title, status, priority: "media", store: "", assigneeId: getCurrentUserId(),
      campaignType: "", campaignName: "", adAccount: "", dueDate,
      urls: [], attachments: [], comments: [], activity: [
        { id: `a${Date.now()}_create`, authorId: getCurrentUserId(), action: "creó la tarea", createdAt: new Date().toISOString() }
      ], subtasks: [],
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b),
    }));
    // Persist to server — include status and dueDate in the initial POST to avoid race condition
    const state = get();
    fetch("/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        boardId: state.activeBoardId,
        title,
        status,
        priority: "media",
        dueDate,
      }),
    }).then((r) => r.json()).then((saved) => {
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === newId ? { ...t, id: saved.id } : t),
        boards: s.boards.map((b) => ({
          ...b,
          taskIds: b.taskIds.map((id) => id === newId ? saved.id : id),
        })),
        selectedTaskId: s.selectedTaskId === newId ? saved.id : s.selectedTaskId,
      }));
    }).catch((e) => console.error("API quick task error:", e));
  },

  addBoard: (name) => {
    const newId = `b${Date.now()}`;
    set((state) => ({
      boards: [...state.boards, { id: newId, name, columns: COLUMNS, taskIds: [] }],
      activeBoardId: newId,
    }));
    // Persist to server
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    const workspaceId = authData?.state?.currentUser?.workspaceId;
    if (workspaceId) {
      fetch("/api/boards", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, workspaceId }),
      }).then((r) => r.json()).then((saved) => {
        const serverBoard = transformApiBoard(saved, []);
        set((s) => ({
          boards: s.boards.map((b) => b.id === newId ? serverBoard : b),
          activeBoardId: s.activeBoardId === newId ? saved.id : s.activeBoardId,
        }));
      }).catch((e) => console.error("API create board error:", e));
    }
  },

  renameBoard: (id, name) => {
    set((state) => ({ boards: state.boards.map((b) => b.id === id ? { ...b, name } : b) }));
    apiPatchBoard(id, { name });
  },

  deleteBoard: (id) => {
    set((state) => {
      if (state.boards.length <= 1) return state;
      const remaining = state.boards.filter((b) => b.id !== id);
      return { boards: remaining, activeBoardId: state.activeBoardId === id ? remaining[0].id : state.activeBoardId };
    });
    apiDeleteBoard(id);
  },

  duplicateBoard: (id) => {
    const state = get();
    const board = state.boards.find((b) => b.id === id);
    if (!board) return;
    const newBoardId = `b${Date.now()}`;
    const newTaskIds: string[] = [];
    const newTasks: Task[] = [];
    for (const tid of board.taskIds) {
      const task = state.tasks.find((t) => t.id === tid);
      if (task) {
        const ntid = `t${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        newTaskIds.push(ntid);
        newTasks.push({ ...task, id: ntid, title: task.title, comments: [], activity: [{ id: `a${Date.now()}`, authorId: getCurrentUserId(), action: "duplicó la tarea", createdAt: new Date().toISOString() }] });
      }
    }
    set((s) => ({
      boards: [...s.boards, { ...board, id: newBoardId, name: `${board.name} (copia)`, taskIds: newTaskIds }],
      tasks: [...s.tasks, ...newTasks],
      activeBoardId: newBoardId,
    }));
    // Persist: create board on server, then create tasks
    const authData = JSON.parse(localStorage.getItem("mh-auth-storage") || "{}");
    const workspaceId = authData?.state?.currentUser?.workspaceId;
    if (workspaceId) {
      fetch("/api/boards", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: `${board.name} (copia)`, workspaceId }),
      }).then((r) => r.json()).then((savedBoard) => {
        set((s) => ({
          boards: s.boards.map((b) => b.id === newBoardId ? { ...b, id: savedBoard.id } : b),
          activeBoardId: s.activeBoardId === newBoardId ? savedBoard.id : s.activeBoardId,
        }));
        // Create tasks for the new board
        for (const nt of newTasks) {
          fetch("/api/tasks", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ boardId: savedBoard.id, title: nt.title, status: nt.status, priority: nt.priority, store: nt.store || undefined, assigneeId: nt.assigneeId || undefined }),
          }).catch((e) => console.error("API duplicate board task error:", e));
        }
      }).catch((e) => console.error("API duplicate board error:", e));
    }
  },

  removeAttachment: (taskId, index) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    const att = task?.attachments[index];
    set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, attachments: t.attachments.filter((_, i) => i !== index) } : t) }));
    // Delete from server if it has an id
    if (att?.id) {
      fetch(`/api/attachments?id=${att.id}`, { method: "DELETE", headers: getAuthHeaders() }).catch((e) => console.error("API delete attachment error:", e));
    }
  },

  reorderBoardTasks: (taskIds) =>
    set((state) => ({
      boards: state.boards.map((b) => b.id === state.activeBoardId ? { ...b, taskIds } : b),
    })),

  reorderBoards: (boardIds) =>
    set((state) => ({
      boards: boardIds.map((id) => state.boards.find((b) => b.id === id)!).filter(Boolean),
    })),

  addColumn: (title, afterColumnId, beforeColumnId) => {
    const s = get();
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return;
    const newColId = `col_${Date.now()}`;
    const newCol = { id: newColId, title };
    const cols = [...board.columns];
    let position = cols.length;
    if (beforeColumnId) {
      const idx = cols.findIndex((c) => c.id === beforeColumnId);
      cols.splice(Math.max(0, idx), 0, newCol);
      position = Math.max(0, idx);
    } else if (afterColumnId) {
      const idx = cols.findIndex((c) => c.id === afterColumnId);
      cols.splice(idx + 1, 0, newCol);
      position = idx + 1;
    } else {
      cols.push(newCol);
    }
    set((st) => ({ boards: st.boards.map((b) => b.id === st.activeBoardId ? { ...b, columns: cols } : b) }));
    // Persist to server
    fetch("/api/columns", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ boardId: s.activeBoardId, name: title, position }),
    }).then((r) => r.json()).then((saved) => {
      set((st) => ({
        boards: st.boards.map((b) => b.id === st.activeBoardId
          ? { ...b, columns: b.columns.map((c) => c.id === newColId ? { ...c, id: columnNameToStatusId(saved.name) } : c) }
          : b),
      }));
    }).catch((e) => console.error("API add column error:", e));
  },

  removeColumn: (columnId) => {
    const s = get();
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return;
    const col = board.columns.find((c) => c.id === columnId);
    const realId = col?.serverId || columnId;
    set((st) => ({
      boards: st.boards.map((b) => b.id === st.activeBoardId ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) } : b),
      tasks: st.tasks.map((t) => board.taskIds.includes(t.id) && t.status === columnId as Status ? { ...t, status: "por_hacer" as Status } : t),
    }));
    // Use the real server UUID for the delete
    fetch(`/api/columns?id=${realId}`, { method: "DELETE", headers: getAuthHeaders() })
      .catch((e) => console.error("API delete column error:", e));
  },

  renameColumn: (columnId, title) => {
    const s = get();
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    const col = board?.columns.find((c) => c.id === columnId);
    const realId = col?.serverId || columnId;
    set((st) => ({
      boards: st.boards.map((b) => b.id === st.activeBoardId ? { ...b, columns: b.columns.map((c) => c.id === columnId ? { ...c, title } : c) } : b),
    }));
    fetch("/api/columns", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: realId, name: title }),
    }).catch((e) => console.error("API rename column error:", e));
  },

  setColumnColor: (columnId, color) => {
    const s = get();
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    const col = board?.columns.find((c) => c.id === columnId);
    const realId = col?.serverId || columnId;
    set((st) => ({
      boards: st.boards.map((b) => b.id === st.activeBoardId ? { ...b, columns: b.columns.map((c) => c.id === columnId ? { ...c, color } : c) } : b),
    }));
    fetch("/api/columns", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: realId, color }),
    }).catch((e) => console.error("API set column color error:", e));
  },

  addCustomStore: (store) => set((s) => ({ customStores: s.customStores.includes(store) ? s.customStores : [...s.customStores, store] })),
  removeCustomStore: (store) => set((s) => ({ customStores: s.customStores.filter((x) => x !== store) })),
  addCustomCampaignType: (type) => set((s) => ({ customCampaignTypes: s.customCampaignTypes.includes(type) ? s.customCampaignTypes : [...s.customCampaignTypes, type] })),
  removeCustomCampaignType: (type) => set((s) => ({ customCampaignTypes: s.customCampaignTypes.filter((x) => x !== type) })),
  addCustomAdAccount: (account) => set((s) => ({ customAdAccounts: s.customAdAccounts.includes(account) ? s.customAdAccounts : [...s.customAdAccounts, account] })),
  removeCustomAdAccount: (account) => set((s) => ({ customAdAccounts: s.customAdAccounts.filter((x) => x !== account) })),
  addTeamMember: (member) => set((s) => ({ customTeamMembers: [...s.customTeamMembers, member] })),
  removeTeamMember: (memberId) => set((s) => ({ customTeamMembers: s.customTeamMembers.filter((m) => m.id !== memberId) })),
  updateTeamMember: (memberId, updates) => set((s) => ({ customTeamMembers: s.customTeamMembers.map((m) => m.id === memberId ? { ...m, ...updates } : m) })),

  duplicateTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newId = `t${Date.now()}`;
    const newTask: Task = { ...task, id: newId, title: `${task.title} (copia)`, comments: [], subtasks: [...(task.subtasks ?? []).map((s) => ({ ...s, id: `st${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }))], activity: [{ id: `a${Date.now()}_create`, authorId: getCurrentUserId(), action: "duplicó la tarea", createdAt: new Date().toISOString() }] };
    set((s) => ({ tasks: [...s.tasks, newTask], boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b) }));
    // Persist to server
    fetch("/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        boardId: state.activeBoardId,
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        store: newTask.store || undefined,
        assigneeId: newTask.assigneeId || undefined,
        campaignType: newTask.campaignType || undefined,
        dueDate: newTask.dueDate || undefined,
      }),
    }).then((r) => r.json()).then((saved) => {
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === newId ? { ...t, id: saved.id } : t),
        boards: s.boards.map((b) => ({ ...b, taskIds: b.taskIds.map((id) => id === newId ? saved.id : id) })),
      }));
    }).catch((e) => console.error("API duplicate task error:", e));
  },

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
    // Soft delete on server
    apiDeleteTask(taskId);
  },

  // URLs
  addTaskUrl: (taskId, url) => {
    const tempId = `url_${Date.now()}`;
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, urls: [...t.urls, { id: tempId, url }] } : t),
    }));
    // Persist and update with real ID from server
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ _addUrl: url }),
    }).then((res) => res.json()).then((saved) => {
      const realUrls = (saved.urls || []).map((u: { id: string; url: string }) => ({ id: u.id, url: u.url }));
      set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, urls: realUrls } : t),
      }));
    }).catch((e) => console.error("API add url error:", e));
  },

  removeTaskUrl: (taskId, urlId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, urls: t.urls.filter((u) => u.id !== urlId) } : t),
    }));
    apiPatchTask(taskId, { _removeUrl: urlId });
  },

  // Subtasks
  addSubtask: (taskId, title) => {
    const subId = `st${Date.now()}`;
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), { id: subId, title, completed: false }] } : t),
    }));
    apiPatchTask(taskId, { _addSubtask: title });
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s) } : t),
    }));
    apiPatchTask(taskId, { _toggleSubtask: subtaskId });
  },

  removeSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) } : t),
    }));
    apiPatchTask(taskId, { _removeSubtask: subtaskId });
  },

  reorderSubtasks: (taskId, subtasks) =>
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t) })),

  // ── Comments ──
  addComment: (taskId: string, content: string) => {
    const userId = getCurrentUserId();
    const tempId = `c${Date.now()}`;
    const allMembers = get().getAllTeamMembers();
    const author = allMembers.find((m) => m.id === userId);
    const newComment = { id: tempId, authorId: userId, authorName: author?.name || "Tú", content, createdAt: new Date().toISOString() };
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t),
    }));
    apiPatchTask(taskId, { _addComment: { content, authorId: userId } });
  },

  // ── Tags (relation-safe) ──
  addTaskTag: (taskId: string, tagId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, tags: [...(t.tags ?? []).filter((id) => id !== tagId), tagId] } : t),
    }));
    apiPatchTask(taskId, { _addTag: tagId });
  },
  removeTaskTag: (taskId: string, tagId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, tags: (t.tags ?? []).filter((id) => id !== tagId) } : t),
    }));
    apiPatchTask(taskId, { _removeTag: tagId });
  },

  // ── Dependencies (relation-safe) ──
  addDependency: (taskId: string, blockerTaskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, blockedBy: [...(t.blockedBy ?? []).filter((id) => id !== blockerTaskId), blockerTaskId] } : t),
    }));
    apiPatchTask(taskId, { _addDependency: blockerTaskId });
  },
  removeDependency: (taskId: string, blockerTaskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, blockedBy: (t.blockedBy ?? []).filter((id) => id !== blockerTaskId) } : t),
    }));
    apiPatchTask(taskId, { _removeDependency: blockerTaskId });
  },

  setReminder: (taskId, reminder) => {
    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, reminder } : t) }));
    apiPatchTask(taskId, { reminder });
  },

  // Bulk
  bulkMove: (taskIds, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, status, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: getCurrentUserId(), action: `movió a "${statusLabels[status]}"`, field: "status", newValue: statusLabels[status], createdAt: new Date().toISOString() }] } : t),
    }));
    taskIds.forEach((id) => apiPatchTask(id, { status }));
  },

  bulkAssign: (taskIds, assigneeId) => {
    set((state) => {
      const allMembers = [...TEAM_MEMBERS, ...state.customTeamMembers];
      const name = allMembers.find((m) => m.id === assigneeId)?.name ?? assigneeId;
      return { tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, assigneeId, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: getCurrentUserId(), action: `asignó a "${name}"`, field: "assigneeId", newValue: name, createdAt: new Date().toISOString() }] } : t) };
    });
    taskIds.forEach((id) => apiPatchTask(id, { assigneeId }));
  },

  bulkPriority: (taskIds, priority) => {
    set((state) => ({
      tasks: state.tasks.map((t) => taskIds.includes(t.id) ? { ...t, priority, activity: [...t.activity, { id: `a${Date.now()}_bulk`, authorId: getCurrentUserId(), action: `cambió prioridad a "${priority}"`, field: "priority", newValue: priority, createdAt: new Date().toISOString() }] } : t),
    }));
    taskIds.forEach((id) => apiPatchTask(id, { priority }));
  },

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
    taskIds.forEach((id) => apiDeleteTask(id));
  },

  bulkDuplicate: (taskIds) => {
    const state = get();
    const newTasks: Task[] = [];
    const newIds: string[] = [];
    for (const id of taskIds) {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) continue;
      const newId = `t${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      newTasks.push({ ...task, id: newId, title: `${task.title} (copia)`, comments: [], activity: [{ id: `a${Date.now()}_dup`, authorId: getCurrentUserId(), action: "duplicó la tarea", createdAt: new Date().toISOString() }] });
      newIds.push(newId);
    }
    set((s) => ({ tasks: [...s.tasks, ...newTasks], boards: s.boards.map((b) => b.id === s.activeBoardId ? { ...b, taskIds: [...b.taskIds, ...newIds] } : b) }));
    // Persist each duplicated task
    for (const nt of newTasks) {
      fetch("/api/tasks", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ boardId: state.activeBoardId, title: nt.title, status: nt.status, priority: nt.priority, store: nt.store || undefined, assigneeId: nt.assigneeId || undefined }),
      }).then((r) => r.json()).then((saved) => {
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === nt.id ? { ...t, id: saved.id } : t),
          boards: s.boards.map((b) => ({ ...b, taskIds: b.taskIds.map((tid) => tid === nt.id ? saved.id : tid) })),
        }));
      }).catch((e) => console.error("API bulk duplicate error:", e));
    }
  },

  addCustomView: (name, filters) =>
    set((s) => ({ customViews: [...s.customViews, { id: `cv_${Date.now()}`, name, icon: "star", builtIn: false, filters }] })),

  getAllStores: () => { const s = get(); return [...STORES, ...s.customStores]; },
  getAllCampaignTypes: () => { const s = get(); return [...CAMPAIGN_TYPES, ...s.customCampaignTypes]; },
  getAllAdAccounts: () => { const s = get(); return [...DEFAULT_AD_ACCOUNTS, ...s.customAdAccounts]; },
  getAllTeamMembers: () => { const s = get(); return s.serverTeamMembers.length > 0 ? [...s.serverTeamMembers, ...s.customTeamMembers] : [...TEAM_MEMBERS, ...s.customTeamMembers]; },
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
      if (view.filters.assigneeId) {
        const filterAssignee = view.filters.assigneeId === "__CURRENT_USER__" ? getCurrentUserId() : view.filters.assigneeId;
        result = result.filter((t) => t.assigneeId === filterAssignee);
      }
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
      // Restore task locally
      set({
        tasks: [...state.tasks, task],
        boards: state.boards.map((b) => b.id === boardId ? { ...b, taskIds: [...b.taskIds, task.id] } : b),
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, lastAction],
      });
      // Restore on server (clear soft-delete)
      apiPatchTask(task.id, { deletedAt: null });
      return;
    }

    if (lastAction.action === "moveTask") {
      const { taskId, fromStatus } = lastAction.data;
      set({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status: fromStatus } : t),
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, lastAction],
      });
      apiPatchTask(taskId, { status: fromStatus });
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
      apiDeleteTask(task.id);
      return;
    }

    if (lastAction.action === "moveTask") {
      const { taskId, toStatus } = lastAction.data;
      set({
        tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status: toStatus } : t),
        undoStack: [...state.undoStack, lastAction],
        redoStack: newRedoStack,
      });
      apiPatchTask(taskId, { status: toStatus });
      return;
    }

    set({ undoStack: [...state.undoStack, lastAction], redoStack: newRedoStack });
  },

  // Archive
  archiveTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archivedAt: new Date().toISOString() } : t),
    }));
    apiPatchTask(taskId, { archivedAt: new Date().toISOString() });
  },
  unarchiveTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, archivedAt: null } : t),
    }));
    apiPatchTask(taskId, { archivedAt: null });
  },
  archiveCompleted: () => set((s) => {
    const board = s.boards.find((b) => b.id === s.activeBoardId);
    if (!board) return s;
    const now = new Date().toISOString();
    const toArchive = s.tasks.filter((t) => board.taskIds.includes(t.id) && t.status === "completado" && !t.archivedAt);
    toArchive.forEach((t) => apiPatchTask(t.id, { archivedAt: now }));
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
  addTaskFromTemplate: (templateId, status) => {
    const s = get();
    const tmpl = s.taskTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;
    const newId = `t${Date.now()}`;
    const newTask: Task = {
      id: newId, title: tmpl.title, status: status ?? "por_hacer", priority: tmpl.priority,
      store: tmpl.store ?? "", assigneeId: getCurrentUserId(), campaignType: tmpl.campaignType ?? "",
      campaignName: "", adAccount: "", dueDate: "", urls: [], attachments: [],
      comments: [], activity: [{ id: `a${Date.now()}`, authorId: getCurrentUserId(), action: "creó tarea desde plantilla", createdAt: new Date().toISOString() }],
      subtasks: tmpl.subtasks.map((title, i) => ({ id: `sub_${Date.now()}_${i}`, title, completed: false })),
      tags: tmpl.tags ?? [],
    };
    set((st) => ({
      tasks: [...st.tasks, newTask],
      boards: st.boards.map((b) => b.id === st.activeBoardId ? { ...b, taskIds: [...b.taskIds, newId] } : b),
    }));
    // Persist to server
    fetch("/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        boardId: s.activeBoardId,
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
        store: newTask.store || undefined,
        assigneeId: newTask.assigneeId || undefined,
        campaignType: newTask.campaignType || undefined,
      }),
    }).then((r) => r.json()).then((saved) => {
      set((st) => ({
        tasks: st.tasks.map((t) => t.id === newId ? { ...t, id: saved.id } : t),
        boards: st.boards.map((b) => ({ ...b, taskIds: b.taskIds.map((id) => id === newId ? saved.id : id) })),
      }));
    }).catch((e) => console.error("API template task error:", e));
  },
}), {
  name: "mh-board-storage",
  version: 3,
  partialize: (state) => ({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persisted: any) => {
    // Wipe boards/tasks/activeBoardId that may have leaked from old versions
    if (persisted && typeof persisted === "object") {
      delete persisted.boards;
      delete persisted.tasks;
      delete persisted.activeBoardId;
      delete persisted._serverLoaded;
    }
    return persisted;
  },
}));
