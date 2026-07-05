"use client";

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-4 py-2.5 sm:px-6">
      <p className="text-xs text-ink-faint">
        {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-border-strong disabled:opacity-40 disabled:hover:border-border"
        >
          Previous
        </button>
        <span className="px-1.5 font-mono text-xs text-ink-faint">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:border-border-strong disabled:opacity-40 disabled:hover:border-border"
        >
          Next
        </button>
      </div>
    </div>
  );
}
