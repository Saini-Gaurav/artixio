"use client";

import clsx from "clsx";
import { ActionItemStatus } from "@/lib/types";

const OPTIONS: ActionItemStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED", "BLOCKED"];

const DOT_COLOR: Record<ActionItemStatus, string> = {
  PENDING: "bg-state-pending",
  IN_PROGRESS: "bg-state-progress",
  RESOLVED: "bg-state-resolved",
  BLOCKED: "bg-state-blocked",
};

const LABEL: Record<ActionItemStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  BLOCKED: "Blocked",
};

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: ActionItemStatus;
  onChange: (status: ActionItemStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative inline-flex items-center">
      <span
        className={clsx("pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full", DOT_COLOR[value])}
        aria-hidden
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ActionItemStatus)}
        className={clsx(
          "appearance-none rounded-md border border-border bg-surface py-1 pl-5 pr-6 text-xs font-medium text-ink",
          "focus:outline-none focus:ring-2 focus:ring-brand-light/40 focus:border-brand-light",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {LABEL[opt]}
          </option>
        ))}
      </select>
    </div>
  );
}
