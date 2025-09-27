import React, { useEffect, useState ,useCallback} from "react";

const API = "http://localhost:8080";

export default function AdminKeySettings() {
  const [currentKey, setCurrentKey] = useState(localStorage.getItem("adminKey") || "");
  const [customKey, setCustomKey] = useState("");
  const [meta, setMeta] = useState<{ hasActive: boolean; hasPrevious: boolean; graceUntilMs: number | null; rotatedAtMs: number | null } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [graceHours, setGraceHours] = useState(1); 
  const [token] = useState<string | null>(localStorage.getItem("adminToken"));
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const headers = { "x-admin-key": currentKey, "Content-Type": "application/json" };

    const loadMeta = useCallback(async () => {
    if (!currentKey) return;
    const res = await fetch(`${API}/admin/key/meta`, { headers });
    const data = await res.json();
    if (res.ok) setMeta(data);
    else alert(data?.error || "שגיאה");
  }, [currentKey]); // headers depends only on currentKey here

 useEffect(() => {
    const ac = new AbortController();
    loadMeta().catch(() => {});
    return () => ac.abort();
  }, [loadMeta]);

  const saveKeyLocal = (k: string) => {
    localStorage.setItem("adminKey", k);
    setCurrentKey(k);
  };
  const fetchPage = useCallback(async (cursor?: string | null) => {
    const params = new URLSearchParams({ limit: "25" });
    if (cursor) params.set("cursor", cursor);
    if (q.trim()) params.set("q", q.trim());

    const res = await fetch(`${API}/admin/worklogs?${params}`, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : { "x-admin-key": localStorage.getItem("adminKey") || "" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!cursor) setItems(data.items);
    else setItems((s) => [...s, ...data.items]);
    setNextCursor(data.nextCursor ?? null);
  }, [q, token]); // deps

  // ✅ include fetchPage in deps
  useEffect(() => {
    const ac = new AbortController();
    if (token || localStorage.getItem("adminKey")) {
      fetchPage(null).catch(() => {});
    }
    return () => ac.abort();
  }, [fetchPage, token]);

  
  const rotate = async () => {
   // if (!currentKey) return alert("נא להזין את המפתח הנוכחי");
    if (!window.confirm("ליצור/לקבוע מפתח חדש? הישן יעבוד עוד כשעת חסד (או לפי בחירה).")) return;

    const body = {
      confirmKey: currentKey,
      newKey: customKey || undefined,
      graceHours, // 1 by default — same-hour change
    };
    const res = await fetch(`${API}/admin/key/rotate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "שגיאה");

    setNewKey(data.key);
    localStorage.setItem("adminKey", data.key);
    setCurrentKey(data.key);
    setCustomKey("");
    loadMeta().catch(() => {});
  };

  return (
    <div className="p-4 border rounded-2xl space-y-3" dir="rtl">
      <h2 className="text-lg font-semibold">הגדרות מפתח מנהל</h2>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="מפתח נוכחי"
          value={currentKey}
          onChange={(e) => saveKeyLocal(e.target.value)}
        />
        <button className="border rounded px-3 py-2" onClick={loadMeta}>בדוק</button>
      </div>

      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="מפתח חדש (אופציונלי: 16+ תווים או 4+ מילים)"
        value={customKey}
        onChange={(e) => setCustomKey(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm">שעות חסד:</label>
        <input
          type="number"
          min={0}
          max={72}
          value={graceHours}
          onChange={(e) => setGraceHours(Math.max(0, Math.min(72, Number(e.target.value) || 0)))}
          className="border rounded px-2 py-1 w-20"
        />
        <span className="text-sm text-neutral-600">(ברירת מחדל: 1)</span>
      </div>

      <button className="rounded-xl border px-3 py-2 hover:bg-neutral-50" onClick={rotate}>
        צור / קבע מפתח חדש
      </button>

      {meta && (
        <div className="text-sm text-neutral-700">
          סטטוס: {meta.hasActive ? "קיים" : "לא הוגדר"}
          {meta.hasPrevious ? " (בתקופת חסד קיים מפתח קודם)" : ""}
          <br />
          תקופת חסד עד:{" "}
          {meta.graceUntilMs ? new Date(meta.graceUntilMs).toLocaleString("he-IL") : "אין"}
        </div>
      )}

      {newKey && (
        <div className="mt-3 p-3 bg-neutral-50 border rounded-xl">
          <div className="text-sm mb-2">מפתח חדש (מוצג פעם אחת):</div>
          <div className="flex items-center gap-3">
            <code className="px-2 py-1 bg-white border rounded">{newKey}</code>
            <button className="border rounded px-2 py-1" onClick={() => navigator.clipboard.writeText(newKey)}>
              העתק
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
