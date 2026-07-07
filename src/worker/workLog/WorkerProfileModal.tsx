import React, { useState } from "react";
import { WorkLogForm } from "../utils/pdf/WorkLogPDF";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

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

  const [displayName, setDisplayName] = useState(form.teamLead || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // =======================================
  // SAVE DISPLAY NAME
  // =======================================
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

  // =======================================
  // SAVE PASSWORD
  // =======================================
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

      if (data.idToken) {
        localStorage.setItem("workerToken", data.idToken);
      }

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
  window.location.reload(); // force redirect to login screen
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative" dir="rtl">

        {/* ❌ TOP-RIGHT EXIT BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center
                     rounded-full bg-neutral-200 hover:bg-neutral-300
                     text-black font-bold transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          עריכת פרופיל עובד
        </h2>

        {/* CHANGE NAME */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">שם תצוגה</label>
          <input
            className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-indigo-300"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="שם העובד"
          />

          <button
            onClick={saveName}
            disabled={savingName}
            className="mt-3 w-full bg-black text-white rounded-xl py-2 hover:bg-black/80 disabled:opacity-50"
          >
            {savingName ? "שומר..." : "שמור שם"}
          </button>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">שינוי סיסמה</h3>

          <label className="block text-sm mb-1">סיסמה נוכחית</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 mb-3"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <label className="block text-sm mb-1">סיסמה חדשה</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 mb-3"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label className="block text-sm mb-1">אימות סיסמה חדשה</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 mb-3"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
          />

          <button
            onClick={savePassword}
            disabled={savingPass}
            className="w-full bg-black text-white rounded-xl py-2 hover:bg-black/80 disabled:opacity-50"
          >
            {savingPass ? "מעדכן..." : "עדכן סיסמה"}
          </button>
        </div>

    
        <button
          onClick={logoutWorker}
          className="w-full flex justify-center items-center text-white font-bold
                     bg-red-600 rounded-xl py-2 mt-4 hover:bg-red-700 transition"
        >
          יציאה
        </button>
      </div>
    </div>
  );
}
