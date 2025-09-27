// // src/admin/AdminPage.tsx
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// const API =
//   (import.meta as any).env?.VITE_BACKEND_URL ||
//   "http://localhost:8080";

// type FirestoreTimestampJSON = { _seconds: number; _nanoseconds: number };

// type WorkLog = {
//   id: string;
//   number: string; 
//   company?: string;
//   project?: string;
//   manager?: string;
//   teamLead?: string;
//   dayType?: "full" | "half";
//   createdAt?: FirestoreTimestampJSON;
//   fileName?: string;
//   fileUrl?: string;
//   storageKey?: string;
// };

// function tsToMs(ts?: FirestoreTimestampJSON) {
//   return ts?._seconds ? ts._seconds * 1000 : null;
// }

// export default function AdminPage() {
//   // --- auth state (admin key lock screen) ---
//   const [adminKey, setAdminKey] = useState<string>(localStorage.getItem("adminKey") || "");
//   const [authed, setAuthed] = useState<boolean>(false);
//   const [checking, setChecking] = useState<boolean>(!!adminKey);
//   const [loginError, setLoginError] = useState<string>("");

//   // --- data + server-side search by number (optional) ---
//   const [items, setItems] = useState<WorkLog[]>([]);
//   const [nextCursor, setNextCursor] = useState<string | null>(null);
//   const [q, setQ] = useState(""); // server search by number (optional)

//   // --- client-side filters ---
//   const [fNumber, setFNumber] = useState("");        // מספר
//   const [fCompany, setFCompany] = useState("");      // חברה
//   const [fTeamLeader, setFTeamLeader] = useState(""); // ראש צוות
//   const [fProject, setFProject] = useState("");      // פרויקט
//   const [fDay, setFDay] = useState<"all" | "full" | "half">("all"); // סוג יום
//   const [fFrom, setFFrom] = useState("");            // YYYY-MM-DD
//   const [fTo, setFTo] = useState("");                // YYYY-MM-DD
//   const [fHasFile, setFHasFile] = useState<"all" | "yes" | "no">("all");
//   const navigate = useNavigate();
//   const headers = useMemo(
//     () => ({ "x-admin-key": adminKey.trim(), "Content-Type": "application/json" }),
//     [adminKey]
//   );

//   // --- verify key with /admin/key/meta ---
//   const verifyKey = useCallback(async () => {
//     const key = adminKey.trim();
//     if (!key) return false;
//     setChecking(true);
//     setLoginError("");
//     try {
//       const res = await fetch(`${API}/admin/key/meta`, { headers: { "x-admin-key": key } });
//       if (!res.ok) throw new Error("unauthorized");
//       localStorage.setItem("adminKey", key);
//       setAuthed(true);
//       return true;
//     } catch {
//       setAuthed(false);
//       setLoginError("מפתח לא תקין. נסה שוב.");
//       return false;
//     } finally {
//       setChecking(false);
//     }
//   }, [API, adminKey]);

//   // try stored key on mount
//   useEffect(() => {
//     if (!adminKey) return;
//     verifyKey();
//   }, [verifyKey]);

//   // --- fetch page from server (unchanged) ---
//   const fetchPage = useCallback(
//     async (cursor?: string | null) => {
//       const params = new URLSearchParams();
//       params.set("limit", "25");
//       if (cursor) params.set("cursor", cursor);
//       if (q.trim()) params.set("q", q.trim()); // optional server search by number

//       const res = await fetch(`${API}/admin/worklogs?${params.toString()}`, {
//         headers,
//       });
//       if (!res.ok) throw new Error("HTTP " + res.status);
//       const data = await res.json();
//       if (!cursor) setItems(data.items);
//       else setItems((s: WorkLog[]) => [...s, ...data.items]);
//       setNextCursor(data.nextCursor ?? null);
//     },
//     [API, headers, q]
//   );

//   // load first page once authed (and on q change)
//   useEffect(() => {
//     if (!authed) return;
//     fetchPage(null).catch(() => {});
//   }, [authed, fetchPage]);

//   // --- regenerate 1h URL for private files ---
//   const regenUrl = useCallback(
//     async (w: WorkLog) => {
//       if (!w.storageKey) return;
//       const res = await fetch(`${API}/admin/file-url`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({ storageKey: w.storageKey, expiresSeconds: 3600 }),
//       });
//       const data = await res.json();
//       if (data.url) window.open(data.url, "_blank");
//     },
//     [API, headers]
//   );
//   // unique companies from the loaded worklogs
// const companyOptions = useMemo(() => {
//   const set = new Set(
//     items.map(w => (w.company || "").trim()).filter(Boolean)
//   );
//   return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
// }, [items]);

// // unique projects, filtered by selected company (if any)
// const projectOptions = useMemo(() => {
//   const source = fCompany
//     ? items.filter(w => (w.company || "") === fCompany)
//     : items;

//   const set = new Set(
//     source.map(w => (w.project || "").trim()).filter(Boolean)
//   );
//   return Array.from(set).sort((a,b) => a.localeCompare(b, "he"));
// }, [items, fCompany]);

  
//   // --- client-side filtering (fast & simple) ---
//   const filtered = useMemo(() => {
//     const fromMs = fFrom ? new Date(fFrom + "T00:00:00").getTime() : null;
//     const toMs = fTo ? new Date(fTo + "T23:59:59").getTime() : null;
//     const numQ = fNumber.trim();
//     const compQ = fCompany.trim().toLowerCase();
//     const projQ = fProject.trim().toLowerCase();

//     return items.filter((w) => {
//       // number
//       if (numQ && !w.number.includes(numQ)) return false;

//       // company/project

//     if (fCompany && (w.company || "") !== fCompany) return false;
//     if (fProject && (w.project || "") !== fProject) return false;


//       // day type
//       if (fDay !== "all" && (w.dayType || "full") !== fDay) return false;

//       // has file
//       const hasFile = Boolean(w.fileUrl || w.storageKey);
//       if (fHasFile === "yes" && !hasFile) return false;
//       if (fHasFile === "no" && hasFile) return false;

//       // date range
//       const ms = tsToMs(w.createdAt);
//       if (fromMs && (ms ?? 0) < fromMs) return false;
//       if (toMs && (ms ?? 0) > toMs) return false;

//       return true;
//     });
//   }, [items, fNumber, fCompany, fProject, fDay, fFrom, fTo, fHasFile]);

//   // --- Lock screen UI ---
//   if (!authed) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4" dir="rtl">
//         <div className="w-full max-w-sm bg-white border rounded-2xl p-5 shadow-sm">
//           <h1 className="text-xl font-bold mb-3 text-right">כניסת מנהל</h1>
//           <label className="block text-sm mb-1 text-right">מפתח מנהל (x-admin-key)</label>
//           <input
//             className="w-full border rounded px-3 py-2 mb-3 text-right"
//             placeholder="הדבק את המפתח כאן"
//             value={adminKey}
//             onChange={(e) => setAdminKey(e.target.value)}
//             onKeyDown={async (e) => {
//               if (e.key === "Enter" && adminKey && !checking) {
//                 await verifyKey();
//               }
//             }}
//             autoFocus
//           />
//           {loginError && <div className="text-red-600 text-sm mb-3 text-right">{loginError}</div>}
//           <button
//             className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
//             onClick={verifyKey}
//             disabled={!adminKey || checking}
//           >
//             {checking ? "בודק..." : "כניסה"}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // --- Admin table with filters ---
//   return (
//     <div className="mx-auto max-w-6xl p-4" dir="rtl">
//       <div className="mb-4 flex items-center justify-between">
//         <h1 className="text-2xl font-bold">לוח מנהל</h1>
//         <div className="flex gap-3">
//           <button
//             className="text-sm underline"
//             onClick={() => {
//               setAuthed(false);
//               setLoginError("");
//             }}
//           >
//             החלף מפתח
//           </button>
//           <button
//             className="text-sm underline"
//             onClick={() => {
//               localStorage.removeItem("adminKey");
//               setAdminKey("");
//               setAuthed(false);
//               setItems([]);
//               setNextCursor(null);
//             }}
//           >
//             יציאה
//           </button>
//           <button className="underline text-sm" onClick={() => navigate("/admin/catalog")}>ניהול קטלוג</button>
//           <button className="underline text-sm" onClick={() => navigate("/admin/reports")}>דוחות</button>
//         </div>
//       </div>



//       {/* Client-side filters */}
//       <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
//         <div>
//           <label className="block text-xs mb-1">מספר</label>
//           <input className="border rounded px-3 py-2 w-full" value={fNumber} onChange={(e) => setFNumber(e.target.value)} />
//         </div>
// <div>
//   <label className="block text-xs mb-1">חברה</label>
//   <select
//     className="border rounded px-3 py-2 w-full"
//     value={fCompany}
//     onChange={(e) => {
//       setFCompany(e.target.value);
//       setFProject(""); // reset project when company changes
//     }}
//   >
//     <option value="">כל החברות</option>
//     {companyOptions.map((name) => (
//       <option key={name} value={name}>{name}</option>
//     ))}
//   </select>
// </div>

// <div>
//   <label className="block text-xs mb-1">פרויקט</label>
//   <select
//     className="border rounded px-3 py-2 w-full"
//     value={fProject}
//     onChange={(e) => setFProject(e.target.value)}
//     disabled={projectOptions.length === 0}
//   >
//     <option value="">
//       {fCompany ? "כל הפרויקטים בחברה" : "כל הפרויקטים"}
//     </option>
//     {projectOptions.map((name) => (
//       <option key={name} value={name}>{name}</option>
//     ))}
//   </select>
// </div>

//         <div>
//           <label className="block text-xs mb-1">סוג יום</label>
//           <select className="border rounded px-3 py-2 w-full" value={fDay} onChange={(e) => setFDay(e.target.value as any)}>
//             <option value="all">הכל</option>
//             <option value="full">יום מלא</option>
//             <option value="half">חצי יום</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-xs mb-1">מתאריך</label>
//           <input type="date" className="border rounded px-3 py-2 w-full" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1">עד תאריך</label>
//           <input type="date" className="border rounded px-3 py-2 w-full" value={fTo} onChange={(e) => setFTo(e.target.value)} />
//         </div>

//         <div className="md:col-span-4 flex gap-2">
//           <button
//             className="border rounded px-3 py-2"
//             onClick={() => {
//               setFNumber(""); setFCompany(""); setFProject("");
//               setFDay("all"); setFFrom(""); setFTo(""); setFHasFile("all");
//             }}
//           >
//             נקה מסננים
//           </button>
//           <div className="text-sm text-neutral-600 self-center">
//             מציג {filtered.length} מתוך {items.length}
//           </div>
//         </div>
//       </div>

//       <div className="overflow-x-auto bg-white border rounded">
//         <table className="min-w-full text-sm">
//           <thead className="bg-neutral-50">
//             <tr className="text-right">
//               <th className="p-2">#</th>
//               <th className="p-2">חברה</th>
//               <th className="p-2">פרויקט</th>
//               <th className="p-2">ראש צוות</th>
//               <th className="p-2">סוג יום</th>
//               <th className="p-2">תאריך</th>
//               <th className="p-2">קובץ</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filtered.map((w) => {
//               const ms = tsToMs(w.createdAt);
//               const d = ms ? new Date(ms).toLocaleDateString("he-IL") : "";
//               return (
//                 <tr key={w.id} className="border-t">
//                   <td className="p-2 font-mono">{w.number}</td>
//                   <td className="p-2">{w.company || "-"}</td>
//                   <td className="p-2">{w.project || "-"}</td>
//                   <td className="p-2">{w.teamLead || "-"}</td>
//                   <td className="p-2">{w.dayType === "half" ? "חצי יום" : "יום מלא"}</td>
//                   <td className="p-2">{d}</td>
//                   <td className="p-2">
//                     {w.fileUrl ? (
//                       <a href={w.fileUrl} target="_blank" rel="noreferrer" className="underline">
//                         פתח
//                       </a>
//                     ) : w.storageKey ? (
//                       <button className="underline" onClick={() => regenUrl(w)}>
//                         צור קישור שעה
//                       </button>
//                     ) : (
//                       "-"
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//             {filtered.length === 0 && (
//               <tr>
//                 <td colSpan={6} className="p-4 text-center text-neutral-500">
//                   אין תוצאות למסננים שנבחרו
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {nextCursor && (
//         <div className="mt-3">
//           <button className="border rounded px-3 py-2" onClick={() => fetchPage(nextCursor!)}>
//             טען עוד מהשרת
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect ,useRef ,useState } from "react";
import { useNavigate } from "react-router-dom";
import LockScreen from "../components/LockScreen";
import Toolbar from "../components/Toolbar";
import WorklogTable from "../components/WorklogTable";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useWorklogs } from "../hooks/useWorklogs";
import StatsRow from "../components/StatsRow";
import QuickChips from "../components/QuickChips";

export default function AdminPage() {
  const navigate = useNavigate();
  
  const {
    adminKey, setAdminKey, authed, setAuthed, checking, loginError, verifyKey, headers,
  } = useAdminAuth(localStorage.getItem("adminKey") || "");

  const {
    items, filtered, nextCursor, loading,
    filters, setFilters, companyOptions, projectOptions,
    fetchPage, regenUrl,
  } = useWorklogs(headers);
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
    if (authed) {
      fetchPage(null).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <LockScreen
        adminKey={adminKey}
        setAdminKey={setAdminKey}
        checking={checking}
        loginError={loginError}
        onSubmit={verifyKey}
      />
    );
  }

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
              onClick={() => navigate("/admin/catalog")}
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
              onClick={() => navigate("/admin/reports")}
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
                  onClick={() => { setAuthed(false); setMoreOpen(false); }}
                  className="w-full text-right px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  role="menuitem"
                >
                  החלף מפתח
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("adminKey");
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
      onClick={() => navigate("/admin/catalog")}
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
    onClick={() => navigate("/admin/reports")}
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
    onClick={() => { setAuthed(false); }}
    title="החלף מפתח"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="7.5" cy="12.5" r="3.5"/><path d="M11 12.5h10M16 12.5v3M19 12.5v2"/>
    </svg>
    החלף מפתח
  </button>

  <button
    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
               bg-white  text-black/80 hover:bg-black/80 
               hover:text-white transition
               focus:outline-none focus:ring-2 focus:ring-red-300/50"
    onClick={() => {
      localStorage.removeItem("adminKey");
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
          onServerSearch={() => fetchPage(null).catch(()=>{})}
          counts={{ shown: filtered.length, total: items.length }}
          companyOptions={companyOptions}
          projectOptions={projectOptions}
        />
        <QuickChips filters={filters} setFilters={setFilters} />
        {loading && <div className="mb-2 text-xs text-neutral-500 animate-pulse">טוען נתונים...</div>}

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
