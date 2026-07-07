import React, { useEffect ,useRef ,useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Toolbar from "../components/Toolbar";
import WorklogTable from "../components/WorklogTable";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useWorklogs } from "../hooks/useWorklogs";
import StatsRow from "../components/StatsRow";
import { Building2 } from "lucide-react";



export default function AdminPage() {
  const navigate = useNavigate();
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  
  const {
    setAdminKey, authed, setAuthed, checking, headers,
  } = useAdminAuth(localStorage.getItem("adminToken") || "");

  const {
    items, filtered, nextCursor, loading,
    filters, setFilters, companyOptions, projectOptions,
    fetchPage, regenUrl,
  } = useWorklogs(headers ,surveyId);

const [moreOpen, setMoreOpen] = useState(false);
const moreBtnRef = useRef<HTMLButtonElement | null>(null);
const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

// helper: position the menu just under the button, RTL-safe
const positionMenu = () => {
  const btn = moreBtnRef.current;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const GAP = 8;           // space between button and menu
  const WIDTH = 192;       // menu width (w-48 = 12rem = 192px)
  // Anchor by RIGHT edge (RTL-friendly)
  let right = Math.max(8, window.innerWidth - rect.right); // keep 8px from viewport
  // Ensure menu stays in viewport (avoid left overflow)
  right = Math.min(right, window.innerWidth - WIDTH - 8);
  const top = Math.min(window.innerHeight - 8 - 10, rect.bottom + GAP); // keep 8px bottom margin
  setMenuPos({ top, right });
};

useEffect(() => {
  if (!moreOpen) return;
  positionMenu();
  const onDoc = (e: MouseEvent) => {
    if (!moreBtnRef.current) return;
    if (!(e.target instanceof Node)) return;
    // Close if click outside both button and menu
    const menuEl = document.getElementById("mobile-more-menu");
    if (!menuEl) return;
    if (!menuEl.contains(e.target) && !moreBtnRef.current.contains(e.target)) {
      setMoreOpen(false);
    }
  };
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
  const onScroll = () => positionMenu();
  const onResize = () => positionMenu();

  document.addEventListener("click", onDoc);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  return () => {
    document.removeEventListener("click", onDoc);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
  };
}, [moreOpen]);

  const total = filtered.length;
  const fullDays = filtered.filter(w => (w.dayType || "full") === "full").length;
  const halfDays = total - fullDays;
  const monthLabel = new Date().toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const companyCount = (() => {
  const s = new Set(filtered.map(w => (w.company || "").trim()).filter(Boolean));
  return s.size;
})();
  // load first page once authed (and when server-side q changes via toolbar search)
  useEffect(() => {
    if(!authed)
      console.log("Not authed yet, skipping fetchPage");
    if (authed) {
      fetchPage(null).catch((e) => console.error("fetchPage failed:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);
  
useEffect(() => {
  if (checking) return; 
  if (!authed || !surveyId) navigate(`/`);
  (async () => {
    try {
      await fetchPage(null);
    } catch (e: any) {
      if (e?.code === 401) {
        // clear token + show login
        localStorage.removeItem("adminToken");
        setAuthed(false);
        return;
      }
      console.error("fetchPage failed:", e);
    }
  })();
}, [authed, surveyId, fetchPage, setAuthed , checking, navigate]);
  

 
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white " dir="rtl">
      <div className="mx-auto max-w-6xl p-4" dir="rtl">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">לוח מנהל</h1>
            <p className="text-sm text-neutral-600">צפייה, סינון והורדת דוחות</p>
          </div>

          <div className=" md:hidden flex items-center justify-end gap-2">
            {/* Catalog */}
            <button
              type="button"
              onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/catalog`)}
              title="ניהול קטלוג"
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border
                        bg-white/80 backdrop-blur shadow-sm
                        hover:bg-black/80 hover:border-indigo-300 transition
                        focus:outline-none focus:ring-2 focus:ring-indigo-300/60 text-black hover:text-white"
              aria-label="ניהול קטלוג"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </button>

            {/* Reports */}
            <button
              type="button"
              onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/reports`)}
              title="דוחות"
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border
                        bg-white/80 backdrop-blur shadow-sm
                        hover:bg-black/80 hover:border-indigo-300 transition
                        focus:outline-none focus:ring-2 focus:ring-indigo-300/60 text-black hover:text-white"
              aria-label="דוחות"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 3v18h18"/><path d="M7 15v-4M12 17V7M17 17v-8"/>
              </svg>
            </button>

            {/* More menu (fixed, RTL-aware, won't navigate away) */}
            <button
              ref={moreBtnRef}
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border
                        bg-white/80 backdrop-blur shadow-sm
                        hover:bg-black/80 hover:border-indigo-300 transition
                        focus:outline-none focus:ring-2 focus:ring-indigo-300/60 text-black hover:text-white "
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label="עוד פעולות"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>

            {/* Render the floating menu using fixed coordinates so it can't be clipped */}
            {moreOpen && (
              <div
                id="mobile-more-menu"
                role="menu"
                style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
                className="w-48 rounded-2xl border bg-white/95  shadow-xl z-[1000]
                          ring-1 ring-black/5 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => { navigate(`/admin/${encodeURIComponent(surveyId)}/workers`); setMoreOpen(false); }}
                  className="w-full text-right px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  role="menuitem"
                >
                  העבודים שלי
                </button>
                <button
                  type="button"
                  className="w-full text-right px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/profile`)}
                  title="הגדרות חברה"
                  aria-label="הגדרות חברה"
                >
                  הגדרות חברה
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("adminToken");
                    setAdminKey("");
                    setAuthed(false);
                    setMoreOpen(false);
                  }}
                  className="w-full text-right px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-neutral-800/80 text-red-600"
                  role="menuitem"
                >
                  יציאה
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP actions (labels + icons) */}
<div className="hidden md:flex items-center gap-2">
  <button
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
                bg-white backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white"
      onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/catalog`)}
      title="ניהול קטלוג"
    >
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-30" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
    ניהול קטלוג
  </button>

  <button
    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
               bg-white  backdrop-blur shadow-sm transition
               focus:outline-none focus:ring-2 focus:ring-indigo-300/60
               text-black/80 hover:bg-black/80 hover:text-white"
    onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/reports`)}
    title="דוחות"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3v18h18"/>
      <path d="M7 15v-4M12 17V7M17 17v-8"/>
    </svg>
    דוחות
  </button>

  <span className="mx-1 text-black/80">•</span>

  <button
    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
              bg-white  text-black/80 hover:bg-black/80 
               hover:text-white transition
               focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
    onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/workers`)}
    title="העבודים שלי"
  >
      <svg width="16" height="16" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round"
        className="opacity-70">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>

    העבודים שלי
  </button>

  <button
  type="button"
  className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
             bg-white backdrop-blur shadow-sm transition
             focus:outline-none focus:ring-2 focus:ring-indigo-300/60
             text-black/80 hover:bg-black/80 hover:text-white"
  onClick={() => navigate(`/admin/${encodeURIComponent(surveyId)}/profile`)}
  title="הגדרות חברה"
  aria-label="הגדרות חברה"
>
  <Building2 className="h-4 w-4 opacity-70" aria-hidden />
  <span>הגדרות חברה</span>
</button>

  <button
    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
               bg-white  text-black/80 hover:bg-black/80 
               hover:text-white transition
               focus:outline-none focus:ring-2 focus:ring-red-300/50"
    onClick={() => {
      localStorage.removeItem("adminToken");
      setAdminKey(""); setAuthed(false);
    }}
    title="יציאה"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/><path d="M16 3h2a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-2"/>
    </svg>
    יציאה
  </button>
</div>


        </div>
        <StatsRow total={total} fullDays={fullDays} halfDays={halfDays} monthLabel={monthLabel} companyCount={companyCount} />
        <Toolbar
          filters={filters}
          setFilters={setFilters}
          onServerSearch={() => fetchPage(null).catch((e) => console.error("Server search failed:", e))}
          counts={{ shown: filtered.length, total: items.length }}
          companyOptions={companyOptions}
          projectOptions={projectOptions}
        />
        {/* <QuickChips filters={filters} setFilters={setFilters} />
        {loading && <div className="mb-2 text-xs text-neutral-500 animate-pulse">טוען נתונים...</div>} */}
      
        <WorklogTable items={filtered} onCreateUrl={regenUrl} />

      {nextCursor && (
          <div className="mt-3 md:static fixed left-0 right-0 bottom-3 mx-auto flex justify-center z-30">
            <button
              className="rounded-full border px-4 py-2 bg-white/90 backdrop-blur hover:bg-indigo-50 shadow-sm disabled:opacity-50"
              onClick={() => fetchPage(nextCursor)}
              disabled={loading}
            >
              {loading ? "טוען..." : "טען עוד"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
