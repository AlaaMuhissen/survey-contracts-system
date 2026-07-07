import { API } from "../constants";
import { Company, Project, ReportResponse } from "../types";


const base = (sid: string) => `${API.replace(/\/+$/,'')}/surveys/${encodeURIComponent(sid)}`;
export type HeadersLike = { [k: string]: string };





export async function listWorklogs(
  surveyId: string,
  headers: HeadersLike,
  params: { limit?: number; cursor?: string | null; q?: string }
) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.q?.trim()) sp.set("q", params.q.trim());

  const base = `${API}/surveys/${encodeURIComponent(surveyId)}/worklogs`;
  const url = sp.toString() ? `${base}?${sp.toString()}` : base;

  const res = await fetch(url, { headers });
  const text = await res.text();

  // Never return JSX here — signal unauthorized to the caller
  if (res.status === 401) localStorage.removeItem("adminToken");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, got: ${text.slice(0, 200)}`);
  }
}


export async function getFileUrl(headers: HeadersLike, storageKey: string, expiresSeconds = 3600) {
  const res = await fetch(`${API}/admin/file-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({ storageKey, expiresSeconds }),
  });

  if (res.status === 401)  localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json() as Promise<{ url?: string }>;
}

export async function fetchCompanies(headers: HeadersLike, surveyId: string) {
  const r = await fetch(`${API}/surveys/${surveyId}/companies`, { headers });
  if (r.status === 401) localStorage.removeItem("adminToken");
  if (!r.ok) throw new Error("companies");
  const j = await r.json();
  return (j.items || []) as Company[];
}

export async function fetchProjects(headers: HeadersLike, companyId?: string , surveyId?: string) {
  const url = companyId 
    ? `${API}/surveys/${surveyId}/companies/${companyId}/projects`
    : `${API}/surveys/${surveyId}/projects`;
    console.log("headers", headers)
  const r = await fetch(url, { headers });

  const j = await r.json();
  console.log('fetch project' , j.rows)
  return (j.rows || []) as Project[];
}

// Build the URL server expects (filters by NAME for company/project)
export function buildReportUrl(base: string, params: {
  from?: string;
  to?: string;
  companyName?: string;
  projectName?: string;
  companyId?: string;
  projectId?: string;
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
  params: { from?: string; to?: string; companyName?: string; projectName?: string , companyId?: string; projectId?: string  }
) {
  const url = buildReportUrl(baseUrl, params);
  const r = await fetch(url, { headers });
  if (r.status === 401)  localStorage.removeItem("adminToken");
  if (!r.ok) throw new Error("report");
  const j = (await r.json()) as ReportResponse;
  return j || { rows: [] };
}

export async function fetchReportBlob(
  headers: HeadersLike,
  baseUrl: string,
  params: { from?: string; to?: string; companyName?: string; projectName?: string; companyId?: string; projectId?: string; format?: "csv" }
) {
  const url = buildReportUrl(baseUrl, params);
  const r = await fetch(url, { headers });

  if (r.status === 401)  localStorage.removeItem("adminToken");
  if (!r.ok) throw new Error("report-blob");
  return r.blob();
}



export async function getCompanies(surveyId: string, headers: Record<string,string>) {
  const res = await fetch(`${base(surveyId)}/companies`, { headers });
  console.log("getCompanies response", res);
  if (res.status === 401) localStorage.removeItem("adminToken");
  const data = await res.json();
  return (data.items || []) as Company[];
  }
export async function getProjects(surveyId: string, headers: Record<string,string>) {
  const res = await fetch(`${base(surveyId)}/projects`, { headers });
  console.log("getProjects response", res);
  if (res.status === 401)  localStorage.removeItem("adminToken");
  const data = await res.json();
  return (data.rows || []) as Project[];
}

export async function createCompany(surveyId: string, headers: Record<string,string>, name: string, companyNumber?: string, contactPerson?: string, contactEmail?: string, contactPhone?: string) {
  const res = await fetch(`${base(surveyId)}/companies`, {
    method: "POST", headers, body: JSON.stringify({ name , companyNumber , contactPerson , contactEmail , contactPhone }),
  });

  if (res.status === 401)  localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("createCompany failed");
}

export async function updateCompany(
  surveyId: string,
  companyId: string,
  headers: Record<string, string>,
  data: {
    name?: string;
    companyNumber?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  }
) {
  const res = await fetch(`${base(surveyId)}/companies/${companyId}`, {
    method: "PUT", 
    headers,
    body: JSON.stringify(data),
  });

  if (res.status === 401)  localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("updateCompany failed");
}


export async function deleteCompany(surveyId: string, headers: Record<string,string>, id: string) {
  const res = await fetch(`${base(surveyId)}/companies/${id}`, { method: "DELETE", headers });

  if (res.status === 401) localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("deleteCompany failed");
}

export async function createProject(
  surveyId: string,
  headers: Record<string,string>,
  body: { name: string; companyId: string , cost: number, address: string }
) {
  console.log("createProject", body);
  console.log("header", headers);
  const res = await fetch(`${base(surveyId)}/projects`, {
    method: "POST", headers, body: JSON.stringify(body),
  });

  if (res.status === 401)  localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("createProject failed");
}

export async function deleteProject(surveyId: string, headers: Record<string,string>, id: string) {
  const res = await fetch(`${base(surveyId)}/projects/${id}`, { method: "DELETE", headers });
  if (res.status === 401) localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("deleteProject failed");
}

export async function patchProject(
  surveyId: string,
  headers: Record<string,string>,
  id: string,
  patch: Partial<Pick<Project,"name"|"isActive"|"companyId">>
) {
  const res = await fetch(`${base(surveyId)}/projects/${id}`, {
    method: "PATCH", headers, body: JSON.stringify(patch),
  });
  if (res.status === 401) localStorage.removeItem("adminToken");
  if (!res.ok) throw new Error("patchProject failed");
}


export async function fetchProjectById(
  surveyId: string,
  headers: Record<string, string>,
  companyId: string,
  projectId: string
) {
  const r = await fetch(
    `${base(surveyId)}/companies/${companyId}/projects/${projectId}`,
    { headers }
  );
  const text = await r.text();
  if (r.status === 401)  localStorage.removeItem("adminToken");
  if (!r.ok) throw new Error(text);
  return r.json(); 
}
