# Stratum 迭代计划 v1.0

> 基于 Notion、Linear、Todoist 等产品分析制定的功能扩展计划

## 项目现状总结

| 维度 | 状态 |
|------|------|
| 核心架构 | ✅ 完善 (Next.js + Zustand + MySQL) |
| 数据模型 | ✅ Zod 验证，类型安全 |
| 持久化 | ✅ MySQL + localStorage 双层 |
| 核心功能 | ✅ 层级任务、多列、拖拽、Undo/Redo |
| 国际化 | ✅ 中英双语 |

---

## Phase 1: 体验增强 (P0)

### 1.1 Toast 通知系统

**现状**: 操作无反馈，失败静默

**实现方案**:
```typescript
// src/lib/toast-store.ts
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
```

**建议样式**:
- 成功: 绿色背景，淡出动画
- 错误: 红色背景，停留更久
- 位置: 右下角堆叠显示

---

### 1.2 高级搜索/过滤器

**现状**: 仅支持简单文本包含搜索

**建议功能** (类 Linear/Notion):
- 按列值精确筛选
- 多条件组合 (AND/OR)
- 保存筛选器为快捷方式

```typescript
interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

interface FilterCondition {
  columnId: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'isEmpty';
  value: any;
}
```

---

### 1.3 快捷键自定义

**现状**: 固定快捷键

**参考 Linear**: 设置面板中可自定义快捷键

```typescript
interface ShortcutConfig {
  addRow: string;
  indent: string;
  outdent: string;
  deleteRow: string;
  undo: string;
  redo: string;
  // ...
}
```

---

### 1.4 深色模式切换

**现状**: 跟随系统 `prefers-color-scheme`

**建议**:
- 自动 / 浅色 / 深色 三档
- 存储用户偏好

---

## Phase 2: 效率提升 (P1)

### 2.1 命令面板 (Command Palette)

**类 Notion `Cmd+K` / Linear `Cmd+K`**

功能:
- 快速创建任务
- 跳转目录/任务
- 执行操作 (删除、复制、导出)
- 搜索过滤器

```
┌─────────────────────────────┐
│ > Task name...              │
├─────────────────────────────┤
│ 📁 My Project               │
│   📋 Getting Started        │
│   📋 Sprint Planning        │
├─────────────────────────────┤
│ ⌘ New Task    Ctrl+N        │
│ 🎯 Search     Ctrl+F        │
│ ⚙️ Settings   Ctrl+,        │
└─────────────────────────────┘
```

---

### 2.2 快速添加 (Quick Add)

**类 Todoist 快速添加**

- 全局快捷键 `Ctrl+N`
- 直接在弹窗输入，自动创建任务
- 支持 `#tag` `@project` `!priority` 等快捷语法

---

### 2.3 任务依赖关系

**类 Linear / Notion 的任务链接**

```typescript
interface TaskDependency {
  id: string;
  blockedBy: string[];  // 阻塞此任务的任务ID
  blocking: string[];  // 此任务阻塞的任务ID
}
```

**UI 表现**:
- 折叠时显示依赖图标 🔗
- 工具提示显示阻塞关系
- 阻止删除有关联的任务

---

### 2.4 子任务/清单

**类 Notion 的 checklist**

在 text 类型单元格中:
- 输入 `[ ]` 自动渲染为复选框
- 嵌套子项目支持

---

### 2.5 拖拽优化

**当前**: 单行拖拽

**建议**:
- 多选行一起拖拽
- 拖拽时显示预览 (幽灵元素)
- 放置目标高亮

---

## Phase 3: 视图扩展 (P2)

### 3.1 日历视图 (Calendar View)

**基于 datetime 列的甘特图/日历**

```
Apr 2026
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Mon     │ Tue     │ Wed     │ Thu     │ Fri     │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ Task A  │ ████    │         │         │         │
│ ─────── │ ████    │ ████    │         │         │
│         │         │ ████    │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

**实现要点**:
- 只显示有 datetime 值的行
- 按日期排列
- 点击日期创建任务

---

### 3.2 看板视图 (Kanban)

**按 enum 列值分组**

```
Priority: High    │ Priority: Medium │ Priority: Low
──────────────────┼──────────────────┼─────────────────
┌──────────────┐  │ ┌──────────────┐  │ ┌──────────────┐
│ Task A       │  │ │ Task C       │  │ │ Task E       │
│ ████████████ │  │ │ ██████████   │  │ │ ███          │
└──────────────┘  │ └──────────────┘  │ └──────────────┘
┌──────────────┐  │                  │ ┌──────────────┐
│ Task B       │  │                  │ │ Task D       │
│ █████████    │  │                  │ │ ████████████ │
└──────────────┘  │                  │ └──────────────┘
```

---

### 3.3 甘特图视图

**长期项目时间线**

```
Task        │ Mon 7 │ Tue 8 │ Wed 9 │ Thu 10│ Fri 11│
────────────┼───────┼───────┼───────┼───────┼───────┤
Task A      │ ████████      │       │       │       │
Task B      │       │ ████████████████      │       │
Task C      │       │               │ ██████████████│
```

---

## Phase 4: 协作功能 (P3)

### 4.1 标签系统增强

**当前**: 基础 tags 数组

**建议**:
- 标签颜色预设
- 按标签筛选
- 标签管理面板 (增删改)

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;  // hex
}

// 预设颜色
const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];
```

---

### 4.2 提醒/通知系统

**基于 datetime 列的浏览器通知**

```typescript
interface Reminder {
  id: string;
  rowId: string;
  columnId: string;
  minutesBefore: number;  // 提前多少分钟
  notified: boolean;
}
```

**UI**:
- 首次打开时请求通知权限
- 到期前弹出浏览器通知
- 任务行高亮显示即将到期的任务

---

### 4.3 重复任务

**类 Todoist 的重复**

```typescript
interface RecurringRule {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;  // 每隔N个周期
  endDate?: string;
  lastCompleted?: string;
}
```

---

## Phase 5: 代码质量 (P0)

### 5.1 Store 拆分

**当前问题**: store.ts ~750 行，所有逻辑集中

**建议拆分**:
```
src/lib/store/
├── index.ts          # 合并导出
├── state.ts          # 初始状态
├── actions/
│   ├── directory.ts
│   ├── task.ts
│   ├── column.ts
│   ├── row.ts
│   └── ui.ts
└── selectors.ts     # 计算属性
```

---

### 5.2 组件拆分

**TaskBoard.tsx (~300行)**

建议拆分为:
```
src/components/
├── TaskBoard/
│   ├── index.tsx      # 容器
│   ├── ColumnHeaders.tsx
│   ├── RowList.tsx
│   ├── DragOverlay.tsx
│   ├── BatchActionBar.tsx
│   └── EmptyState.tsx
```

---

### 5.3 常量提取

```typescript
// src/lib/constants.ts
export const GUTTER_WIDTH = 28;
export const INDENT_UNIT = 24;
export const MIN_COLUMN_WIDTH = 60;
export const MAX_HISTORY = 50;
export const DEBOUNCE_MS = 100;
```

---

### 5.4 Error Boundaries

添加 React Error Boundary 组件，防止单个组件错误导致整个应用崩溃。

---

## Phase 6: 未来探索 (P4)

### 6.1 云同步

**目标**: 多设备实时同步

可选方案:
- **Supabase**: 快速实现，适合个人项目
- **Firebase**: 功能完整，学习曲线陡
- **自建 API**: 完全控制，需维护服务器

---

### 6.2 团队协作

- 多人同时编辑
- 权限控制 (owner / editor / viewer)
- 变更历史追踪

---

### 6.3 数据分析

- 任务完成率统计
- 各列数据分布
- 时间线趋势图

---

## 实现优先级矩阵

| 阶段 | 功能 | 实用性 | 难度 | 优先级 |
|------|------|--------|------|--------|
| P0 | Toast 通知系统 | 高 | 低 | 立即实现 |
| P0 | 快捷键自定义 | 高 | 中 | 立即实现 |
| P0 | 深色模式切换 | 高 | 低 | 立即实现 |
| P0 | Store 拆分重构 | 中 | 高 | 下个迭代 |
| P1 | 命令面板 | 高 | 中 | 重点开发 |
| P1 | 快速添加 | 高 | 低 | 重点开发 |
| P1 | 任务依赖 | 中 | 中 | 常规 |
| P1 | 标签系统增强 | 中 | 低 | 常规 |
| P2 | 高级搜索过滤器 | 高 | 中 | 下个版本 |
| P2 | 日历视图 | 中 | 高 | 规划中 |
| P2 | 看板视图 | 中 | 中 | 规划中 |
| P3 | 提醒通知 | 中 | 中 | 规划中 |
| P3 | 重复任务 | 中 | 中 | 规划中 |
| P4 | 云同步 | 高 | 高 | 长期 |
| P4 | 团队协作 | 高 | 高 | 长期 |

---

## 建议的下一步

1. **立即**: 添加 Toast 系统改善 UX 反馈
2. **短期**: 实现命令面板 + 快速添加，这是提升效率的关键
3. **中期**: 添加日历视图，这是最受欢迎的可视化功能
4. **长期**: 云同步实现多设备支持

---

*文档版本: 1.0*
*创建日期: 2026-04-30*