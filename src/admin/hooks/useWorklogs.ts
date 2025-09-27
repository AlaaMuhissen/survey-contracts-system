import { useCallback, useMemo, useState } from "react";
import { listWorklogs, getFileUrl } from "../api/adminApi";
import { Filters, WorkLog } from "../types";
import { tsToMs } from "../../utils/time";

export function useWorklogs(headers: Record<string,string>) {
  const [items, setItems] = useState<WorkLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ day: "all", hasFile: "all" });

  const fetchPage = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    try {
      const data = await listWorklogs(headers, {
        limit: 25,
        cursor: cursor ?? null,
        q: filters.q?.trim() || undefined,
      });
      if (!cursor) setItems(data.items);
      else setItems((s) => [...s, ...data.items]);
      setNextCursor(data.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }, [headers, filters.q]);

  const regenUrl = useCallback(async (w: WorkLog) => {
    if (!w.storageKey) return;
    const { url } = await getFileUrl(headers, w.storageKey, 3600);
    if (url) window.open(url, "_blank");
  }, [headers]);

  // derive company & project options
  const companyOptions = useMemo(() => {
    const set = new Set(items.map(w => (w.company || "").trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
  }, [items]);

  const projectOptions = useMemo(() => {
    const source = filters.company ? items.filter(w => (w.company || "") === filters.company) : items;
    const set = new Set(source.map(w => (w.project || "").trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
  }, [items, filters.company]);

  const filtered = useMemo(() => {
    const fromMs = filters.from ? new Date(filters.from + "T00:00:00").getTime() : null;
    const toMs   = filters.to   ? new Date(filters.to   + "T23:59:59").getTime() : null;
    const numQ   = (filters.number || "").trim();
    const teamQ  = (filters.teamLead || "").trim().toLowerCase();

    return items.filter((w) => {
      if (numQ && !w.number.includes(numQ)) return false;
      if (filters.company && (w.company || "") !== filters.company) return false;
      if (filters.project && (w.project || "") !== filters.project) return false;

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
  }, [items, filters]);

  return {
    items, filtered, nextCursor, loading,
    filters, setFilters,
    companyOptions, projectOptions,
    fetchPage, regenUrl,
  };
}
