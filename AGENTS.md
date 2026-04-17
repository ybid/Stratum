<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Stratum

A hierarchical task manager built with Next.js (App Router), TypeScript, Tailwind CSS v4, zustand, and pnpm. Tasks are organized by indentation to express hierarchy. The first row is a header that supports adding custom columns (text, datetime, enum, number, checkbox). Supports outline (collapsible) and flat view modes, plus zh/en i18n.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (localhost:3000) |
| `pnpm build` | Production build (includes TypeScript checking) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

No test framework is configured yet. When adding one, add a `test` script to `package.json`.

## Architecture

- **Framework**: Next.js 16 with App Router (`src/app/` directory)
- **State management**: zustand (`src/lib/store.ts`) — single store with all task data + actions
- **Styling**: Tailwind CSS v4 (PostCSS plugin `@tailwindcss/postcss`)
- **Persistence**: localStorage (`src/lib/storage.ts`) — designed to be swapped for a backend later
- **i18n**: Simple key-value system (`src/lib/i18n.ts`) with zh/en
- **Path aliases**: `@/*` maps to `./src/*`
- **Package manager**: pnpm

### Key directories

```
src/
  app/
    layout.tsx       Root layout — fonts, metadata, full-height body
    page.tsx         Main page — renders Toolbar + TaskBoard
    globals.css      Tailwind import + input style resets
  components/
    TaskBoard.tsx    Main container — column headers + visible rows + add-row button
    ColumnHeader.tsx Column title row — right-click to configure, "+" to add column
    ColumnConfigModal.tsx  Add/edit/delete column dialog
    TaskRow.tsx      Single task row — indent gutter + cells + keyboard shortcuts
    CellRenderer.tsx Renders a cell based on column type (text/number/datetime/enum/checkbox)
    Toolbar.tsx      Top bar — view mode toggle (outline/flat) + language toggle
  lib/
    types.ts         TypeScript types — ColumnDef, TaskRow, ViewMode, Locale
    store.ts         zustand store — state + actions, auto-persists to localStorage
    i18n.ts          Translation strings (zh/en)
    storage.ts       localStorage read/write helpers
```

### Data model

- **ColumnDef**: `{ id, name, type: text|datetime|enum|number|checkbox, options? (for enum), width? }`
- **TaskRow**: `{ id, indent (0+), cells: Record<columnId, value>, collapsed }`
- Indent determines hierarchy: a row with indent N+1 is a child of the nearest preceding row with indent N

### Keyboard shortcuts (in cells)

- **Enter**: Insert new row below with same indent
- **Tab**: Increase indent; **Shift+Tab**: Decrease indent
- **Backspace** on empty cell: Decrease indent (or delete row if already at indent 0)

### Column operations

- Click **+** button in header row to add a column
- **Right-click** a column header to edit or delete it
