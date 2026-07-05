# Architecture

## Request flow

Every request moves in one direction through the backend: a route hands off to a controller,
which calls a service, which calls a repository — the only layer that touches Prisma. Nothing
skips a layer in either direction.

```mermaid
flowchart LR
    subgraph Browser
        UI["Next.js Triage Console<br/>(TanStack Query + Table)"]
    end

    subgraph Backend["Express API"]
        MW["Middleware<br/>helmet · cors · rate limit · zod validate"]
        RT["Routes"]
        CTRL["Controllers"]
        SVC["Services<br/>(normalization, transition rules,<br/>soft delete, audit logging)"]
        REPO["Repositories<br/>(Prisma queries only)"]
    end

    DB[("PostgreSQL")]

    UI -->|"fetch /api/v1/*"| MW --> RT --> CTRL --> SVC --> REPO --> DB
    DB --> REPO --> SVC --> CTRL --> UI
```

**Why the split matters:** routes wire an HTTP verb + path to a controller and declare which zod
schema validates the request — no logic lives here. Controllers are deliberately thin: pull
params/body, call one service method, shape the response. Services hold every business rule — the
messy-data normalization, the status transition map, the soft-delete/restore logic, and the
decision to write an audit log entry. Repositories are the only files that import the Prisma
client; if Prisma were swapped for another ORM, only this layer would change.

## Status update + audit trail

```mermaid
sequenceDiagram
    participant UI as Triage Console
    participant API as Action Item API
    participant SVC as actionItemService
    participant DB as PostgreSQL

    UI->>API: PATCH /action-items/:id/status { status }
    API->>SVC: updateStatus(id, status)
    SVC->>DB: findById(id) — excludes soft-deleted
    alt transition not allowed
        SVC-->>API: 409 Conflict + allowedNext
        API-->>UI: roll back optimistic update, show inline error
    else transition allowed
        SVC->>DB: transaction [update status, insert AuditLog row]
        DB-->>SVC: updated action item
        SVC-->>API: 200 OK
        API-->>UI: confirm update
    end
```

The status update and its audit log row are written in a single Prisma `$transaction`
(`actionItemRepository.updateStatusWithAudit`) — so the two can never drift apart.

## Soft delete

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant SVC as directiveService / actionItemService
    participant DB

    Client->>API: DELETE /directives/:id
    API->>SVC: remove(id)
    SVC->>DB: findById(id) — 404 if already gone
    SVC->>DB: softDelete(id) → sets deletedAt
    API-->>Client: 204 No Content

    Client->>API: POST /directives/:id/restore
    API->>SVC: restore(id)
    SVC->>DB: findByIdIncludingDeleted(id)
    alt not currently deleted
        SVC-->>API: return record unchanged (idempotent)
    else deleted
        SVC->>DB: restore(id) → clears deletedAt
    end
    API-->>Client: 200 OK
```

Every existing `findMany` / `findById` filters `deletedAt: null` automatically, so nothing that
already called those repository methods had to change when soft delete was introduced.

## Data model

```mermaid
erDiagram
    RegulatoryAuthority ||--o{ ComplianceDirective : issues
    ComplianceDirective ||--o{ ActionItem : "raises"

    RegulatoryAuthority {
        string id PK
        string name
        string code
        string country
    }
    ComplianceDirective {
        string id PK
        string authorityId FK
        string referenceCode
        string title
        string rawStatus "free text, not an enum"
        string severity "free text, not an enum"
        datetime publishedDate "nullable"
        datetime effectiveDate "nullable"
        boolean isCorrupt
        string corruptReason "nullable"
        datetime deletedAt "nullable, soft delete"
    }
    ActionItem {
        string id PK
        string directiveId FK
        string title
        enum status "PENDING | IN_PROGRESS | RESOLVED | BLOCKED"
        string priority "free text, not an enum"
        boolean isFlagged
        datetime deletedAt "nullable, soft delete"
    }
    AuditLog {
        string id PK
        string actionItemId "no FK - survives independently"
        string previousStatus
        string newStatus
        datetime changedAt
    }
```

`rawStatus`, `severity`, and `priority` are intentionally untyped strings rather than Postgres
enums — see `backend/README.md` for the full reasoning. `ActionItem.status` is the one enum in the
schema, because it's exclusively set through our own API rather than an external feed.
`AuditLog` has no foreign key back to `ActionItem` on purpose — the audit trail should outlive
whatever happens to the item it describes (including a soft delete).