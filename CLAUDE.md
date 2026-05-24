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

There is no test framework, linter, or formatter configured. `package.json` exposes only `dev`, `build`, and `preview`.

## Commands

```
npm install        # install deps
npm run dev        # vite dev server on http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the built bundle
```

Environment variables (Vite-prefixed, read via `import.meta.env`, optional):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If unset, `src/supabaseClient.ts` falls back to a hardcoded public Supabase project (anon/publishable key). Copy `.env.example` to `.env` to override.

## Layout

```
index.html            # mounts #root, loads /src/main.tsx
src/main.tsx          # single-file React app (Auth + App + types + views)
src/supabaseClient.ts # exports shared `supabase` client (env vars + hardcoded fallback)
vite.config.ts        # @ -> ./src alias
tsconfig.json
package.json
.env.example
README.md
```

`copy-of-arlindo-app.zip` (~80 KB) is a historical bundle of the original source — ignore for code reading, do not edit.

## Architecture (all in `src/main.tsx`)

- **Single-file app.** Every component, type, and constant lives in `src/main.tsx`, which mounts `<App />` into `#root`. The shared Supabase client is the only external import (`./supabaseClient`).
- **Auth gate.** `App` subscribes to `supabase.auth.onAuthStateChange`. With no session it returns `<Auth />` (email/password sign-in / sign-up). All other views are unreachable while logged out.
- **Navigation.** A `view` state of type `AppView` (`'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais' | 'Lixo'`) drives which screen renders. There is no router — adding a route means extending the union and adding a `NavIcon` in the bottom nav.
- **Persistence.** Domain data (`accounts`, `transactions`, …) is kept in React state and mirrored to `localStorage` under per-user keys (`accounts_${session.user.id}`, `transactions_${session.user.id}`). This is transitional pending a Supabase migration. New domain entities should follow the same pattern (state + user-scoped localStorage key) unless you're doing the migration.
- **Soft delete.** `BaseItem` has an optional `isDeleted` flag and the view enum has a `'Lixo'` (trash) view — design new entities so they can be soft-deleted rather than removed.
- **Styling.** All styling is inline Tailwind utility classes. Accent green `#22c55e`, surfaces `#0a0a0a` / `#1a1a1a`, borders `border-white/5` or `border-white/10`. No design-token file — match these values.

## Conventions

- TypeScript with explicit `interface`s for domain types (see `Account`, `Transaction`, `Budget`, `Category`, `AppSettings` in `src/main.tsx`).
- Currency is Kwanza; format as `Kz 0,00` (currency symbol first, comma decimal separator).
- Icons: prefer Font Awesome solid (`fa-solid fa-...`) since the kit is already loaded by `index.html`.
- Don't add new CDN `<script>` tags without discussing — Tailwind and Font Awesome are already pulled from CDNs at runtime; a build-time CSS pipeline is not set up.

## Git workflow

The development branch for this task series is `claude/add-claude-documentation-h9TfE`. Push with `git push -u origin <branch>`. Do not open pull requests unless explicitly asked.
