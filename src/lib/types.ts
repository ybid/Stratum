import { z } from 'zod';

export type ColumnType = 'text' | 'datetime' | 'enum' | 'number' | 'checkbox';

export const EnumOptionSchema = z.object({
  label: z.string(),
  color: z.string().optional(),
});

export const ColumnDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'datetime', 'enum', 'number', 'checkbox']),
  options: z.array(EnumOptionSchema).optional(),
  width: z.number().optional(),
});

export const RecurringRuleSchema = z.object({
  pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().min(1).default(1),
  endDate: z.string().optional(),
  lastCompleted: z.string().optional(),
  customRule: z.string().optional(),
});

export const TaskRowSchema = z.object({
  id: z.string(),
  indent: z.number().int().min(0),
  cells: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  collapsed: z.boolean(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  recurring: RecurringRuleSchema.optional(),
});

export const DirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  collapsed: z.boolean(),
});

export const TaskSchema = z.object({
  id: z.string(),
  directoryId: z.string(),
  name: z.string(),
  columns: z.array(ColumnDefSchema),
  rows: z.array(TaskRowSchema),
});

export const TaskStateSchema = z.object({
  directories: z.array(DirectorySchema),
  tasks: z.array(TaskSchema),
  activeTaskId: z.string().nullable(),
  sidebarOpen: z.boolean(),
  viewMode: z.enum(['outline', 'flat', 'kanban', 'calendar', 'gantt']),
  locale: z.enum(['zh', 'en']),
});

export type ColumnDef = z.infer<typeof ColumnDefSchema>;
export type EnumOption = z.infer<typeof EnumOptionSchema>;
export type TaskRow = z.infer<typeof TaskRowSchema>;
export type Directory = z.infer<typeof DirectorySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ViewMode = 'outline' | 'flat' | 'kanban' | 'calendar' | 'gantt';
export type Locale = 'zh' | 'en';

export interface TaskState {
  directories: Directory[];
  tasks: Task[];
  activeTaskId: string | null;
  sidebarOpen: boolean;
  viewMode: ViewMode;
  locale: Locale;
}

export type ValidatedTaskState = z.infer<typeof TaskStateSchema>;
