export interface Authority {
  id: string;
  name: string;
  code: string;
  country: string;
  websiteUrl: string | null;
}

export type ActionItemStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "BLOCKED";

export interface ActionItem {
  id: string;
  directiveId: string;
  title: string;
  description: string | null;
  assignee: string | null;
  status: ActionItemStatus;
  priority: string;
  dueDate: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  directive?: { title: string; referenceCode: string };
}

export interface Directive {
  id: string;
  authorityId: string;
  referenceCode: string;
  title: string;
  summary: string | null;
  rawStatus: string;
  severity: string;
  publishedDate: string | null;
  effectiveDate: string | null;
  isCorrupt: boolean;
  corruptReason: string | null;
  createdAt: string;
  authority: Authority;
  _count?: { actionItems: number };
  actionItems?: ActionItem[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface DirectiveFilters {
  page: number;
  limit: number;
  search?: string;
  authorityId?: string;
  status?: string;
  severity?: string;
  corruptOnly?: boolean;
}
