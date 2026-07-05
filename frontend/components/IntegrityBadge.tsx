import clsx from "clsx";

type Kind = "clean" | "flagged" | "corrupt";

const STYLES: Record<Kind, string> = {
  clean: "text-ink-muted bg-ink-faint/10",
  flagged: "text-integrity-flagged bg-integrity-flagged-bg",
  corrupt: "text-integrity-corrupt bg-integrity-corrupt-bg",
};

const LABELS: Record<Kind, string> = {
  clean: "Clean",
  flagged: "Flagged",
  corrupt: "Corrupt",
};

export function IntegrityBadge({ kind, reason }: { kind: Kind; reason?: string | null }) {
  return (
    <span
      title={reason ?? undefined}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xxs font-medium uppercase tracking-wide",
        STYLES[kind]
      )}
    >
      {LABELS[kind]}
    </span>
  );
}

// The colored rail rendered on the left edge of a table row. Same three
// states as the badge above, kept visually consistent on purpose - this is
// the one recurring device the whole console is built around.
export function IntegrityRail({ kind }: { kind: Kind }) {
  const color =
    kind === "corrupt" ? "bg-integrity-corrupt" : kind === "flagged" ? "bg-integrity-flagged" : "bg-transparent";
  return <span className={clsx("absolute left-0 top-0 h-full w-[3px]", color)} aria-hidden />;
}
