import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { sendPdfViaWhatsAppNoBackend, sendPdfViaEmailNoBackend } from "../utils/shareNoBackend";
import { buildWorkLogWhatsAppMessage, buildWorkLogEmailSubject, buildWorkLogSummary } from "../utils/worklogsummary";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

type WorkLogItem = {
  id: string;
  number: string;
  date?: string;
  isPrivate?: boolean;
  company?: string;
  project?: string;
  privateClientName?: string;
  teamLead?: string;
  dayType?: "full" | "half";
  workDesc?: string;
  fileUrl?: string;
  hasManagerSignature?: boolean;
  hasTeamLeadSignature?: boolean;
  createdAt?: any;
};

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M5 21h14" />
    </svg>
  );
}
function IconPrinter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" />
      <path d="M4 9h16a2 2 0 0 1 2 2v5h-4M2 16v-5a2 2 0 0 1 2-2" />
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1 3.6a8.5 8.5 0 0 1 1 4.9z" />
      <path d="M8.5 10.5c.3 2 2.2 3.9 4.2 4.2" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
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
function IconWarn() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}
function IconFolderEmpty() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-neutral-300">
      <path d="M3 7l3-3h5l2 2h8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function StatusBadge({ ok, okLabel, badLabel }: { ok?: boolean; okLabel: string; badLabel: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 font-medium ${
      ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
    }`}>
      {ok ? <IconCheck /> : <IconWarn />}
      {ok ? okLabel : badLabel}
    </span>
  );
}

export default function MyWorklogsPage() {
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const nav = useNavigate();
  const [items, setItems] = useState<WorkLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<WorkLogItem | null>(null);

  const token = localStorage.getItem("workerToken") || "";

  useEffect(() => {
    if (!token) { nav("/"); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workLogs/mine`, {
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  const fetchPdfBlob = async (item: WorkLogItem): Promise<Blob | null> => {
    if (!item.fileUrl) {
      alert("אין קובץ PDF זמין ליומן זה");
      return null;
    }
    const res = await fetch(item.fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  };

  const withBusy = async (item: WorkLogItem, fn: () => Promise<void>) => {
    setBusyId(item.id);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      alert("שגיאה בפעולה, נסה/י שוב");
    } finally {
      setBusyId(null);
    }
  };

  const download = (item: WorkLogItem) => withBusy(item, async () => {
    const blob = await fetchPdfBlob(item);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-log-${item.number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  const openToPrint = (item: WorkLogItem) => {
    if (!item.fileUrl) return alert("אין קובץ PDF זמין ליומן זה");
    window.open(item.fileUrl, "_blank");
  };

  const shareWhatsApp = (item: WorkLogItem) => withBusy(item, async () => {
    const blob = await fetchPdfBlob(item);
    if (!blob) return;
    await sendPdfViaWhatsAppNoBackend(blob, `work-log-${item.number}.pdf`, {
      messagePrefix: buildWorkLogWhatsAppMessage(item, item.number),
    });
  });

  const shareEmail = (item: WorkLogItem) => withBusy(item, async () => {
    const blob = await fetchPdfBlob(item);
    if (!blob) return;
    await sendPdfViaEmailNoBackend(blob, `work-log-${item.number}.pdf`, {
      subject: buildWorkLogEmailSubject(item, item.number),
      bodyPrefix: `שלום,\nמצורף קובץ יומן העבודה. הפרטים:\n\n${buildWorkLogSummary(item, item.number)}`,
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="mx-auto max-w-md px-4 pb-10">

        {/* Header */}
        <div className="pt-6 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">היומנים שלי</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {loading ? "טוען..." : `${items.length} יומני עבודה`}
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
            <span className="text-sm text-neutral-500">טוען יומנים...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white/60 py-14 flex flex-col items-center gap-2 text-center">
            <IconFolderEmpty />
            <span className="text-sm text-neutral-500">עדיין לא נשלחו יומנים</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => {
              const label = item.isPrivate ? item.privateClientName : (item.project || item.company);
              const busy = busyId === item.id;
              return (
                <div key={item.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <div className="font-semibold text-black/85 truncate">{label || "—"}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          מס' {item.number}
                          {item.date ? ` · ${new Date(item.date).toLocaleDateString("he-IL")}` : ""}
                          {item.dayType === "half" ? " · חצי יום" : " · יום מלא"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <StatusBadge ok={item.hasManagerSignature} okLabel="חתימת מנהל ✓" badLabel="ללא חתימת מנהל" />
                      <StatusBadge ok={item.hasTeamLeadSignature} okLabel="חתימת ראש צוות ✓" badLabel="ללא חתימת ראש צוות" />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl bg-black text-white text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-black/85 disabled:opacity-50 transition"
                        onClick={() => setViewingItem(item)}
                      >
                        <IconEye /> צפייה
                      </button>
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl border text-xs inline-flex items-center justify-center gap-1 hover:bg-neutral-50 disabled:opacity-50 transition"
                        onClick={() => download(item)}
                      >
                        <IconDownload /> הורד
                      </button>
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl border text-xs inline-flex items-center justify-center gap-1 hover:bg-neutral-50 disabled:opacity-50 transition"
                        onClick={() => openToPrint(item)}
                      >
                        <IconPrinter /> הדפס
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl border text-xs inline-flex items-center justify-center gap-1 hover:bg-neutral-50 disabled:opacity-50 transition"
                        onClick={() => shareWhatsApp(item)}
                      >
                        <IconWhatsApp /> וואטסאפ
                      </button>
                      <button
                        disabled={busy}
                        className="h-9 rounded-xl border text-xs inline-flex items-center justify-center gap-1 hover:bg-neutral-50 disabled:opacity-50 transition"
                        onClick={() => shareEmail(item)}
                      >
                        <IconMail /> מייל
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewingItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/85" dir="rtl">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
            <div className="text-sm font-medium text-black/80 truncate">
              מס' {viewingItem.number} · {viewingItem.isPrivate ? viewingItem.privateClientName : (viewingItem.project || viewingItem.company)}
            </div>
            <button
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 text-lg leading-none"
              onClick={() => setViewingItem(null)}
              aria-label="סגור"
            >
              ×
            </button>
          </div>
          {viewingItem.fileUrl ? (
            <iframe
              src={viewingItem.fileUrl}
              title="תצוגת יומן עבודה"
              className="flex-1 w-full bg-white"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-white text-sm">
              אין קובץ PDF זמין ליומן זה
            </div>
          )}
        </div>
      )}
    </div>
  );
}