import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SignaturePad, { Stroke, SigMeta } from "../components/SignaturePad";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

type Summary = {
  isPrivate?: boolean;
  company?: string;
  project?: string;
  privateClientName?: string;
  manager?: string;
  teamLead?: string;
  helper1?: string;
  helper2?: string;
  date?: string;
  dayType?: "full" | "half";
  workDesc?: string;
  notes?: string;
};

export default function ManagerSignPage() {
  const { surveyId = "", token = "" } = useParams<{ surveyId: string; token: string }>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<"pending" | "signed" | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "expired">("loading");

  const [sig, setSig] = useState<Stroke[]>([]);
  const [sigMeta, setSigMeta] = useState<SigMeta>({ w: 600, h: 120 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/public/surveys/${encodeURIComponent(surveyId)}/pending-signatures/${encodeURIComponent(token)}`
        );
        if (res.status === 404) return setLoadState("not-found");
        if (res.status === 410) return setLoadState("expired");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSummary(data.summary);
        setStatus(data.status);
        setLoadState("ready");
      } catch (e) {
        console.error(e);
        setLoadState("not-found");
      }
    })();
  }, [surveyId, token]);

  const submit = async () => {
    if (sig.length === 0) {
      setErr("יש לחתום לפני האישור");
      return;
    }
    setErr("");
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/public/surveys/${encodeURIComponent(surveyId)}/pending-signatures/${encodeURIComponent(token)}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sigManager: sig, sigMeta }),
        }
      );
      if (res.status === 409) {
        setSubmitted(true); // already signed by someone else — treat as done
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setErr("שגיאה בשליחת החתימה, נסה/י שוב");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm" dir="rtl">
        טוען...
      </div>
    );
  }

  if (loadState === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <div className="text-lg font-semibold mb-1">הקישור לא נמצא</div>
          <div className="text-sm text-neutral-500">ייתכן שהוא כבר שימש או שאינו תקין.</div>
        </div>
      </div>
    );
  }

  if (loadState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <div className="text-lg font-semibold mb-1">הקישור פג תוקף</div>
          <div className="text-sm text-neutral-500">יש לבקש מהעובד לשלוח קישור חדש.</div>
        </div>
      </div>
    );
  }

  if (submitted || status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <div className="text-lg font-semibold mb-1">החתימה נשלחה בהצלחה ✓</div>
          <div className="text-sm text-neutral-500">אפשר לסגור את הדף — העובד יראה זאת באפליקציה.</div>
        </div>
      </div>
    );
  }

  const s = summary || {};
  const row = (label: string, value?: string) =>
    value ? (
      <div className="flex justify-between gap-3 py-1.5 border-b last:border-0 text-sm">
        <span className="text-neutral-500">{label}</span>
        <span className="text-black/80 font-medium text-left">{value}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-6" dir="rtl">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-xl font-bold text-black mb-1">חתימת מנהל עבודה</h1>
        <p className="text-sm text-neutral-500 mb-4">אנא בדקו את הפרטים וחתמו למטה</p>

        <div className="rounded-2xl border bg-white p-4 mb-4">
          {s.isPrivate ? (
            row("שירות פרטי", s.privateClientName)
          ) : (
            <>
              {row("חברה", s.company)}
              {row("פרויקט", s.project)}
            </>
          )}
          {row("מנהל עבודה", s.manager)}
          {row("ראש צוות", s.teamLead)}
          {row("עוזר", s.helper1)}
          {row("עוזר", s.helper2)}
          {row("תאריך", s.date ? new Date(s.date).toLocaleDateString("he-IL") : undefined)}
          {row("סוג יום", s.dayType === "half" ? "חצי יום" : "יום מלא")}
          {row("תיאור עבודה", s.workDesc)}
          {row("הערות", s.notes)}
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2">חתימה</div>
          <SignaturePad strokes={sig} setStrokes={setSig} setMeta={setSigMeta} height={160} />
          <div className="h-0 -mt-[1px] border-t border-black/80" />
          {err && <div className="text-xs text-red-600 mt-2">{err}</div>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full h-12 rounded-xl bg-black text-white text-base disabled:opacity-50"
          >
            {submitting ? "שולח..." : "אישור חתימה"}
          </button>
        </div>
      </div>
    </div>
  );
}