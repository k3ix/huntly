# Huntly

LinkedIn job tracker -- personal project for portfolio and daily use.

## Stack

- **Runtime**: Bun
- **Backend**: Elysia
- **ORM**: Drizzle + SQLite
- **Validation**: Zod (shared package)
- **Typed client**: Eden Treaty
- **Frontend**: React + Vite, TanStack Query, Tailwind, shadcn/ui
- **MCP**: stdio server for Claude Code integration
- **Monorepo**: Bun workspaces

## Project Structure

```
apps/
  server/        -- Elysia API + MCP server
  web/           -- React SPA
packages/
  shared/        -- Zod schemas, types, status enums
```

## Conventions

- Language: TypeScript everywhere
- No emojis in code, commits, PR titles
- Commit messages in English
- Zod schemas are the source of truth for validation; Drizzle schema for DB
- API prefix: `/api`
- Use Bun for running, testing, and package management

## Commands

```bash
bun install
bun run --cwd apps/server dev
bun run --cwd apps/web dev
```
