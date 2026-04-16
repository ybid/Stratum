<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Stratum

Full-stack web application built with Next.js (App Router), TypeScript, Tailwind CSS v4, and pnpm.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (localhost:3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

No test framework is configured yet. When adding one, add a `test` script to `package.json`.

## Architecture

- **Framework**: Next.js 16 with App Router (`src/app/` directory)
- **Styling**: Tailwind CSS v4 (imported via `@import "tailwindcss"` in `globals.css`, PostCSS plugin `@tailwindcss/postcss`)
- **Fonts**: Geist Sans + Geist Mono via `next/font/google` (CSS variables `--font-geist-sans`, `--font-geist-mono`)
- **Path aliases**: `@/*` maps to `./src/*` (configured in both `tsconfig.json` and Next.js)
- **Package manager**: pnpm (workspace config in `pnpm-workspace.yaml`, ignores sharp and unrs-resolver builds)
- **Linting**: ESLint 9 flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals + TypeScript presets

### Key directories

```
src/app/          App Router pages and layouts (file-based routing)
  layout.tsx      Root layout — sets up fonts, metadata, HTML shell
  page.tsx        Home page
  globals.css     Global styles and Tailwind import
public/           Static assets served at root
```

### App Router conventions

- `layout.tsx` files wrap child routes; the root layout is required and must include `<html>` and `<body>`
- `page.tsx` files are route UI components — each folder in `src/app/` maps to a URL segment
- API routes go in `src/app/api/` as `route.ts` files exporting named HTTP method handlers (`GET`, `POST`, etc.)
- Server Components are the default; add `"use client"` directive only when the component needs browser APIs or React state/effects
- Colocate components alongside their routes or in `src/components/` for shared ones
