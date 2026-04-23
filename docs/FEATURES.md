# Stratum 功能增强建议

## 已实现功能

- [x] 目录/任务层级管理
- [x] 多列支持 (text, datetime, enum, number, checkbox)
- [x] 大纲/扁平视图切换
- [x] 拖拽排序 (行移动)
- [x] 键盘快捷键
- [x] 多选支持
- [x] 中英双语
- [x] localStorage 持久化
- [x] 暗色模式

---

## 计划功能

### 高优先级

#### 1. 数据导入/导出

```typescript
// 导出格式建议: JSON
interface ExportData {
  version: string;
  exportedAt: string;
  directories: Directory[];
  tasks: Task[];
}

// 导出
function exportData(): void {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    directories: store.getState().directories,
    tasks: store.getState().tasks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // 触发下载
}

// 导入
function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result as string);
        // 验证并导入
        resolve();
      } catch {
        reject(new Error('Invalid file format'));
      }
    };
    reader.readAsText(file);
  });
}
```

#### 2. 撤销/重做

```typescript
// 使用 zustand/middleware 的 subscribeWithSelector
interface HistoryState {
  past: TaskState[];
  future: TaskState[];
}

// 每次 mutation 前保存快照
// 支持 Ctrl+Z / Ctrl+Shift+Z
```

#### 3. 搜索/过滤

```typescript
interface FilterState {
  query: string;
  filters: {
    columnId?: string;
    value?: string | number | boolean;
  };
}

// 搜索框: 实时过滤行
// 支持按列值过滤
```

### 中优先级

#### 4. 任务/行复制

```typescript
// 复制行及其子行
function duplicateRow(rowId: string): void {
  // 1. 找到行及其所有子行
  // 2. 深拷贝
  // 3. 插入到原位置之后
}
```

#### 5. 列排序

```typescript
// 按列值排序
function sortByColumn(columnId: string, direction: 'asc' | 'desc'): void {
  // 排序 rows 数组
  // 保持父子关系
}
```

#### 6. 批量操作

```typescript
// 批量删除
function deleteRows(rowIds: string[]): void

// 批量移动到目录
function moveRowsToTask(rowIds: string[], taskId: string): void
```

#### 7. 折叠/展开所有

```typescript
// 工具栏添加按钮
function collapseAll(): void
function expandAll(): void
```

### 低优先级

#### 8. 触摸设备支持

当前拖拽使用 HTML5 Drag API，不支持触摸。

```typescript
// 考虑使用 @dnd-kit/core
// 支持触摸拖拽
```

#### 9. 快捷键自定义

```typescript
interface ShortcutConfig {
  addRow: string;       // default: 'Enter'
  indent: string;       // default: 'Tab'
  outdent: string;       // default: 'Shift+Tab'
  delete: string;       // default: 'Backspace'
  // ...
}

function customizeShortcut(action: keyof ShortcutConfig, keys: string): void
```

#### 10. 多语言扩展

```typescript
// 添加新语言
const locales: Locale[] = ['zh', 'en', 'ja', 'ko'];

// 动态加载翻译文件
import zh from './locales/zh.json';
import en from './locales/en.json';
```

#### 11. 云同步

```typescript
// 后端 API 接口设计
POST   /api/sync          // 同步数据
GET    /api/sync/:userId  // 获取用户数据

// 可以使用:
// - Firebase Realtime Database
// - Supabase
// - 自行搭建 API
```

#### 12. 任务标签

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;  // hex color
}

interface TaskRow {
  // ... existing fields
  tags: string[];  // tag IDs
}
```

#### 13. 甘特图视图

```typescript
// 新视图模式
type ViewMode = 'outline' | 'flat' | 'gantt';

// 依赖现有 datetime 列
// 添加甘特图渲染组件
```

#### 14. 提醒/通知

```typescript
interface Reminder {
  rowId: string;
  columnId: string;  // datetime 列
  time: Date;
  message: string;
}

// 使用 Notification API
// 或 Service Worker
```

#### 15. 表格视图

```typescript
// 将任务面板转为可编辑表格
// 支持:
- 单元格合并
- 公式计算 (类似 Excel)
- 冻结列
```

---

## 功能优先级矩阵

| 功能 | 实用性 | 难度 | 优先级 |
|------|--------|------|--------|
| 导入/导出 | 高 | 低 | P0 |
| 撤销/重做 | 高 | 中 | P0 |
| 搜索/过滤 | 高 | 中 | P1 |
| 任务复制 | 中 | 低 | P1 |
| 列排序 | 中 | 低 | P1 |
| 批量操作 | 中 | 低 | P1 |
| 折叠/展开所有 | 中 | 低 | P1 |
| 触摸支持 | 中 | 高 | P2 |
| 快捷键自定义 | 低 | 中 | P2 |
| 多语言扩展 | 低 | 低 | P2 |
| 云同步 | 中 | 高 | P3 |
| 标签系统 | 低 | 中 | P3 |
| 甘特图 | 低 | 高 | P3 |
| 提醒通知 | 低 | 中 | P3 |
| 表格视图 | 低 | 高 | P3 |
