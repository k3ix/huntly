# Huntly

Track your job hunt. Personal LinkedIn job tracker with MCP integration for Claude Code.

## Stack

- **Bun** + **Elysia** + **Drizzle** + **SQLite** (backend)
- **React** + **Vite** + **Tailwind** + **shadcn/ui** (frontend)
- **Eden Treaty** for end-to-end type safety
- **MCP server** for Claude Code integration

## Getting Started

```bash
bun install
bun run --cwd apps/server dev
bun run --cwd apps/web dev
```

## Project Structure

```
apps/
  server/    -- Elysia API + MCP server
  web/       -- React SPA (kanban board, list view)
packages/
  shared/    -- Zod schemas, types, status enums
```
