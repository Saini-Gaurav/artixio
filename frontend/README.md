# Artixio Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS + TanStack Query + TanStack Table.

A single-page triage console — not a multi-page dashboard — built for a compliance officer who
needs to process records quickly: high data density, minimal chrome, and a consistent visual
language for "does this record need attention."

See the root `README.md` for full setup instructions covering both backend and frontend together.

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Runs on `http://localhost:3000`. Requires the backend running on `http://localhost:8000` (see
`../backend/README.md`) — change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if yours runs
elsewhere.

## Structure

```
app/
  layout.tsx        root layout, global providers
  page.tsx           the triage console (single page)
  providers.tsx      TanStack Query client
  globals.css        Tailwind base + design tokens
components/
  TopBar.tsx                wordmark + global search
  FilterBar.tsx             authority/status/severity/corrupt filters + live counts
  DirectivesTable.tsx       main dense table (TanStack Table) — expandable rows, hover tooltips,
                            skeleton/error/empty states
  ActionItemsSubTable.tsx   nested table on row expansion — optimistic status updates
  StatusSelect.tsx          action item status dropdown
  IntegrityBadge.tsx        clean/flagged/corrupt badge + the row integrity rail
  Pagination.tsx
lib/
  api.ts      fetch wrapper against the backend, including ApiClientError for structured error handling
  types.ts    shared TypeScript types
  utils.ts    formatting helpers
```

## Notable implementation details

- **Integrity rail** (`IntegrityBadge.tsx`) — the colored left-edge bar on every directive row is
  rendered as the first child *inside* the row's first `<td>`, not as a sibling of the `<td>`
  elements. An earlier version rendered it directly under `<tr>`, which shifted every column in
  the row one position to the right relative to the header — a table-layout quirk worth knowing if
  you extend this component.
- **Hover tooltips on truncated text** (`DirectivesTable.tsx`, the "Directive" column) — long
  titles/summaries are `truncate`d for density, with the full text revealed in a small popover on
  hover via a pure-CSS `group`/`group-hover` pattern (no extra dependency). Note this tooltip can
  get visually clipped for rows near the bottom of the scrollable table body; a JS-positioned
  tooltip (e.g. Radix) would be the fix if that becomes a real issue.
- **Optimistic status updates** (`ActionItemsSubTable.tsx`) — clicking a new status updates the row
  immediately via `queryClient.setQueryData`, before the network call resolves. On a `409`
  (invalid transition) or any other failure, it rolls back to the previous cached state and shows
  an inline, dismissible error explaining what happened — including which transitions are actually
  allowed from the current state, straight from the backend's error response.
- **Skeleton loaders are sized to match real content** — same column count and header row as the
  loaded table, so nothing shifts position once data arrives.
- **Empty states are contextual** — "no data at all" (nothing seeded yet) reads differently from
  "these filters matched nothing" (which also surfaces a one-click **Clear filters** button).

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | Base URL the frontend calls for all API requests |

## A note on fonts

This project deliberately uses system font stacks instead of `next/font/google` — no build-time
or runtime fetch to Google's font CDN. Given how strictly this assignment is timed and evaluated,
removing an external network dependency from the build felt like the safer call.