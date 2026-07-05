// This is the one place that knows what "clean" regulatory data looks like.
// Both the seed script and the directive service call into this so a record
// gets flagged the same way no matter when it's evaluated.

export const ALLOWED_STATUSES = ["active", "superseded", "withdrawn", "draft"] as const;
export const ALLOWED_SEVERITIES = ["low", "medium", "high", "critical"] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];
type AllowedSeverity = (typeof ALLOWED_SEVERITIES)[number];

// Common typos / casing variants seen in real regulatory feeds. Not
// exhaustive on purpose - anything outside this map still gets flagged
// rather than silently guessed at.
const STATUS_ALIASES: Record<string, AllowedStatus> = {
  active: "active",
  actve: "active",
  actif: "active",
  superseded: "superseded",
  suprseded: "superseded",
  withdrawn: "withdrawn",
  witdrawn: "withdrawn",
  draft: "draft",
};

const SEVERITY_ALIASES: Record<string, AllowedSeverity> = {
  low: "low",
  medium: "medium",
  med: "medium",
  high: "high",
  critical: "critical",
  crit: "critical",
  severe: "critical",
};

export interface DirectiveInput {
  rawStatus: string | null | undefined;
  severity: string | null | undefined;
  publishedDate: Date | null | undefined;
  effectiveDate: Date | null | undefined;
}

export interface NormalizedDirective {
  normalizedStatus: AllowedStatus | null;
  normalizedSeverity: AllowedSeverity | null;
  isCorrupt: boolean;
  corruptReason: string | null;
}

function cleanToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeDirective(input: DirectiveInput): NormalizedDirective {
  const reasons: string[] = [];

  const statusToken = cleanToken(input.rawStatus);
  const normalizedStatus = STATUS_ALIASES[statusToken] ?? null;
  if (!normalizedStatus) {
    reasons.push(`unrecognized status "${input.rawStatus ?? ""}"`);
  }

  const severityToken = cleanToken(input.severity);
  const normalizedSeverity = SEVERITY_ALIASES[severityToken] ?? null;
  if (!normalizedSeverity) {
    reasons.push(`unrecognized severity "${input.severity ?? ""}"`);
  }

  if (!input.publishedDate) {
    reasons.push("missing publishedDate");
  }

  if (
    input.publishedDate &&
    input.effectiveDate &&
    input.effectiveDate.getTime() < input.publishedDate.getTime()
  ) {
    reasons.push("effectiveDate precedes publishedDate");
  }

  return {
    normalizedStatus,
    normalizedSeverity,
    isCorrupt: reasons.length > 0,
    corruptReason: reasons.length > 0 ? reasons.join("; ") : null,
  };
}

export function normalizePriority(priority: string | null | undefined): {
  normalizedPriority: AllowedSeverity | null;
  isFlagged: boolean;
  flagReason: string | null;
} {
  const token = cleanToken(priority);
  const normalizedPriority = SEVERITY_ALIASES[token] ?? null;

  return {
    normalizedPriority,
    isFlagged: !normalizedPriority,
    flagReason: normalizedPriority ? null : `unrecognized priority "${priority ?? ""}"`,
  };
}
