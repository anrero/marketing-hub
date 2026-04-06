export type Priority = "alta" | "media" | "baja" | "urgente";
export type Status = "por_hacer" | "en_proceso" | "en_revision" | "completado";
export type Store = string;
export type CampaignType = string;
export type ReminderOption = "none" | "same_day" | "1_day" | "3_days" | "1_week";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  authorId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  store: Store;
  assigneeId: string;
  campaignType: CampaignType;
  campaignName: string;
  adAccount: string;
  dueDate: string;
  description?: string;
  urls: { id: string; url: string }[];
  attachments: { id?: string; name: string; size: string; type?: string; url?: string }[];
  comments: Comment[];
  activity: ActivityEntry[];
  customFields?: Record<string, string>;
  subtasks?: Subtask[];
  reminder?: ReminderOption;
  tags?: string[];
  archivedAt?: string | null;
  blockedBy?: string[];
  estimatedTime?: number;
  estimatedUnit?: "hours" | "days";
  actualTime?: number;
  actualUnit?: "hours" | "days";
  coverImage?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  priority: Priority;
  store?: string;
  campaignType?: string;
  subtasks: string[];
  tags?: string[];
}

export type CustomColumnType = "text" | "number" | "select" | "date" | "url" | "checkbox";

export interface TableColumnDef {
  id: string;
  builtIn: boolean;
  key: string;
  label: string;
  customType?: CustomColumnType;
  selectOptions?: string[];
  visible: boolean;
  pinned: boolean;
  width: number;
  order: number;
}

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  filters: {
    assigneeId?: string;
    priorities?: Priority[];
    overdue?: boolean;
    groupByStatus?: boolean;
  };
}

export interface Column {
  id: string;
  title: string;
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  taskIds: string[];
}
