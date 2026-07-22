import { useEffect, useState } from "react";
import {
  PrivateClient,
  loadPrivateClientsCache,
  savePrivateClientsCache,
} from "./privateClientsStore";
import { useParams } from "react-router-dom";

// NOTE: this hits `${apiBase}/public/surveys/:surveyId/private-clients`, which
// does not exist on the backend yet (placeholder approach, per plan — backend
// route to be added later). Until then this will just fail the fetch and fall
// back to cache/empty list; the UI still lets the worker type a free-text name.
export function usePrivateClients(apiBase?: string, headers?: HeadersInit) {
  const [privateClients, setPrivateClients] = useState<PrivateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const surveyId = useParams().surveyId;
  const url = `${apiBase}/public/surveys/${surveyId}/private-clients`;

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
      const cached = await loadPrivateClientsCache();
      if (!cancelled && cached) {
        setPrivateClients(cached);
        setFromCache(true);
        setLoading(false);
      }

      // 2️⃣ if online — fetch from API with auth header
      if (navigator.onLine) {
        try {
          const res = await fetch(url, { headers, cache: "no-store" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          const items: PrivateClient[] = (data.privateClients || []).filter(
            (c: PrivateClient) => c.active !== false
          );
          if (!cancelled) {
            setPrivateClients(items);
            setFromCache(false);
            setLoading(false);
          }
          await savePrivateClientsCache(items);
        } catch (e) {
          if (!cancelled) setLoading(false);
          console.warn("Fetch private clients failed, using cache if any:", e);
        }
      } else {
        if (!cached && !cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const refresh = async () => {
    if (!navigator.onLine) return;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const items: PrivateClient[] = (data.privateClients || []).filter(
      (c: PrivateClient) => c.active !== false
    );
    setPrivateClients(items);
    setFromCache(false);
    await savePrivateClientsCache(items);
  };

  return { privateClients, loading, offline, fromCache, refresh };
}
