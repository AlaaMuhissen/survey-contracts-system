import { useEffect, useState } from "react";
import { Company, loadCompaniesCache, saveCompaniesCache } from "./companiesStore";

export function useCompanies(apiBase: string) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const url = `${apiBase}/public/companies`;

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
      // 1) קודם נטען קאש כדי לעבוד מיד (גם אופליין)
      const cached = await loadCompaniesCache();
      if (!cancelled && cached) {
        setCompanies(cached);
        setFromCache(true);
        setLoading(false);
      }

      // 2) אם יש רשת—נמשוך אונליין ונעדכן קאש
      if (navigator.onLine) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          const items: Company[] = (data.items || []).filter((c: Company) => c.active !== false);
          if (!cancelled) {
            setCompanies(items);
            setFromCache(false);
            setLoading(false);
          }
          await saveCompaniesCache(items);
        } catch (e) {
          // אם נכשל, נשארים עם הקאש
          if (!cancelled) setLoading(false);
          console.warn("Fetch companies failed, using cache if any:", e);
        }
      } else {
        // אופליין מלא: אם לא היה קאש, נציג רשימה ריקה
        if (!cached && !cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  const refresh = async () => {
    if (!navigator.onLine) return;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items: Company[] = (data.items || []).filter((c: Company) => c.active !== false);
    setCompanies(items);
    setFromCache(false);
    await saveCompaniesCache(items);
  };

  return { companies, loading, offline, fromCache, refresh };
}
