import { useCallback, useEffect, useMemo, useState } from "react";
import { listWorklogs, getFileUrl, fetchProjectById, fetchProjects } from "../api/adminApi";
import { Filters, WorkLog } from "../types";
import { tsToMs } from "../../utils/time";
import { useNavigate } from "react-router-dom";
type ProjectMeta = { id: string; name: string; address?: string; companyId: string };

export function useWorklogs(headers: Record<string,string> , surveyId: string) {
  const [items, setItems] = useState<WorkLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ day: "all", hasFile: "all" });
  const [projectMeta, setProjectMeta] = useState<ProjectMeta[]>([]);
  const adminKey = localStorage.getItem("adminToken") || "";
  const hasKey = Boolean(adminKey.trim());
  const nav = useNavigate()
    useEffect(() => {
      // load all projects once (or when surveyId changes)
      if (!hasKey) return;
       fetchProjects(headers, undefined, surveyId)   // "" => all companies (based on your API)
        .then(setProjectMeta)
        .catch((e: any) => {
            if (e?.code === 401) {
              nav("/");
              return;
            }
            throw e;
          })
    }, [headers, surveyId]);

    const projectById = useMemo(() => {
      const m = new Map<string, ProjectMeta>();
      for (const p of projectMeta) m.set(p.id, p);
      return m;
    }, [projectMeta]);


const fetchPage = useCallback(async (cursor?: string | null) => {
  console.log("useWorklogs fetchPage inn", { surveyId, headers, cursor });
  setLoading(true);
  try {
    const data = await listWorklogs(surveyId, headers, {
      limit: 25,
      cursor: cursor ?? null,
      q: filters.q?.trim() || undefined,
    });
    if (!cursor) setItems(data.items);
    else setItems((s) => [...s, ...data.items]);
    setNextCursor(data.nextCursor ?? null);
  }  catch (e: any) {
  if (e?.code === 401) {
    nav("/");
    return;
  }
  throw e;
}
  finally {
    setLoading(false);
  }
}, [headers, filters.q, surveyId]); // ✅ include surveyId


  const regenUrl = useCallback(async (w: WorkLog) => {
     console.log("regenUrl function", { surveyId ,headers
  });
    if (!w.storageKey) return;
    const { url } = await getFileUrl(headers, w.storageKey, 3600);
    if (url) window.open(url, "_blank");
  }, [headers, surveyId]);

  // derive company & project options
  const companyOptions = useMemo(() => {
  //    console.log("companyOptions function", { surveyId ,headers
  // });
    const set = new Set(items.map(w => (w.company || "").trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
  }, [items, surveyId ,headers]);

  const getProject = useCallback(async ( companyId :string, projectId: string) => {
  setLoading(true);
  try {
    const data = await fetchProjectById(surveyId, headers, companyId, projectId);
    console.log("fetched project data:", data);
    return data;
    }  catch (e: any) {
  if (e?.code === 401) {
    nav("/");
    return;
  }
  throw e;
}
  finally {
    setLoading(false);
  }
    
  }, [ surveyId ,headers]);

  const projectOptions = useMemo(() => {
    // console.log("projectOptions function", { surveyId ,headers});
    const source = filters.company ? items.filter(w => (w.company || "") === filters.company) : items;
    const set = new Set(source.map(w => (w.project || "").trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
  }, [items, filters.company , surveyId , headers]);
  
  const projectOptionsWithAddress = useMemo(() => {
  const source = filters.company
    ? items.filter(w => (w.company || "") === filters.company)
    : items;

  const ids = new Set(
    source.map(w => (w.projectId || "").trim()).filter(Boolean)
  );

  const opts = Array.from(ids)
    .map(id => {
      const p = projectById.get(id);
      return p
        ? { id: p.id, label: `${p.name}${p.address ? ` — ${p.address}` : ""}` }
        : { id, label: id }; // fallback
    })
    .sort((a, b) => a.label.localeCompare(b.label, "he"));

  return opts;
}, [items, filters.company, projectById]);

const itemsWithProject = useMemo(() => {
  return items.map((w) => {
    const p = w.projectId ? projectById.get(String(w.projectId)) : undefined;
    return {
      ...w,
      address: p?.address || "",
    };
  });
}, [items, projectById]);

const filtered = useMemo(() => {
  const fromMs = filters.from ? new Date(filters.from + "T00:00:00").getTime() : null;
  const toMs   = filters.to   ? new Date(filters.to   + "T23:59:59").getTime() : null;
  const numQ   = (filters.number || "").trim();
  const teamQ  = (filters.teamLead || "").trim().toLowerCase();
  const addrQ  = (filters.address || "").trim().toLowerCase(); // if you add this filter

  return itemsWithProject.filter((w: any) => {
    if (numQ && !w.number.includes(numQ)) return false;
    if (filters.company && (w.company || "") !== filters.company) return false;
    if (filters.project && (w.project || "") !== filters.project) return false;
   

    // better: filter by projectId if you have it
    if (filters.projectId && (w.projectId || "") !== filters.projectId) return false;

    // optional: filter by address
    if (addrQ && !(w.projectAddress || "").toLowerCase().includes(addrQ)) return false;

    if (teamQ) {
      const tl = (w.teamLead || "").toLowerCase();
      if (!tl.includes(teamQ)) return false;
    }

    if (filters.day !== "all" && (w.dayType || "full") !== filters.day) return false;

    const hasFile = Boolean(w.fileUrl || w.storageKey);
    if (filters.hasFile === "yes" && !hasFile) return false;
    if (filters.hasFile === "no"  && hasFile) return false;

    const ms = tsToMs(w.createdAt);
    if (fromMs && (ms ?? 0) < fromMs) return false;
    if (toMs   && (ms ?? 0) > toMs)   return false;

    return true;
  });
}, [itemsWithProject, filters]);

  return {
    items, filtered, nextCursor, loading,
    filters, setFilters,
    companyOptions, projectOptions,
    fetchPage, regenUrl,
  };
}
