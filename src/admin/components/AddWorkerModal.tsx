import React, { useState } from "react";

export default function AddWorkerModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { workerId: string; displayName: string }) => void;
}) {
  const [workerId, setWorkerId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!/^\d{9}$/.test(workerId)) {
      setError("תעודת זהות חייבת להכיל 9 ספרות");
      return;
    }
    if (!displayName.trim()) {
      setError("חובה למלא שם עובד");
      return;
    }
    onSubmit({ workerId, displayName });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" dir="rtl">
        
        <h2 className="text-xl font-semibold mb-4">הוסף עובד חדש</h2>

        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-700 mb-1">
              ת"ז עובד (9 ספרות)
            </label>
            <input
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-right focus:ring-2 focus:ring-indigo-300"
              placeholder="לדוגמה: 123456789"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-700 mb-1">
              שם העובד
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-right focus:ring-2 focus:ring-indigo-300"
              placeholder="לדוגמה: מוחמד חמד"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-start">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
          >
            הוסף
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-neutral-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
