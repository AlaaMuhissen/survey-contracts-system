import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { WorkLogForm } from "../utils/pdf/WorkLogPDF";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

const fieldCls =
  "w-full min-w-0 border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300/60";

function IconClipboardCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 7l3-3h5l2 2h8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function WorkerProfileModal({
  onClose,
  form,
  setForm,
  surveyId,
}: {
  onClose: () => void;
  form: WorkLogForm;
  setForm: React.Dispatch<React.SetStateAction<WorkLogForm>>;
  surveyId: string;
}) {
  const workerToken = localStorage.getItem("workerToken") || "";
  const adminToken = localStorage.getItem("adminToken") || "";
  const workerId = localStorage.getItem("workerId") || "";
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState(form.teamLead || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [worklogsCount, setWorklogsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!workerToken) return;
    fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/pending-signatures`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setPendingCount(d.items.length); })
      .catch(() => {});

    fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workLogs/mine`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setWorklogsCount(d.items.length); })
      .catch(() => {});
  }, [workerToken, surveyId]);

  async function saveName() {
    try {
      setSavingName(true);
      const res = await fetch(
        `${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workers/${workerId}/displayName`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken || workerToken}`,
          },
          body: JSON.stringify({ displayName }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בעדכון שם");
      setForm((old) => ({ ...old, teamLead: displayName }));
      alert("השם עודכן בהצלחה");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    if (!currentPassword || !newPassword || !newPassword2) {
      alert("יש למלא את כל השדות");
      return;
    }
    if (newPassword !== newPassword2) {
      alert("הסיסמאות החדשות אינן תואמות");
      return;
    }
    try {
      setSavingPass(true);
      const res = await fetch(
        `${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workers/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${workerToken}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בעדכון סיסמה");
      if (data.idToken) localStorage.setItem("workerToken", data.idToken);
      alert("הסיסמה עודכנה בהצלחה");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingPass(false);
    }
  }

  function logoutWorker() {
    localStorage.removeItem("workerToken");
    localStorage.removeItem("workerId");
    onClose();
    window.location.reload();
  }

  const initial = (form.teamLead || "?").trim().charAt(0).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full sm:max-w-md sm:m-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 px-5 pt-6 pb-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full
                       bg-white/15 hover:bg-white/25 text-white text-lg leading-none transition"
            aria-label="סגור"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center
                            text-white text-xl font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-lg truncate">{form.teamLead || "עובד"}</div>
              <div className="text-white/70 text-xs">פרופיל עובד</div>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-6">

          {/* Quick nav */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onClose(); nav(`/${encodeURIComponent(surveyId)}/pending-signatures`); }}
              className="relative flex flex-col items-center gap-1.5 rounded-2xl border bg-neutral-50 py-3.5 text-xs font-medium
                         text-black/70 hover:bg-neutral-100 active:scale-[0.98] transition"
            >
              {!!pendingCount && (
                <span className="absolute top-2 left-2 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              <span className="text-indigo-600"><IconClipboardCheck /></span>
              בקשות חתימה
            </button>
            <button
              onClick={() => { onClose(); nav(`/${encodeURIComponent(surveyId)}/my-worklogs`); }}
              className="relative flex flex-col items-center gap-1.5 rounded-2xl border bg-neutral-50 py-3.5 text-xs font-medium
                         text-black/70 hover:bg-neutral-100 active:scale-[0.98] transition"
            >
              {!!worklogsCount && (
                <span className="absolute top-2 left-2 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {worklogsCount}
                </span>
              )}
              <span className="text-indigo-600"><IconFolder /></span>
              היומנים שלי
            </button>
          </div>

          {/* Display name */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-black/80">
              <IconUser />
              שם תצוגה
            </div>
            <input
              className={fieldCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="שם העובד"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="mt-2.5 w-full h-11 rounded-xl bg-black text-white text-sm font-medium
                         hover:bg-black/85 disabled:opacity-50 transition"
            >
              {savingName ? "שומר..." : "שמור שם"}
            </button>
          </div>

          {/* Password */}
          <div className="pt-1 border-t">
            <div className="flex items-center gap-2 mt-5 mb-2 text-sm font-semibold text-black/80">
              <IconLock />
              שינוי סיסמה
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">סיסמה נוכחית</label>
                <input
                  type="password"
                  className={fieldCls}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">סיסמה חדשה</label>
                <input
                  type="password"
                  className={fieldCls}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">אימות סיסמה חדשה</label>
                <input
                  type="password"
                  className={fieldCls}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={savePassword}
              disabled={savingPass}
              className="mt-3 w-full h-11 rounded-xl bg-black text-white text-sm font-medium
                         hover:bg-black/85 disabled:opacity-50 transition"
            >
              {savingPass ? "מעדכן..." : "עדכן סיסמה"}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 border-t shrink-0">
          <button
            onClick={logoutWorker}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl
                       bg-red-50 text-red-600 font-medium hover:bg-red-100 active:scale-[0.98] transition"
          >
            <IconLogout />
            יציאה
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}