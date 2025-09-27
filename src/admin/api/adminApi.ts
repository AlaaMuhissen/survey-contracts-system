import { API } from "../constants";
import { WorkLog,Company, Project, ReportResponse } from "../types";

export type HeadersLike = { [k: string]: string };

export async function getKeyMeta(adminKey: string) {
  const res = await fetch(`${API}/admin/key/meta`, {
    headers: { "x-admin-key": adminKey.trim() },
  });
  if (!res.ok) throw new Error("unauthorized");
  return res.json();
}

export async function listWorklogs(headers: HeadersLike, params: {
  limit?: number; cursor?: string | null; q?: string;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  const res = await fetch(`${API}/admin/worklogs?${sp.toString()}`, { headers });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json() as Promise<{ items: WorkLog[]; nextCursor?: string | null }>;
}

export async function getFileUrl(headers: HeadersLike, storageKey: string, expiresSeconds = 3600) {
  const res = await fetch(`${API}/admin/file-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({ storageKey, expiresSeconds }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json() as Promise<{ url?: string }>;
}

export async function fetchCompanies(headers: HeadersLike) {
  const r = await fetch(`${API}/admin/companies`, { headers });
  if (!r.ok) throw new Error("companies");
  const j = await r.json();
  return (j.items || []) as Company[];
}

export async function fetchProjects(headers: HeadersLike, companyId?: string) {
  const url = companyId
    ? `${API}/admin/projects?companyId=${encodeURIComponent(companyId)}`
    : `${API}/admin/projects`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error("projects");
  const j = await r.json();
  return (j.items || []) as Project[];
}

// Build the URL server expects (filters by NAME for company/project)
export function buildReportUrl(base: string, params: {
  from?: string;
  to?: string;
  companyName?: string;
  projectName?: string;
  format?: "csv";
}) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.companyName) qs.set("company", params.companyName);
  if (params.projectName) qs.set("project", params.projectName);
  if (params.format) qs.set("format", params.format);
  return `${base}?${qs.toString()}`;
}

export async function fetchReportCompanyProjectDays(
  headers: HeadersLike,
  baseUrl: string,
  params: { from?: string; to?: string; companyName?: string; projectName?: string }
) {
  const url = buildReportUrl(baseUrl, params);
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error("report");
  const j = (await r.json()) as ReportResponse;
  return j || { rows: [] };
}

export async function fetchReportBlob(
  headers: HeadersLike,
  baseUrl: string,
  params: { from?: string; to?: string; companyName?: string; projectName?: string; format?: "csv" }
) {
  const url = buildReportUrl(baseUrl, params);
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error("report-blob");
  return r.blob();
}

export async function getCompanies(headers: HeadersLike): Promise<Company[]> {
  const r = await fetch(`${API}/admin/companies`, { headers });
  if (!r.ok) throw new Error("companies");
  const j = await r.json();
  return (j.items || []).map((c: any) => ({ id: c.id, name: c.name }));
}

export async function createCompany(headers: HeadersLike, name: string) {
  const r = await fetch(`${API}/admin/companies`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error("create-company");
}

export async function deleteCompany(headers: HeadersLike, id: string) {
  const r = await fetch(`${API}/admin/companies/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!r.ok) throw new Error("delete-company");
}

// Projects
export async function getProjects(headers: HeadersLike): Promise<Project[]> {
  const r = await fetch(`${API}/admin/projects`, { headers });
  if (!r.ok) throw new Error("projects");
  const j = await r.json();
  return j.items || [];
}

export async function createProject(
  headers: HeadersLike,
  args: { name: string; companyId: string }
) {
  const r = await fetch(`${API}/admin/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error("create-project");
}

export async function patchProject(
  headers: HeadersLike,
  id: string,
  patch: Partial<Pick<Project, "isActive" | "name" | "companyId">>
) {
  const r = await fetch(`${API}/admin/projects/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("patch-project");
}

export async function deleteProject(headers: HeadersLike, id: string) {
  const r = await fetch(`${API}/admin/projects/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!r.ok) throw new Error("delete-project");
}