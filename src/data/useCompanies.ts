import { useEffect, useState } from "react";
import { Company, loadCompaniesCache, saveCompaniesCache } from "./companiesStore";
import { useParams } from "react-router-dom";

export function useCompanies(apiBase?: string , headers?: HeadersInit) {

  useEffect(() => {
    if (!apiBase) return;
    if (!headers) return;
  }, [apiBase , headers]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const surveyId = useParams().surveyId;
  const url = `${apiBase}/public/surveys/${surveyId}/companies`;

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

      // 1️⃣ load cached data first
      const cached = await loadCompaniesCache();
      if (!cancelled && cached) {
        setCompanies(cached);
        setFromCache(true);
        setLoading(false);
      }

      // 2️⃣ if online — fetch from API with auth header
      if (navigator.onLine) {
        try {
          const res = await fetch(url, {
            headers,
            cache: "no-store",
          });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          console.log("Fetched companies data:", data);
          const items: Company[] = (data.companies || []).filter((c: Company) => c.active !== false);
          if (!cancelled) {
            setCompanies(items);
            setFromCache(false);
            setLoading(false);
          }
          await saveCompaniesCache(items);
        } catch (e) {
          if (!cancelled) setLoading(false);
          console.warn("Fetch companies failed, using cache if any:", e);
        }
      } else {
        if (!cached && !cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  const refresh = async () => {
    if (!navigator.onLine) return;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items: Company[] = (data.companies || []).filter((c: Company) => c.active !== false);
    setCompanies(items);
    setFromCache(false);
    await saveCompaniesCache(items);
  };

  return { companies, loading, offline, fromCache, refresh };
}