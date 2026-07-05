"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { FilterBar } from "@/components/FilterBar";
import { DirectivesTable } from "@/components/DirectivesTable";
import { Pagination } from "@/components/Pagination";

const LIMIT = 20;

export default function TriageConsole() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [corruptOnly, setCorruptOnly] = useState(false);

  const filters = useMemo(
    () => ({ page, limit: LIMIT, search: search || undefined, authorityId: authorityId || undefined, status: status || undefined, severity: severity || undefined, corruptOnly: corruptOnly || undefined }),
    [page, search, authorityId, status, severity, corruptOnly]
  );

  const { data: authorities = [] } = useQuery({
    queryKey: ["authorities"],
    queryFn: api.authorities.list,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["directives", filters],
    queryFn: () => api.directives.list(filters),
  });

  const { data: corruptCountData } = useQuery({
    queryKey: ["directives", "corrupt-count"],
    queryFn: () => api.directives.list({ page: 1, limit: 1, corruptOnly: true }),
  });

  const { data: flaggedCountData } = useQuery({
    queryKey: ["action-items", "flagged-count"],
    queryFn: () => api.actionItems.list({ flaggedOnly: true, limit: 1 }),
  });

  function resetFilters() {
    setSearch("");
    setAuthorityId("");
    setStatus("");
    setSeverity("");
    setCorruptOnly(false);
    setPage(1);
  }

  const hasActiveFilters = Boolean(search || authorityId || status || severity || corruptOnly);

  function withReset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar search={search} onSearchChange={withReset(setSearch)} />
      <FilterBar
        authorities={authorities}
        authorityId={authorityId}
        status={status}
        severity={severity}
        corruptOnly={corruptOnly}
        onAuthorityChange={withReset(setAuthorityId)}
        onStatusChange={withReset(setStatus)}
        onSeverityChange={withReset(setSeverity)}
        onCorruptOnlyChange={withReset(setCorruptOnly)}
        onReset={resetFilters}
        resultCount={data?.meta.total ?? 0}
        corruptCount={corruptCountData?.meta.total ?? 0}
        flaggedCount={flaggedCountData?.meta.total ?? 0}
      />
      <DirectivesTable
        directives={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={resetFilters}
      />
      <Pagination page={page} limit={LIMIT} total={data?.meta.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
