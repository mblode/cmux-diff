# cmux-diff

GitHub PR-style local diff viewer. Monorepo — one app at `apps/web/`, which also ships as a CLI via `bin/cmux-diff.mjs`.

## Commands

```bash
# Development
npm run dev          # Start all apps via Turbo (runs portless run next dev in apps/web)
npm run build        # Build all apps
npm run check-types  # TypeScript check across all workspaces

# Quality
npm run lint         # oxlint via Turbo
npm run lint:fix     # oxlint --fix via Turbo
npm run format       # oxfmt --write via Turbo
npm run check        # ultracite check (lint + format)
npm run fix          # ultracite fix (lint + format --fix)
```

Run all commands from the **monorepo root**. Do not `cd apps/web` for routine tasks.

## Workspace Structure

```
cmux-diff/
├── apps/web/        # Next.js app + CLI (see apps/web/AGENTS.md)
├── turbo.json       # Task pipelines
└── package.json     # Root workspace (npm workspaces)
```

## Gotchas

- **No inner lockfile** — `apps/web/package-lock.json` must not exist; only the root lockfile is used. If it appears, delete it and run `npm install` from root.
- **Dev uses portless** — `npm run dev` serves at `https://cmux-diff.localhost`, not `http://localhost:3000`. Requires portless to proxy correctly.
- **Build before CLI** — `bin/cmux-diff.mjs` runs `next start`, which requires a production build. Run `npm run build` before testing the CLI end-to-end.
- **Env for dev** — Set `CMUX_DIFF_REPO` in `apps/web/.env.local` to point at a real git repo when developing. Without it, the diff API defaults to `process.cwd()`.
