# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SPA frontend for a personal/group finance tracker (Indonesian UI). React 19 + Vite 8 + Redux Toolkit + Tailwind v4, talking to a separate Go backend at `/api/v1`. Deployed as a static bundle to Cloudflare Pages.

## Commands

```bash
npm run dev        # Vite dev server on :5173, proxies /api → http://localhost:8080
npm run build      # tsc (typecheck only, noEmit) && vite build → dist/
npm run preview    # serve the built dist/

# Inside the Docker compose stack (repo induk):
npx vite --config vite.config.docker.js --host 0.0.0.0 --port 5173
```

There is no lint script and no test suite — `npm run build` (the `tsc` step) is the only automated check. `tsconfig.json` runs with `strict: false` and `checkJs: false`, so it catches syntax/module errors, not type errors in `.js`/`.jsx`.

## Architecture

**Path alias**: `@/` → `src/` (defined in `vite.config.js`).

**Routing** (`src/App.jsx`): `/login` public; everything else nests under `ProtectedRoute` → `PageShell` (sidebar + `<Outlet/>`). Unknown paths redirect to `/dashboard`. Pages: dashboard, transactions, installments, reports, members.

**State**: one Redux store (`src/store/index.js`) with 8 slices — auth, transactions, categories, balance, calendar, installments, groups, aiInsight. Always use `useAppDispatch` / `useAppSelector` from `@/store/hooks`, never `react-redux` directly.

Every slice follows the same shape: `createAsyncThunk` per endpoint, a local `apiError(err, fallback)` helper that unwraps the backend's `{"error": "message"}` string form, and a `status: 'idle' | 'loading' | 'succeeded' | 'failed'` + `error` pair in state. Mutation thunks (create/update/delete) intentionally do **not** patch `state.items` — the component re-dispatches the fetch thunk afterward. Follow that pattern rather than introducing optimistic updates.

**Auth flow** — the most delicate part of the app:
- Tokens live in `sessionStorage` (`access_token`, `refresh_token`) plus Redux; there is no persistence across browser sessions.
- The backend **rotates refresh tokens** — each one is single-use. Two consequences that are already handled and must not be broken:
  - `src/lib/api.js` funnels all 401 retries through `refreshOnce()`, a single shared in-flight promise, so concurrent 401s don't burn two rotations.
  - `src/App.jsx` guards the bootstrap refresh with a module-level `bootstrapStarted` flag, because React StrictMode double-invokes effects in dev.
- `authChecked` gates `ProtectedRoute`: while false it renders a spinner instead of redirecting, so a page reload doesn't bounce the user to `/login` mid-refresh.
- Group scoping is baked into the token. `switchGroup` returns a fresh token pair; the calling component then reloads the page so every slice refetches under the new scope. Owner-only UI is derived from `groups.some(g => g.role === 'owner')`.

**API layer** (`src/lib/api.js`): a single axios instance, base URL from `VITE_API_BASE_URL` (fallback `http://localhost:8080/api/v1`). It logs every request/response/error to the console with `[API]` / `[API →]` / `[API ←]` / `[API ✗]` prefixes — deliberate, for debugging CORS and integration issues in deployed builds.

**Types**: JSDoc `@typedef` blocks in `src/types/*.d.ts` (transaction, category, balance) document backend response shapes. They're documentation, not enforced — keep them in sync when API shapes change.

**Dates**: never use `new Date('YYYY-MM-DD')` or `toISOString()` for dates. `src/lib/utils.js` provides `toISODate`, `toISOMonth`, `formatDate` — all built to avoid the UTC shift that moves "today" backward a day in UTC+7. Currency goes through `formatIDR`. Class names go through `cn()` (clsx + tailwind-merge).

**Styling**: Tailwind v4 via `@tailwindcss/vite`, no `tailwind.config.js`. The theme is declared as CSS variables in an `@theme` block in `src/index.css` — "Rose Elegant", light mode only. Use the semantic tokens (`primary`, `income`, `expense`, `brand-*`) rather than raw hex.

`src/lib/mockData.js` is dead code — nothing imports it.

## Deployment

Cloudflare Pages, build command `npm run build`, output dir `dist`. See `DEPLOY_CLOUDFLARE.md`. Three files are load-bearing and easy to overlook:
- `public/_redirects` — SPA fallback; without it, refreshing `/installments` 404s.
- `.env.production` — `VITE_API_BASE_URL`, committed on purpose (public API URL, baked into the bundle at build time). A dashboard env var overrides it.
- `.node-version` (20) — Vite 8 needs Node ≥ 20.

Any new frontend origin must be added to the backend's `CORS_ORIGINS` or every API call fails without a clear error (login just appears to hang/fail).

## Conventions

Code comments and user-facing strings are in Indonesian; keep new code consistent with that. Commit messages follow Conventional Commits, also in Indonesian (`fix(ai-insights): perbaiki ...`).
