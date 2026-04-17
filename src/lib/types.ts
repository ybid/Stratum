export type ColumnType = 'text' | 'datetime' | 'enum' | 'number' | 'checkbox';

export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // enum type values
  width?: number;
}

export interface TaskRow {
  id: string;
  indent: number;
  cells: Record<string, string | number | boolean | null>;
  collapsed: boolean;
}

export interface Directory {
  id: string;
  name: string;
  collapsed: boolean;
}

export interface Task {
  id: string;
  directoryId: string;
  name: string;
  columns: ColumnDef[];
  rows: TaskRow[];
}

export type ViewMode = 'outline' | 'flat';
export type Locale = 'zh' | 'en';

export interface TaskState {
  directories: Directory[];
  tasks: Task[];
  activeTaskId: string | null;
  sidebarOpen: boolean;
  viewMode: ViewMode;
  locale: Locale;
}
