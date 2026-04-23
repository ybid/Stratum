# Stratum 重构指南

## 目录

- [ID 生成](#id-生成)
- [持久化方案](#持久化方案)
- [状态管理](#状态管理)
- [组件拆分](#组件拆分)
- [类型安全](#类型安全)
- [错误处理](#错误处理)

---

## ID 生成

### 当前问题

```typescript
// src/lib/store.ts
const id = Math.random().toString(36).slice(2, 10);
```

**问题**:
- 不够随机，可能碰撞 (极低概率)
- 不是加密安全的 (低风险，本地应用)

### 建议方案

```typescript
// 使用 nanoid
import { nanoid } from 'nanoid';
const id = nanoid();

// 或使用 crypto (现代浏览器)
const id = crypto.randomUUID();
```

### 迁移步骤

1. 安装 `nanoid`: `pnpm add nanoid`
2. 替换所有 ID 生成位置
3. 测试确保功能正常

---

## 持久化方案

### 当前实现

```typescript
// src/lib/storage.ts
const STORAGE_KEY = 'stratum-data';

function loadState(): TaskState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
```

### 问题

- 每个 action 手动调用 `persist()`
- 存储失败静默无反馈
- 无数据验证

### 建议方案 A: Zustand Persist Middleware

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'stratum-data',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 建议方案 B: 添加数据验证

```typescript
import { z } from 'zod';

const ColumnDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'datetime', 'enum', 'number', 'checkbox']),
  options: z.array(z.string()).optional(),
  width: z.number().optional(),
});

const TaskRowSchema = z.object({
  id: z.string(),
  indent: z.number().min(0),
  cells: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  collapsed: z.boolean(),
});

// 加载时验证
function loadState(): TaskState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    // 验证数据结构
    return TaskStateSchema.parse(data);
  } catch {
    return null;
  }
}
```

---

## 状态管理

### 当前问题

- Store 文件较大 (~300+ 行)
- 所有状态和操作集中在一个文件

### 建议: 拆分 Store

```
src/lib/store/
├── index.ts          # 导出合并后的 store
├── types.ts          # 类型定义
├── state.ts          # 初始状态
├── actions/
│   ├── directory.ts  # 目录相关 actions
│   ├── task.ts       # 任务相关 actions
│   ├── column.ts     # 列相关 actions
│   └── row.ts         # 行相关 actions
└── selectors.ts     # 计算属性选择器
```

### 示例: actions/row.ts

```typescript
// src/lib/store/actions/row.ts
export const rowActions = (set, get) => ({
  addRow(afterId: string | null, indent: number) {
    const { tasks, activeTaskId } = get();
    if (!activeTaskId) return;

    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === activeTaskId
          ? { ...task, rows: [...task.rows, newRow] }
          : task
      )
    }));
  },

  removeRow(id: string) {
    const { tasks, activeTaskId } = get();
    if (!activeTaskId) return;

    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === activeTaskId
          ? { ...task, rows: task.rows.filter(r => r.id !== id) }
          : task
      )
    }));
  },
  // ...
});
```

---

## 组件拆分

### 当前问题

- `TaskBoard.tsx` 较大 (~400+ 行)
- 混合了拖拽、多选、批量操作逻辑

### 建议拆分

```
src/components/
├── TaskBoard/
│   ├── index.tsx           # 主容器
│   ├── ColumnHeaders.tsx   # 列头行
│   ├── RowList.tsx         # 行列表 (处理大纲/扁平视图)
│   ├── DragOverlay.tsx     # 拖拽覆盖层
│   ├── SelectionBar.tsx    # 多选操作栏
│   └── AddRowButton.tsx    # 添加行按钮
├── TaskRow/
│   ├── index.tsx           # 行容器
│   ├── Gutter.tsx          # 左侧缩进+折叠区
│   └── DropIndicator.tsx   # 拖拽指示器
```

### 示例: RowList.tsx

```typescript
// 根据 viewMode 过滤可见行
function getVisibleRows(rows: TaskRow[], viewMode: ViewMode): TaskRow[] {
  if (viewMode === 'flat') return rows;

  // Outline 模式: 根据 collapsed 过滤
  const visible: TaskRow[] = [];
  const collapsedIds = new Set<string>();

  for (const row of rows) {
    // 检查父级是否折叠
    const parentCollapsed = /* 检查前面的 collapsed 行 */;
    if (parentCollapsed) {
      collapsedIds.add(row.id);
      continue;
    }
    visible.push(row);
  }

  return visible;
}
```

---

## 类型安全

### 当前问题

```typescript
// CellRenderer.tsx - value 类型宽泛
value: string | number | boolean | null

// store.ts - 很多 any
rows.find(r => r.id === id) as any
```

### 建议

1. 使用 `zod` 进行运行时验证
2. 避免 `as any` 类型断言
3. 添加更精确的类型 guards

```typescript
// src/lib/types/guards.ts
export function isTextColumn(col: ColumnDef): col is ColumnDef & { type: 'text' } {
  return col.type === 'text';
}

export function isEnumColumn(col: ColumnDef): col is ColumnDef & { type: 'enum'; options: string[] } {
  return col.type === 'enum';
}
```

---

## 错误处理

### 当前问题

- 存储失败静默
- 无用户反馈

### 建议: 添加 Toast 系统

```typescript
// src/lib/toast.ts
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// 使用 zustand 创建 toast store
const useToastStore = create<{ toasts: Toast[] }>((set) => ({
  toasts: [],
  addToast: (type: ToastType, message: string) => {
    const id = nanoid();
    set(state => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
}));
```

### 存储层改进

```typescript
function saveState(state: TaskState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    useToastStore.getState().addToast('error', '存储空间不足');
    return false;
  }
}
```

---

## 其他重构建议

### 1. 提取常量

```typescript
// src/lib/constants.ts
export const INDENT_UNIT = 24;
export const GUTTER_WIDTH = 28;
export const MIN_COLUMN_WIDTH = 60;
export const STORAGE_KEY = 'stratum-data';
```

### 2. 提取工具函数

```typescript
// src/lib/utils.ts
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function findRowIndex(rows: TaskRow[], id: string): number {
  return rows.findIndex(r => r.id === id);
}
```

### 3. Context 优化

如果多个组件需要访问同一数据，考虑使用 React Context:

```typescript
// src/lib/context/TaskContext.tsx
const TaskContext = createContext<TaskState | null>(null);

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('必须在 TaskProvider 内使用');
  return context;
}
```

---

## 重构优先级

| 优先级 | 项目 | 工作量 | 影响 |
|--------|------|--------|------|
| 高 | ID 生成替换为 nanoid | 小 | 低风险 |
| 高 | 添加数据验证 | 中 | 稳定性 |
| 中 | 拆分 Store | 大 | 可维护性 |
| 中 | 拆分 TaskBoard | 中 | 可维护性 |
| 低 | 添加 Toast 系统 | 中 | 用户体验 |
| 低 | 添加 Context | 小 | 代码结构 |
