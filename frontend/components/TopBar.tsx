"use client";

export function TopBar({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-brand text-[13px] font-semibold text-white">
          A
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold text-ink">Artixio</p>
          <p className="hidden text-xxs text-ink-faint sm:block">Triage console</p>
        </div>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search directives by title or reference"
          className="w-full rounded-md border border-border bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-light/40 focus:border-brand-light"
        />
      </div>
    </header>
  );
}
