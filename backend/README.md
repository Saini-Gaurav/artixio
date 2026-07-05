# Artixio Backend

Regulatory Intelligence Triage Pipeline — API layer.

Serves simulated regulatory directives and action items to the triage console, and is
responsible for catching messy source data (missing dates, unrecognized status codes, garbage
priority values) and flagging it rather than crashing or silently accepting it.

## Stack

Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod.

## Folder structure

```
src/
  config/         env, prisma client, logger
  middleware/     error handler, rate limiter, request logger, validation
  dto/            zod schemas for request validation
  repositories/   raw Prisma queries only — no business logic
  services/       business logic — normalization, transition rules, soft delete, audit
  controllers/    thin request/response glue
  routes/         express routers
  utils/          ApiError, ApiResponse, asyncHandler, data normalization
prisma/
  schema.prisma
  seed.ts
```

Every request flows one direction: **Route → Controller → Service → Repository → Prisma →
PostgreSQL**. A controller never touches Prisma directly; a repository never contains a
validation rule or a business decision. If you're reviewing this for an interview, that's the one
architectural point worth being able to explain: it's what makes the business logic (the
normalization rules, the status transition map, the soft-delete behavior) testable and readable
in one place instead of scattered across the app.

## Prerequisites

- Node.js 18+
- PostgreSQL, running locally. These instructions use **pgAdmin**, since that's the most common
  GUI path — a CLI-based Postgres install works identically, you'd just create the database with
  `createdb artixio` instead of the pgAdmin steps below.

## Setup (under 5 minutes)

### 1. Create the database

In **pgAdmin**: connect to your local server → right-click **Databases** → **Create** →
**Database…** → name it `artixio` → **Save**.

### 2. Configure and install

```bash
npm install
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your pgAdmin login (same user/password you use to
connect in pgAdmin itself):

```
DATABASE_URL="postgresql://<your_pg_user>:<your_pg_password>@localhost:5432/artixio?schema=public"
```

### 3. Migrate and seed

```bash
npm run prisma:migrate   # creates every table from prisma/schema.prisma
npm run seed               # populates authorities, directives, and action items
```

`npm run seed` is destructive by design — it clears and regenerates the mock dataset every time
it's run, so re-run it freely while testing.

### 4. Start the server

```bash
npm run dev
```

Runs on `http://localhost:8000`. Confirm it's alive: `GET http://localhost:8000/api/v1/health`.

If you'd rather inspect the seeded data visually instead of through the API, `npm run
prisma:studio` opens Prisma Studio, or you can browse the `artixio` database directly in pgAdmin's
query tool.

## Database schema

Three linked entities, plus an audit trail:

```
RegulatoryAuthority (1) ──< ComplianceDirective (1) ──< ActionItem
                                                              ⌐ AuditLog (by actionItemId, no FK)
```

- **RegulatoryAuthority** — the issuing body (FDA, EMA, MHRA, CDSCO, PMDA). Reference data.
- **ComplianceDirective** — a regulatory update tied to an authority. `rawStatus`, `severity`,
  `publishedDate`, and `effectiveDate` are stored **loosely** (free text / nullable) on purpose —
  this models data arriving from an external feed that cannot be trusted to already match our
  vocabulary. Each row carries `isCorrupt` / `corruptReason`, computed once at write time by
  `normalizeDirective()` (`src/utils/normalizeRegulatoryData.ts`) and reused by both the seed
  script and the live API, so a record is judged the same way no matter when it's evaluated.
- **ActionItem** — an internal task a compliance officer raises against a directive. `status` **is**
  a strict Prisma enum (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `BLOCKED`) — unlike the directive
  fields above, this state is set exclusively through our own API, so there's no external source
  of truth to be messy about. `priority` follows the same loose-and-flagged pattern, via
  `normalizePriority()`.
- **AuditLog** — a plain, append-only table (`actionItemId`, `previousStatus`, `newStatus`,
  `changedAt`) recording every action item status change, written in the same Prisma transaction
  as the status update itself so the two can never drift apart. It's deliberately not related back
  to `ActionItem` via a foreign key — the trail should outlive whatever happens to the item it
  describes.

### Why status/severity/priority aren't enums

It would be simpler to make `rawStatus`, `severity`, and `priority` Prisma enums too, but that
would mean the database silently rejects anything that doesn't already match our vocabulary —
which defeats the entire point of an assignment about handling messy source data. They're stored
as-is and normalized/flagged in the service layer, so a bad record is visible and explainable in
the API response instead of causing an insert failure.

## Soft delete

Regulatory records are never physically deleted. `ComplianceDirective` and `ActionItem` both carry
a nullable `deletedAt`; `DELETE` sets it, nothing hard-deletes.

- Every existing `findMany`/`findById` filters `deletedAt: null` by default — a soft-deleted
  record just stops appearing in `GET /directives`, `GET /action-items`, etc. No caller had to
  change.
- `findById` uses `findFirst` rather than `findUnique`, since Prisma can't combine a unique-field
  lookup with an extra `deletedAt` condition.
- A soft-deleted directive's action items are excluded from its nested `actionItems` include the
  same way.
- Restore is **idempotent** — restoring something that isn't deleted just returns it as-is, rather
  than erroring.
- `RegulatoryAuthority` was left out on purpose — it's reference data with no delete endpoint, so
  there's nothing to soft-delete against.

## Seeded edge cases

`prisma/seed.ts` includes five hand-written directives that intentionally hit:

- A typo in status that's still recoverable (`actve` → `active`)
- A completely unrecognized status and severity (`N/A`, `unknown`)
- Both date fields missing entirely
- `effectiveDate` earlier than `publishedDate`
- A missing title

On top of these, ~25 additional directives are generated with `@faker-js/faker`, with a random
subset of action item priorities intentionally set to garbage values (`asap`, `tbd`, empty
string, etc.) so the flagged ratio stays visible without every record being hand-authored.

## API reference

Base URL: `/api/v1`

### Authorities
| Method | Path | Description |
|---|---|---|
| GET | `/authorities` | List all authorities |
| GET | `/authorities/:id` | Get one authority |
| POST | `/authorities` | Create an authority |

### Directives
| Method | Path | Description |
|---|---|---|
| GET | `/directives` | List directives. Query: `page`, `limit`, `search`, `authorityId`, `status`, `severity`, `corruptOnly` |
| GET | `/directives/:id` | Get one directive with its (non-deleted) action items |
| POST | `/directives` | Create a directive — runs through corruption normalization |
| DELETE | `/directives/:id` | Soft-delete (`204`) |
| POST | `/directives/:id/restore` | Restore a soft-deleted directive (idempotent) |

### Action Items
| Method | Path | Description |
|---|---|---|
| GET | `/action-items` | List action items. Query: `page`, `limit`, `status`, `directiveId`, `flaggedOnly` |
| GET | `/action-items/:id` | Get one action item |
| POST | `/action-items` | Create an action item |
| PATCH | `/action-items/:id/status` | Update status — validated against an allowed-transition map, not any-to-any. Writes an `AuditLog` row in the same transaction. |
| DELETE | `/action-items/:id` | Soft-delete (`204`) |
| POST | `/action-items/:id/restore` | Restore a soft-deleted action item (idempotent) |

All responses are shaped as `{ success, data }` on success or `{ success: false, message,
details? }` on error.

## Database indexes

Every index below backs a query the API actually runs:

| Table | Index | Why |
|---|---|---|
| `ComplianceDirective` | `authorityId` | FK join + `authorityId` filter on `GET /directives` |
| `ComplianceDirective` | `rawStatus` | `status` filter |
| `ComplianceDirective` | `severity` | `severity` filter |
| `ComplianceDirective` | `isCorrupt` | `corruptOnly` filter — the assignment's core triage view |
| `ComplianceDirective` | `publishedDate` | date-range filtering/sorting |
| `ComplianceDirective` | `effectiveDate` | date-range filtering/sorting |
| `ComplianceDirective` | `deletedAt` | checked on every single query via the soft-delete filter |
| `ActionItem` | `directiveId` | FK join + per-directive lookup (row expansion in the UI) |
| `ActionItem` | `status` | `status` filter, also read on every transition check |
| `ActionItem` | `isFlagged` | `flaggedOnly` filter |
| `ActionItem` | `deletedAt` | same reasoning as above |
| `AuditLog` | `actionItemId` | lookups for a given item's history |

Deliberately **not** indexed: `title` / `summary` / `referenceCode` (searched with `contains`,
which a B-tree index can't accelerate — a real deployment would reach for Postgres full-text
search or `pg_trgm`), and `dueDate` / `priority` / `assignee` on `ActionItem` (not filtered or
sorted on by any endpoint today, so an index there would be pure write overhead).

## Testing with Postman

1. Set a `baseUrl` variable to `http://localhost:8000/api/v1`.
2. `GET /health` first, to confirm the server and database connection are both up.
3. `GET /directives?corruptOnly=true` — see exactly which seeded records were flagged and why
   (`corruptReason` on each row).
4. `GET /action-items?flaggedOnly=true` — same, for the priority field.
5. `PATCH /action-items/:id/status` with an invalid transition (e.g. `RESOLVED` → `PENDING`) to
   see the `409` response with the allowed next states.
6. `DELETE /directives/:id` then `GET /directives/:id` — confirm it now `404`s — then `POST
   /directives/:id/restore` and `GET` it again to confirm it's back.

## Useful scripts

```bash
npm run prisma:studio    # browse the database visually
npm run build             # compile TypeScript to dist/
npm start                  # run the compiled build
```