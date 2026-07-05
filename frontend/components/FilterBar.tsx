"use client";

import clsx from "clsx";
import { Authority } from "@/lib/types";

const STATUS_OPTIONS = ["active", "superseded", "withdrawn", "draft"];
const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"];

interface Props {
  authorities: Authority[];
  authorityId: string;
  status: string;
  severity: string;
  corruptOnly: boolean;
  onAuthorityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSeverityChange: (v: string) => void;
  onCorruptOnlyChange: (v: boolean) => void;
  onReset: () => void;
  resultCount: number;
  corruptCount: number;
  flaggedCount: number;
}

function selectClass() {
  return "rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-light/40 focus:border-brand-light";
}

export function FilterBar({
  authorities,
  authorityId,
  status,
  severity,
  corruptOnly,
  onAuthorityChange,
  onStatusChange,
  onSeverityChange,
  onCorruptOnlyChange,
  onReset,
  resultCount,
  corruptCount,
  flaggedCount,
}: Props) {
  const hasActiveFilters = Boolean(authorityId || status || severity || corruptOnly);

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-thin">
        <select value={authorityId} onChange={(e) => onAuthorityChange(e.target.value)} className={selectClass()}>
          <option value="">All authorities</option>
          {authorities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass()}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select value={severity} onChange={(e) => onSeverityChange(e.target.value)} className={selectClass()}>
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={() => onCorruptOnlyChange(!corruptOnly)}
          className={clsx(
            "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            corruptOnly
              ? "border-integrity-corrupt bg-integrity-corrupt-bg text-integrity-corrupt"
              : "border-border bg-surface text-ink-muted hover:border-border-strong"
          )}
        >
          Corrupt only
        </button>

        {hasActiveFilters && (
          <button onClick={onReset} className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink-muted hover:underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 text-xxs text-ink-faint sm:text-xs">
        <span className="font-mono text-ink-muted">{resultCount}</span>
        <span>directives</span>
        <span className="text-border-strong">·</span>
        <span className="font-mono text-integrity-flagged">{flaggedCount}</span>
        <span>flagged</span>
        <span className="text-border-strong">·</span>
        <span className="font-mono text-integrity-corrupt">{corruptCount}</span>
        <span>corrupt</span>
      </div>
    </div>
  );
}
