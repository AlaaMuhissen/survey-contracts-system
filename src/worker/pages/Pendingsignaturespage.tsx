import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildManagerSignLink, openWhatsAppWithLink } from "../workLog/sendForManagerSignature";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

type Item = {
  id: string;
  status: "pending" | "signed";
  formSnapshot: any;
  sigManager: any[] | null;
  sigLead: any[];
  sigMeta: any;
  createdAt?: any;
};

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 5l-7 7 7 7" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
    </svg>
  );
}
function IconInboxEmpty() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-neutral-300">
      <path d="M4 12l3-8h10l3 8" /><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M4 12h4l1.5 3h5L16 12h4" />
    </svg>
  );
}

export default function PendingSignaturesPage() {
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const nav = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const token = localStorage.getItem("workerToken") || "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/pending-signatures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { nav("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  const applySignedItem = (item: Item) => {
    localStorage.setItem(
      "restoreSignedWorklog",
      JSON.stringify({
        token: item.id,
        formSnapshot: item.formSnapshot,
        sigManager: item.sigManager,
        sigLead: item.sigLead,
        sigMeta: item.sigMeta,
      })
    );
    nav(`/${encodeURIComponent(surveyId)}`);
  };

  const reshare = (item: Item) => {
    const link = buildManagerSignLink(surveyId, item.id);
    openWhatsAppWithLink(
      link,
      item.status === "signed" ? "יומן העבודה שנחתם:" : "יומן עבודה ממתין לחתימתך:"
    );
  };

  const discard = async (item: Item) => {
    if (!window.confirm("למחוק את הבקשה?")) return;
    setBusyId(item.id);
    try {
      await fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/pending-signatures/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((s) => s.filter((i) => i.id !== item.id));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="mx-auto max-w-md px-4 pb-10">

        <div className="pt-6 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">בקשות חתימה</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {loading ? "טוען..." : `${items.length} בקשות`}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 text-sm text-black/70 hover:bg-neutral-50 shadow-sm"
            onClick={() => nav(`/${encodeURIComponent(surveyId)}`)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            חזרה
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-sm text-neutral-500">טוען בקשות...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white/60 py-14 flex flex-col items-center gap-2 text-center">
            <IconInboxEmpty />
            <span className="text-sm text-neutral-500">אין בקשות חתימה כרגע</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => {
              const f = item.formSnapshot || {};
              const label = f.isPrivate ? f.privateClientName : (f.project || f.company);
              const signed = item.status === "signed";
              const busy = busyId === item.id;
              return (
                <div key={item.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-black/85 truncate">{label || "—"}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {f.date ? new Date(f.date).toLocaleDateString("he-IL") : ""}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 font-medium ${
                      signed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {signed ? <IconCheck /> : <IconClock />}
                      {signed ? "נחתם" : "ממתין לחתימה"}
                    </span>
                  </div>

                  <div className={`grid gap-1.5 ${signed ? "grid-cols-3" : "grid-cols-2"}`}>
                    {signed && (
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl bg-black text-white text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-black/85 disabled:opacity-50 transition"
                        onClick={() => applySignedItem(item)}
                      >
                        <IconArrowLeft /> המשך למילוי
                      </button>
                    )}
                    <button
                      disabled={busy}
                      className="h-9 rounded-xl border text-xs inline-flex items-center justify-center gap-1 hover:bg-neutral-50 disabled:opacity-50 transition"
                      onClick={() => reshare(item)}
                    >
                      <IconShare /> שתף שוב
                    </button>
                    <button
                      disabled={busy}
                      className="h-9 rounded-xl border text-xs text-red-600 inline-flex items-center justify-center gap-1 hover:bg-red-50 disabled:opacity-50 transition"
                      onClick={() => discard(item)}
                    >
                      <IconTrash /> מחק
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}