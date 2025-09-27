import React, { useState } from  "react";

export default function LockScreen({
  adminKey, setAdminKey, checking, loginError, onSubmit,
}: {
  adminKey: string;
  setAdminKey: (v: string) => void;
  checking: boolean;
  loginError: string;
  onSubmit: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold mb-3 text-right">כניסת מנהל</h1>
        <div className="relative">
          <input
            className="w-full border rounded px-3 py-2 pr-10 text-right"
            placeholder="הקליד את הסיסמה כאן"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && adminKey && !checking) onSubmit(); }}
            autoFocus
            type={show ? "text" : "password"}
          />
          <button
            type="button"
            aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"}
            onClick={() => setShow(s => !s)}
            className="absolute inset-y-0 left-2 my-auto h-7 px-2 rounded text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>
        {loginError && <div className="text-red-600 text-sm mb-3 text-right">{loginError}</div>}
        <button
          className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
          onClick={onSubmit}
          disabled={!adminKey || checking}
        >
          {checking ? "בודק..." : "כניסה"}
        </button>
      </div>
    </div>
  );
}
