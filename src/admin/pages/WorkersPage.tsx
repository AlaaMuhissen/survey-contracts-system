import React, { useEffect, useState } from "react";
import { Worker } from "../types";
import AddWorkerModal from "../components/AddWorkerModal";
const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";


export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const adminToken = localStorage.getItem("adminToken") || "";
  const surveyId = localStorage.getItem("surveyId") || "";
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);


  async function loadMore() {
    if (!nextCursor) return;
    await fetchWorkers("", nextCursor);
  }
  // 🔹 Fetch all workers
  async function fetchWorkers(q = "", cursor = "") {
    try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("limit", "25");
        if (q.trim()) params.set("q", q.trim());
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(
        `${API_BASE}/admin/surveys/${surveyId}/workers?${params.toString()}`,
        {
            headers: { Authorization: `Bearer ${adminToken}` },
        }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load workers");

     
        setWorkers(data.items || []);
        setNextCursor(data.nextCursor || null);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setLoading(false);
    }
    }


  // 🔹 Add new worker
  async function handleAddWorker(workerId: string, displayName: string) {
    try {
      setAdding(true);

      const res = await fetch(
        `${API_BASE}/surveys/${surveyId}/workers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ workerId, displayName }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add worker");

      alert("העובד נוסף בהצלחה");
      fetchWorkers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }


  // 🔹 Reset password
  async function handleResetPassword(workerId: string) {
    if (!window.confirm(`Reset password for ${workerId}?`)) return;
    try {
      const res = await fetch(
        `${API_BASE}/surveys/${surveyId}/workers/${workerId}/reset-password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reset password");
      alert("Password reset to 12345678");
    } catch (err: any) {
      alert(err.message);
    }
  }

  // 🔹 Delete worker
  async function handleDelete(workerId: string) {
    if (!window.confirm(`Delete worker ${workerId}? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `${API_BASE}/surveys/${surveyId}/workers/${workerId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete worker");
      alert("Worker deleted successfully");
      fetchWorkers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function handleToggleWorkerStatus(workerId: string, currentlyDisabled?: boolean) {
  try {
    const confirmMsg = currentlyDisabled
      ? "האם להפעיל מחדש את העובד?"
      : "האם להקפיא את העובד?";

    if (!window.confirm(confirmMsg)) return;

    const res = await fetch(
      `${API_BASE}/surveys/${surveyId}/workers/${workerId}/disable`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ disabled: !currentlyDisabled }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "פעולה נכשלה");

    // update UI
    setWorkers((prev) =>
      prev.map((w) =>
        w.workerId === workerId ? { ...w, disabled: !currentlyDisabled } : w
      )
    );
  } catch (err: any) {
    alert(err.message);
  }
}


    return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
        <div className="mx-auto max-w-6xl p-4">

        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-neutral-900">ניהול עובדים</h1>
            <p className="text-sm text-neutral-600">
                הוספה, ניהול ואיפוס סיסמאות לעובדים
            </p>
            </div>
            
            <a className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
            bg-white  backdrop-blur shadow-sm
            transition
            focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
            text-black/80 hover:bg-black/80 hover:text-white"        
             href="/admin">
            <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 18l-6-6 6-6"/></svg>
            חזרה ללוח
          </a>

        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/70 p-4 md:p-5">
            {loading ? (
            <div className="py-8 text-center text-sm text-neutral-500">
                טוען עובדים...
            </div>
            ) : (
            <>
                {/* Table wrapper for horizontal scroll on mobile */}
            <div className="flex justify-center mb-4">
            <button
                onClick={() => setShowAddModal(true)}
                disabled={adding}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm
                            bg-green-600 text-white shadow-sm
                            hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-green-300/70 "
                >
                                <svg width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.7"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="opacity-70">
                <path d="M15 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
                {adding ? "מוסיף..." : "הוסף עובד"}
            </button>
            </div>
                <div className="overflow-x-auto">
                  {showAddModal && (
                    <AddWorkerModal
                      onClose={() => setShowAddModal(false)}
                      onSubmit={async ({ workerId, displayName }) => {
                        setShowAddModal(false);
                        await handleAddWorker(workerId, displayName);
                      }}
                    />
                  )}

           
               { workers.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500">
                עדיין לא נוספו עובדים.
            </div>
            ) : (
                <table className="min-w-full  text-sm">
                    <thead>
                    <tr className="bg-neutral-50">
                        <th className="px-3 py-2 border-b text-sm font-medium text-neutral-600 ">
                        ת&quot;ז עובד
                        </th>
                        <th className="px-3 py-2 border-b text-sm font-medium text-neutral-600">
                        שם העובד
                        </th>
                        <th className="px-3 py-2 border-b text-sm font-medium text-neutral-600">
                        סטטוס
                        </th>
                        <th className="px-3 py-2 border-b text-sm font-medium text-neutral-600">
                        פעולות
                        </th>

                    </tr>
                    </thead>
                    <tbody>
                    {workers.map((w) => (
                        <tr
                        key={w.id}
                        className="hover:bg-neutral-50 transition-colors"
                        >
                        <td className="px-3 py-2 border-b font-mono text-[13px] text-center">
                            {w.workerId}
                        </td>

                       <td className="px-3 py-2 border-b  text-[13px] text-center">
                            {w.displayName || "—" }
                        </td>

                        <td className="px-3 py-2 border-b text-[13px] text-center">
                            {w.disabled ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 border border-red-100">
                                מנוטרל
                            </span>
                            ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 border border-emerald-100">
                                פעיל
                            </span>
                            )}
                        </td>
                        <td className="px-3 py-2 border-b ">
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() =>
                                        handleToggleWorkerStatus(w.workerId, w.disabled)
                                    }
                                className={`rounded-lg px-3 py-1.5 text-xs text-white transition
                                    focus:outline-none focus:ring-1
                                    ${
                                    w.disabled
                                        ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300" // Resume button
                                        : "bg-amber-500 hover:bg-amber-600 focus:ring-amber-300"       // Disable button
                                    }
                                `}
                                >
                                {w.disabled ? "הפעל עובד" : "הקפא עובד"}
                                </button>

                            <button
                                onClick={() => handleResetPassword(w.workerId)}
                                className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs
                                        hover:bg-amber-600 transition
                                        focus:outline-none focus:ring-1 focus:ring-amber-300"
                            >
                                אפס סיסמה
                            </button>
                            <button
                                onClick={() => handleDelete(w.workerId)}
                                className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs
                                        hover:bg-red-600 transition
                                        focus:outline-none focus:ring-1 focus:ring-red-300"
                            >
                                מחק
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
                </div>

                {/* Load more button */}
                {nextCursor && (
                <div className="mt-4 flex justify-center">
                    <button
                    onClick={loadMore}
                    className="rounded-full border px-4 py-2 bg-white/90 backdrop-blur
                                hover:bg-indigo-50 shadow-sm text-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
                    >
                    טען עוד
                    </button>
                </div>
                )}
            </>
            )}
        </div>
        </div>
    </div>
    );

}
