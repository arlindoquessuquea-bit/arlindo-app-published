## CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"KwanzaControl Pro" / "Arlindo App" — a Portuguese-language (pt-AO) personal finance manager targeted at Angola (Kwanza / AOA currency). The UI is mobile-first (constrained to `max-w-lg`), dark-themed, with a fixed bottom nav and a single floating action button.

All user-facing strings are in Portuguese. Keep new UI copy in Portuguese unless told otherwise.

## Stack

- React 19 + TypeScript, bundled with Vite 6
- Supabase JS v2 for auth (email/password)
- Tailwind CSS loaded via CDN in `index.html` (no local Tailwind config / PostCSS pipeline)
- Font Awesome 6 loaded via CDN; icons referenced as `fa-solid fa-...` class names
- Plus Jakarta Sans (Google Fonts) is the body font

There is no test framework, linter, or formatter configured. `package.json` exposes only `dev`, `build`, and `preview` — running tests or lint commands is not currently possible.

## Commands

```
npm install        # install deps
npm run dev        # vite dev server
npm run build      # production build to dist/
npm run preview    # serve the built bundle
```

Environment variables (Vite-prefixed, read via `import.meta.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these set, the Supabase client in `index.tsx` / `main.tsx` is created with empty strings and auth calls will fail at runtime.

## Repository state — read this before editing

This repo is in a messy, transitional state from several "Add files via upload" commits. There are inconsistencies that will trip up changes if you don't account for them:

1. **Entry point mismatch.** `index.html` loads `<script type="module" src="/src/main.tsx">`, but there is no `src/` directory — both `main.tsx` and `index.tsx` sit at the repo root. `npm run dev` will not resolve the module as-is. Before making changes that depend on the running app, confirm with the user whether the canonical layout should move files into `src/` or change the `<script src>` in `index.html`.

2. **Two near-duplicate React entry files.** `index.tsx` and `main.tsx` both define their own `Auth` component, `App` component, Supabase client, nav, etc. They are not imported from each other. `index.tsx` is the richer version (includes domain types `Account`, `Transaction`, `Budget`, `Category`, `AppSettings`, default categories, and user-scoped localStorage persistence). `main.tsx` is a slimmer variant with placeholder views. Treat `index.tsx` as the source of truth for current functional intent unless told otherwise.

3. **Empty stub files.** `App.tsx`, `constants.tsx`, `types.ts`, `README.md`, `docker-compose.yml`, and `schema.prisma` are all 0 bytes. They appear to be placeholders for a planned refactor (split components/types out of the monolithic `index.tsx`, add Prisma, add Docker). Do not assume any of them contain working code.

4. **Orphan `Auth.tsx`.** A standalone `Auth.tsx` exists at root and imports `from '../services/supabaseClient'`, but there is no `services/` directory. This file is currently dead code. The active `Auth` component is the one inlined inside `index.tsx`.

5. **Two ways to create the Supabase client, in conflict.**
   - `supabaseClient.ts` (at root) hardcodes a project URL and publishable key.
   - `index.tsx` / `main.tsx` create their own client from `import.meta.env.VITE_*`.
   The hardcoded `supabaseClient.ts` is not imported by anything that actually runs. Prefer the env-var approach when wiring things up; if the user wants a shared client module, consolidate rather than duplicating.

6. **Vite path alias points nowhere.** `vite.config.ts` aliases `@` to `./src`, and `tsconfig.json` maps `@/*` to `./*`. Neither matches the current file layout, and nothing imports via `@/...` today. Don't introduce `@/...` imports until the layout is decided.

7. **`copy-of-arlindo-app.zip`** is a ~80 KB archive checked into the repo root — likely the original source bundle the rest of the tree was extracted from. Ignore it for code reading; do not edit it.

## Architecture (as implemented in `index.tsx`)

- **Single-file app.** `index.tsx` contains every component, type, constant, and the Supabase client in one module, then mounts `<App />` into `#root`.
- **Auth gate.** `App` subscribes to `supabase.auth.onAuthStateChange`. If there is no session, it returns `<Auth />` (email/password sign-in / sign-up via Supabase). All other views are unreachable while logged out.
- **Navigation.** A `view` state of type `AppView` (`'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais' | 'Lixo'`) drives which screen renders. There is no router — adding routes means extending this union and the bottom-nav `NavIcon` buttons.
- **Persistence.** Domain data (`accounts`, `transactions`, …) is currently kept in React state and mirrored to `localStorage` under per-user keys (`accounts_${session.user.id}`, `transactions_${session.user.id}`). The inline comment marks this as transitional pending Supabase migration. When adding new domain entities, follow the same pattern (state + user-scoped localStorage key) unless you're doing the migration.
- **Soft delete.** `BaseItem` has an optional `isDeleted` flag and the view enum has a `'Lixo'` (trash) view — design new entities so they can be soft-deleted rather than removed.
- **Styling.** All styling is inline Tailwind utility classes; the accent green is `#22c55e`, surfaces are `#0a0a0a` / `#1a1a1a`, borders are `border-white/5` or `border-white/10`. There is no design-token file — match these values when adding UI.

## Conventions

- Keep new code TypeScript with explicit `interface`s for domain types (see `Account`, `Transaction`, etc. in `index.tsx`).
- Currency is Kwanza; format as `Kz 0,00` (currency symbol first, comma decimal separator), matching the existing patrimony card.
- Icons: prefer Font Awesome solid classes (`fa-solid fa-...`) since the kit is already loaded by `index.html`.
- Don't add new CDN `<script>` tags without discussing — the project already pulls Tailwind and Font Awesome from CDNs at runtime; a build-time pipeline is not set up.

## Git workflow

The development branch for this task series is `claude/add-claude-documentation-h9TfE`. Push with `git push -u origin <branch>`. Do not open pull requests unless explicitly asked.
