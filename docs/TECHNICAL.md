# Stratum 项目技术文档

## 概述

Stratum 是一个基于 Next.js 16 的层级任务管理器，支持大纲/扁平视图模式、多列任务面板、拖拽排序、中英双语。

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript (strict mode) |
| 样式 | Tailwind CSS v4 |
| 状态管理 | Zustand |
| 持久化 | localStorage |
| 包管理 | pnpm |

### 核心命令

```bash
pnpm dev    # 开发服务器 (localhost:3000)
pnpm build  # 生产构建
pnpm start  # 生产服务器
pnpm lint   # ESLint 检查
```

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局 (字体、元数据)
│   ├── page.tsx             # 首页 (Toolbar + Sidebar + TaskBoard)
│   └── globals.css          # Tailwind 导入 + 全局样式
├── components/
│   ├── TaskBoard.tsx        # 主面板 (列头 + 行列表 + 拖拽)
│   ├── ColumnHeader.tsx     # 列头 (可调整宽度)
│   ├── ColumnConfigModal.tsx # 列配置弹窗
│   ├── TaskRow.tsx          # 单行 (缩进 + 单元格)
│   ├── CellRenderer.tsx     # 单元格渲染器
│   ├── Toolbar.tsx          # 工具栏 (视图切换 + 语言)
│   └── Sidebar.tsx          # 侧边栏 (目录树)
└── lib/
    ├── types.ts             # TypeScript 类型定义
    ├── store.ts             # Zustand store
    ├── i18n.ts              # 中英翻译
    └── storage.ts           # localStorage 读写
```

---

## 数据模型

### 类型定义 (`src/lib/types.ts`)

```typescript
// 列类型
export type ColumnType = 'text' | 'datetime' | 'enum' | 'number' | 'checkbox';

// 列定义
export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];        // enum 类型的选项列表
  width?: number;             // 列宽 (px)
}

// 任务行
export interface TaskRow {
  id: string;
  indent: number;            // 缩进层级 (0 = 根级)
  cells: Record<string, string | number | boolean | null>; // 列 ID -> 值
  collapsed: boolean;         // 是否折叠 (大纲视图)
}

// 目录
export interface Directory {
  id: string;
  name: string;
  collapsed: boolean;
}

// 任务 (属于某个目录)
export interface Task {
  id: string;
  directoryId: string;
  name: string;
  columns: ColumnDef[];      // 列定义
  rows: TaskRow[];          // 行数据
}

// 视图模式
export type ViewMode = 'outline' | 'flat';

// 语言
export type Locale = 'zh' | 'en';
```

### 层级关系

```
Directory (目录)
  └── Task (任务)
        ├── columns: ColumnDef[]  // 列定义
        └── rows: TaskRow[]       // 行数据
              └── indent: number  // 通过 indent 表达层级
```

**层级表达方式**: 通过 `indent` 属性表达父子关系
- indent = 0: 根级行
- indent = N+1: 最近的前一个 indent = N 的行的子行

---

## 状态管理

### Store 结构 (`src/lib/store.ts`)

```typescript
interface TaskState {
  directories: Directory[];
  tasks: Task[];
  activeTaskId: string | null;   // 当前选中的任务
  sidebarOpen: boolean;          // 侧边栏是否展开
  viewMode: ViewMode;             // 'outline' | 'flat'
  locale: Locale;                 // 'zh' | 'en'
}
```

### 核心 Actions

#### 目录操作
| Action | 说明 |
|--------|------|
| `addDirectory(name)` | 创建目录 |
| `removeDirectory(id)` | 删除目录及所有任务 |
| `renameDirectory(id, name)` | 重命名目录 |
| `toggleDirectoryCollapse(id)` | 切换目录折叠 |

#### 任务操作
| Action | 说明 |
|--------|------|
| `addTask(directoryId, name)` | 在目录中创建任务 |
| `removeTask(id)` | 删除任务 |
| `renameTask(id, name)` | 重命名任务 |
| `setActiveTask(id)` | 设为当前活动任务 |

#### 列操作
| Action | 说明 |
|--------|------|
| `addColumn(col)` | 添加列 (会为所有行添加空值) |
| `updateColumn(id, partial)` | 更新列属性 |
| `removeColumn(id)` | 删除列 (移除所有行对应单元格) |

#### 行操作
| Action | 说明 |
|--------|------|
| `addRow(afterId, indent)` | 在指定位置后插入行 |
| `updateCell(rowId, colId, value)` | 更新单元格值 |
| `updateRowIndent(rowId, indent)` | 更新行缩进 |
| `removeRow(id)` | 删除行 (至少保留 1 行) |
| `moveRow(sourceId, targetId, position)` | 移动行及子行 |
| `toggleCollapse(id)` | 切换行折叠 |

#### 视图操作
| Action | 说明 |
|--------|------|
| `toggleSidebar()` | 切换侧边栏 |
| `setViewMode(mode)` | 设置视图模式 |
| `setLocale(locale)` | 设置语言 |

### 数据流

```
┌──────────────────────────────────────────────┐
│              Zustand Store                    │
│  ┌──────────────────────────────────────────┐ │
│  │ TaskState: directories, tasks,           │ │
│  │           activeTaskId, viewMode, locale │ │
│  └──────────────────────────────────────────┘ │
│                      ▲                        │
│                      │                        │
│               persist() 写入                  │
│                      │                        │
│                      ▼                        │
│         localStorage ('stratum-data')         │
└──────────────────────────────────────────────┘
```

---

## 存储层

### `src/lib/storage.ts`

```typescript
const STORAGE_KEY = 'stratum-data';

loadState(): TaskState | null   // 从 localStorage 读取
saveState(state: TaskState)     // 写入 localStorage
```

**设计特点**:
- SSR 安全: 服务端返回 null
- 静默失败: 存储错误不抛出异常
- 全量存储: 每次保存完整状态

---

## i18n 系统

### `src/lib/i18n.ts`

使用简单的键值对翻译系统:

```typescript
t(locale: Locale, key: TranslationKey): string
```

**支持的语言**: `zh` (中文)、`en` (英语)

---

## 组件架构

### 组件层级

```
<Home>
  <Toolbar />
  <div>
    <Sidebar />           (可选显示)
    <main>
      <TaskBoard>
        <ColumnHeader />
        {visibleRows.map(row => (
          <TaskRow>
            <CellRenderer />
          </TaskRow>
        ))}
      </TaskBoard>
    </main>
  </div>
</Home>
```

### TaskBoard.tsx

主面板容器，负责:
- 列头渲染 (sticky)
- 可见行过滤 (大纲视图根据 collapsed 状态过滤)
- 拖拽排序 (HTML5 Drag API)
- 多选支持 (Shift+点击 范围选择, Ctrl+点击 切换选择)
- 批量缩进

**状态**:
```typescript
const [dragSourceId, setDragSourceId] = useState<string | null>(null);
const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' | 'child' } | null>(null);
const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
```

### TaskRow.tsx

单行渲染，负责:
- 缩进计算 (左侧缩进 = indent * INDENT_UNIT)
- 折叠/展开按钮 (大纲视图)
- 拖拽处理
- 选中状态

### CellRenderer.tsx

根据列类型渲染不同输入控件:

| 类型 | 控件 |
|------|------|
| `text` | `<input type="text">` |
| `number` | `<input type="number">` |
| `datetime` | `<input type="datetime-local">` |
| `checkbox` | `<input type="checkbox">` |
| `enum` | `<select>` |

---

## 键盘快捷键

### 单元格内

| 快捷键 | 操作 |
|--------|------|
| Enter | 在下方添加同缩进行 |
| Tab | 增加缩进 |
| Shift+Tab | 减少缩进 |
| Backspace (空单元格) | 减少缩进 / 删除行 |

### 面板级别 (多选时)

| 快捷键 | 操作 |
|--------|------|
| Tab | 批量增加缩进 |
| Shift+Tab | 批量减少缩进 |

### 行选择

| 操作 | 效果 |
|------|------|
| 点击 | 单选 |
| Ctrl+点击 | 切换选择 |
| Shift+点击 | 范围选择 |

---

## 拖拽排序

### 位置检测

拖拽时有三种位置:
- `before`: 插入到目标行之前
- `after`: 插入到目标行之后
- `child`: 作为目标行的子级

### 层级处理

`moveRow` action 会:
1. 移动行及其所有子行
2. 重新计算子行的 indent (保持相对关系)

---

## 已知问题和改进建议

### 1. ID 生成方式

```typescript
// 当前使用 Math.random()
Math.random().toString(36).slice(2, 10)
```

**问题**: 不够随机，低风险
**建议**: 可考虑使用 `nanoid` 或 `crypto.randomUUID()`

### 2. 存储层

- 静默失败，用户无感知
- 无数据验证，损坏数据可能导致问题

### 3. 缺少功能

- [ ] 撤销/重做
- [ ] 数据导出/导入
- [ ] 任务搜索/过滤
- [ ] 单元测试
- [ ] 触摸设备支持 (拖拽使用 HTML5 API)

### 4. 上下文菜单位置

右键菜单使用原始 `clientX/Y`，可能定位到视口外

### 5. Persist 方式

当前每个 action 手动调用 `persist()`，可考虑使用 zustand persist middleware

### 6. 列 ID 碰撞风险

列 ID 生成: `name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()`

快速连续点击可能产生相同 ID

---

## 样式系统

### Tailwind CSS v4

使用 `@tailwindcss/postcss` 插件

### CSS 变量 (globals.css)

```css
--background: #fff / #0a0a0a (light/dark)
--foreground: #171717 / #ededed
--selection: #b4d5fe
```

### 输入框重置

```css
input:focus { outline: none }
input[type="number"]::-webkit-inner-spin-button { display: none }
```

---

## 依赖关系

```json
{
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 路径别名

`@/*` 映射到 `./src/*`

```typescript
import { loadState } from '@/lib/storage';
// 等价于
import { loadState } from './src/lib/storage';
```
