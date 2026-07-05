"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import { ActionItem, ActionItemStatus, Paginated } from "@/lib/types";
import { formatDate, titleCase } from "@/lib/utils";
import { StatusSelect } from "./StatusSelect";
import { IntegrityBadge } from "./IntegrityBadge";

export function ActionItemsSubTable({ directiveId }: { directiveId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["action-items", { directiveId }];
  const [statusError, setStatusError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => api.actionItems.list({ directiveId, limit: 50 }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionItemStatus }) =>
      api.actionItems.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      setStatusError(null);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ data: ActionItem[]; meta: Paginated<ActionItem>["meta"] }>(queryKey);

      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          data: previous.data.map((item) => (item.id === id ? { ...item, status } : item)),
        });
      }

      return { previous };
    },

    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (err instanceof ApiClientError && err.status === 409) {
        const allowed = (err.details as { allowedNext?: string[] } | undefined)?.allowedNext;
        setStatusError(
          allowed && allowed.length > 0
            ? `${err.message}. Allowed next: ${allowed.map(titleCase).join(", ")}.`
            : err.message
        );
      } else {
        setStatusError("Couldn't update status. Please try again.");
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-md border border-integrity-corrupt-bg bg-integrity-corrupt-bg px-3 py-2">
        <p className="text-xs text-integrity-corrupt">Couldn't load action items for this directive.</p>
        <button onClick={() => refetch()} className="text-xs font-medium text-integrity-corrupt underline">
          Retry
        </button>
      </div>
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {statusError && (
        <div className="flex items-center justify-between border-b border-integrity-corrupt-bg bg-integrity-corrupt-bg px-3 py-1.5">
          <p className="text-xxs text-integrity-corrupt">{statusError}</p>
          <button onClick={() => setStatusError(null)} className="text-xxs font-medium text-integrity-corrupt underline">
            Dismiss
          </button>
        </div>
      )}
      <table className="w-full min-w-[700px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-canvas">
            <th className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wide text-ink-faint">Task</th>
            <th className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wide text-ink-faint">Assignee</th>
            <th className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wide text-ink-faint">Priority</th>
            <th className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wide text-ink-faint">Due</th>
            <th className="px-3 py-1.5 text-xxs font-semibold uppercase tracking-wide text-ink-faint">Status</th>
          </tr>
        </thead>
        {isLoading ? (
          <tbody>
            {[0, 1].map((i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5" colSpan={5}>
                  <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
                </td>
              </tr>
            ))}
          </tbody>
        ) : items.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={5} className="px-3 py-3 text-xs text-ink-faint">
                No action items raised against this directive yet.
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {items.map((item: ActionItem) => {
              const isMutatingThis = mutation.isPending && mutation.variables?.id === item.id;
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm text-ink">{item.title}</p>
                    {item.description ? <p className="text-xs text-ink-faint">{item.description}</p> : null}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-ink-muted">{item.assignee ?? "Unassigned"}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-ink-muted">{titleCase(item.priority) || "—"}</span>
                      {item.isFlagged && <IntegrityBadge kind="flagged" reason={item.flagReason} />}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-xs text-ink-faint">{formatDate(item.dueDate)}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <StatusSelect
                        value={item.status}
                        disabled={isMutatingThis}
                        onChange={(status) => mutation.mutate({ id: item.id, status })}
                      />
                      {isMutatingThis && (
                        <span
                          className="h-3 w-3 animate-spin rounded-full border-2 border-border-strong border-t-brand-light"
                          aria-label="Updating"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
}
