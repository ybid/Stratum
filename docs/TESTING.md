# Stratum 测试指南

## 当前状态

项目中**尚未配置测试框架**。

---

## 推荐测试方案

### 框架选择

| 框架 | 适用场景 | 配置复杂度 |
|------|----------|-----------|
| Vitest | 单元测试 (快) | 低 |
| Playwright | E2E 测试 | 中 |
| React Testing Library | 组件测试 | 低 |

### 推荐组合

- **Vitest** + **React Testing Library**: 单元测试 + 组件测试
- **Playwright**: E2E 测试

---

## 快速开始

### 1. 安装依赖

```bash
pnpm add -D vitest @testing-library/react @testing-library/dom jsdom
pnpm add -D @playwright/test
pnpm exec playwright install
```

### 2. 配置 Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### 3. 更新 package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
}
```

---

## 测试示例

### 单元测试: Store Actions

```typescript
// src/lib/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { loadState } from './storage';

describe('store actions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    localStorage.clear();
    store = createStore();
  });

  describe('addDirectory', () => {
    it('should add a directory', () => {
      store.getState().addDirectory('Test Directory');

      expect(store.getState().directories).toHaveLength(1);
      expect(store.getState().directories[0].name).toBe('Test Directory');
    });
  });

  describe('addTask', () => {
    it('should add a task to directory', () => {
      store.getState().addDirectory('Dir');
      const dirId = store.getState().directories[0].id;
      store.getState().addTask(dirId, 'Task');

      expect(store.getState().tasks).toHaveLength(1);
      expect(store.getState().tasks[0].name).toBe('Task');
    });
  });

  describe('addRow', () => {
    it('should add row with correct indent', () => {
      store.getState().addDirectory('Dir');
      const dirId = store.getState().directories[0].id;
      store.getState().addTask(dirId, 'Task');

      const taskId = store.getState().tasks[0].id;
      store.getState().setActiveTask(taskId);
      store.getState().addRow(null, 0);

      const rows = store.getState().tasks[0].rows;
      expect(rows).toHaveLength(1);
      expect(rows[0].indent).toBe(0);
    });
  });
});
```

### 组件测试: CellRenderer

```typescript
// src/components/CellRenderer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellRenderer } from './CellRenderer';

describe('CellRenderer', () => {
  it('should render text input for text column', () => {
    render(
      <CellRenderer
        column={{ id: 'col1', name: 'Task', type: 'text' }}
        value="Hello"
        rowId="row1"
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Hello');
  });

  it('should render number input for number column', () => {
    render(
      <CellRenderer
        column={{ id: 'col1', name: 'Count', type: 'number' }}
        value={42}
        rowId="row1"
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(42);
  });

  it('should call onChange when value changes', () => {
    const onChange = vi.fn();
    render(
      <CellRenderer
        column={{ id: 'col1', name: 'Task', type: 'text' }}
        value=""
        rowId="row1"
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New value' },
    });

    expect(onChange).toHaveBeenCalledWith('row1', 'col1', 'New value');
  });
});
```

### E2E 测试: 任务创建流程

```typescript
// e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test('create and edit task', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 创建目录
  await page.click('text=+');
  await page.fill('input[placeholder="目录名称"]', 'My Directory');
  await page.click('text=确认');

  // 创建任务
  await page.click('text=添加任务');
  await page.fill('input[placeholder="任务名称"]', 'My Task');

  // 验证任务出现在侧边栏
  await expect(page.locator('text=My Task')).toBeVisible();

  // 点击任务进入工作区
  await page.click('text=My Task');

  // 添加行
  await page.click('text=添加行');
  await page.fill('input[type="text"]', 'First task');

  // 验证行被添加
  await expect(page.locator('text=First task')).toBeVisible();
});
```

---

## 测试覆盖重点

### Store Actions

```typescript
// 需要覆盖的 actions
- addDirectory / removeDirectory / renameDirectory
- addTask / removeTask / renameTask
- setActiveTask
- addColumn / updateColumn / removeColumn
- addRow / updateCell / updateRowIndent / removeRow
- moveRow (包含父子关系)
- toggleCollapse
- setViewMode / setLocale
```

### 关键场景

1. **层级操作**
   - 折叠父行时子行隐藏
   - 移动行时子行跟随
   - 删除行时子行处理

2. **视图切换**
   - Outline → Flat 显示所有行
   - Flat → Outline 恢复折叠状态

3. **拖拽排序**
   - before/after/child 位置
   - 拖拽到自身 (禁止)

4. **键盘快捷键**
   - Enter 添加行
   - Tab/Shift+Tab 缩进
   - Backspace 删除

---

## Mock localStorage

```typescript
// tests/setup.ts
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});
```

---

## CI 集成

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm test:e2e
```
