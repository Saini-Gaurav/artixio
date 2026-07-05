"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Directive } from "@/lib/types";
import { formatDate, titleCase } from "@/lib/utils";
import { IntegrityBadge, IntegrityRail } from "./IntegrityBadge";
import { ActionItemsSubTable } from "./ActionItemsSubTable";

function integrityKind(d: Directive) {
  return d.isCorrupt ? "corrupt" : "clean";
}

export function DirectivesTable({
  directives,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
}: {
  directives: Directive[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<Directive>[]>(
    () => [
      {
        id: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-muted">
            {row.original.referenceCode}
          </span>
        ),
      },
      {
  id: "title",
  header: "Directive",
  cell: ({ row }) => {
    const fullTitle = row.original.title || "(untitled directive)";
    const fullSummary = row.original.summary;

    return (
      <div className="group relative max-w-[360px]">
        <p className="truncate text-sm font-medium text-ink">{fullTitle}</p>
        {fullSummary ? <p className="truncate text-xs text-ink-faint">{fullSummary}</p> : null}

        <div className="invisible absolute left-0 top-full z-20 mt-1 max-w-xs rounded-md bg-ink px-2.5 py-1.5 opacity-0 shadow-panel transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
          <p className="text-xs font-medium text-white">{fullTitle}</p>
          {fullSummary ? <p className="mt-0.5 text-xxs text-white/70">{fullSummary}</p> : null}
        </div>
      </div>
    );
  },
},
      {
        id: "authority",
        header: "Authority",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-ink-muted">
            {row.original.authority?.code ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-xs text-ink-muted">
            {titleCase(row.original.rawStatus) || "—"}
          </span>
        ),
      },
      {
        id: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <span className="text-xs text-ink-muted">
            {titleCase(row.original.severity) || "—"}
          </span>
        ),
      },
      {
        id: "published",
        header: "Published",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-faint">
            {formatDate(row.original.publishedDate)}
          </span>
        ),
      },
      {
        id: "effective",
        header: "Effective",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-faint">
            {formatDate(row.original.effectiveDate)}
          </span>
        ),
      },
      {
        id: "integrity",
        header: "Integrity",
        cell: ({ row }) => (
          <IntegrityBadge
            kind={integrityKind(row.original)}
            reason={row.original.corruptReason}
          />
        ),
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-faint">
            {row.original._count?.actionItems ?? 0}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: directives,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const columnHeaders = [
    "Reference",
    "Directive",
    "Authority",
    "Status",
    "Severity",
    "Published",
    "Effective",
    "Integrity",
    "Items",
  ];

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium text-integrity-corrupt">
          Couldn't load directives.
        </p>
        <p className="text-xs text-ink-faint">
          The API might be starting up, or the backend isn't reachable.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-border-strong"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-canvas">
            <tr className="border-b border-border">
              {columnHeaders.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-xxs font-semibold uppercase tracking-wide text-ink-faint first:pl-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columnHeaders.map((_, j) => (
                  <td key={j} className={clsx("px-3 py-3", j === 0 && "pl-6")}>
                    <div
                      className="h-3.5 animate-pulse rounded bg-border"
                      style={{ width: `${40 + ((i * 7 + j * 13) % 45)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (directives.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium text-ink">
          {hasActiveFilters
            ? "No directives match these filters"
            : "No directives yet"}
        </p>
        <p className="text-xs text-ink-faint">
          {hasActiveFilters
            ? "Try a different authority, status, severity, or search term."
            : "Once directives are seeded or created, they'll show up here."}
        </p>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-border-strong"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-canvas">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-3 py-2 text-xxs font-semibold uppercase tracking-wide text-ink-faint first:pl-6"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const directive = row.original;
            const isExpanded = expandedId === directive.id;
            return (
              <>
                <tr
                  key={row.id}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : directive.id)
                  }
                  className={clsx(
                    "cursor-pointer border-b border-border transition-colors hover:bg-brand-50/60",
                    isExpanded && "bg-brand-50/60",
                  )}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <td
                      key={cell.id}
                      className={clsx(
                        "relative px-3 py-2.5 align-top",
                        idx === 0 && "pl-6",
                      )}
                    >
                      {idx === 0 && (
                        <IntegrityRail kind={integrityKind(directive)} />
                      )}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
                {isExpanded && (
                  <tr className="border-b border-border bg-canvas">
                    <td colSpan={columns.length} className="px-6 py-3">
                      <ActionItemsSubTable directiveId={directive.id} />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
