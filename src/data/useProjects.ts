import { useEffect, useMemo, useState } from "react";
import {
  Project,
  loadAllProjectsCache,
  saveAllProjectsCache,
  loadProjectsByCompanyFromAll,
} from "./projectsStore";
import { useParams } from "react-router-dom";

export function useProjects(apiBase: string, companyId?: string, headers?: HeadersInit) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(!!companyId);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

  const surveyId = useParams().surveyId;

  // ✅ make headers stable (prevents endless calls)
  const stableHeaders = useMemo(() => headers, [JSON.stringify(headers || {})]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ✅ 1) Load ALL projects once (cache-first, then network)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiBase || !surveyId) return;

      // show cache first
      const cachedAll = await loadAllProjectsCache(surveyId);
      if (!cancelled && cachedAll.length > 0) {
        setFromCache(true);
      }

      // fetch all only if online
      if (navigator.onLine) {
        try {
          const url = `${apiBase}/public/surveys/${surveyId}/projects`; // ✅ all companies
          const res = await fetch(url, { headers: stableHeaders, cache: "no-store" });
          if (!res.ok) throw new Error("HTTP " + res.status);

          const data = await res.json();
          const all: Project[] = data.projects || [];

          await saveAllProjectsCache(surveyId, all);
          if (!cancelled) setFromCache(false);
        } catch (e) {
          console.warn("Fetch ALL projects failed; using cache:", e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, surveyId, stableHeaders]);

  // ✅ 2) Whenever companyId changes, just filter from cached ALL
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!surveyId || !companyId) {
        setProjects([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const items = await loadProjectsByCompanyFromAll(surveyId, companyId);
      if (!cancelled) {
        setProjects(items);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [surveyId, companyId]);

  const refresh = async () => {
    if (!surveyId || !navigator.onLine) return;

    const url = `${apiBase}/public/surveys/${surveyId}/projects`;
    const res = await fetch(url, { headers: stableHeaders, cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const all: Project[] = data.projects || [];

    await saveAllProjectsCache(surveyId, all);

    // update current company view immediately
    if (companyId) {
      setProjects(all.filter(p => p.companyId === companyId && p.active !== false));
    }

    setFromCache(false);
  };

  return { projects, loading, offline, fromCache, refresh };
}
