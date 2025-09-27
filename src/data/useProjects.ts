import { useEffect, useState } from "react";
import { Project, loadProjectsCache, saveProjectsCache } from "./projectsStore";

export function useProjects(apiBase: string, companyId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(!!companyId);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId) {
        setProjects([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      // 1) show cache first
      const cached = await loadProjectsCache(companyId);
      if (!cancelled && cached) {
        setProjects(cached);
        setFromCache(true);
        setLoading(false);
      }

      // 2) then fetch online if possible
    const url = companyId
    ? `${apiBase}/public/projects?companyId=${encodeURIComponent(companyId)}`
    : `${apiBase}/public/projects`;

    if (navigator.onLine) {
    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          const items: Project[] = (data.items || []);
          if (!cancelled) {
            setProjects(items);
            setFromCache(false);
            setLoading(false);
          }
          await saveProjectsCache(companyId, items);
        } catch (e) {
          if (!cancelled) setLoading(false);
          console.warn("Fetch projects failed; using cache if any:", e);
        }
      } else {
        if (!cached && !cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [apiBase, companyId]);

  const refresh = async () => {
    if (!companyId || !navigator.onLine) return;
    const res = await fetch(`${apiBase}/public/projects?companyId=${encodeURIComponent(companyId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items: Project[] = (data.items || []);
    setProjects(items);
    setFromCache(false);
    await saveProjectsCache(companyId, items);
  };

  return { projects, loading, offline, fromCache, refresh };
}
