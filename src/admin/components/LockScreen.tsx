// LockScreen.tsx
import React, { useState } from "react";

export default function LockScreen({
  checking,
  loginError,
  onSubmit,
  initialUsername = "",
}: {
  checking: boolean;
  loginError: string;
  onSubmit: (creds: { username: string; password: string }) => void;
  initialUsername?: string;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !checking;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold mb-3 text-right">כניסת מנהל</h1>

        {/* Username */}
        <div className="mb-3">
          <input
            className="w-full border rounded px-3 py-2 text-right"
            placeholder="שם משתמש (לדוגמה: manager1)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            autoFocus
          />
        </div>

        {/* Password */}
        <div className="relative mb-2">
          <input
            className="w-full border rounded px-3 py-2 pr-10 text-right"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            type={show ? "text" : "password"}
          />
          <button
            type="button"
            aria-label={show ? "הסתר סיסמה" : "הצג סיסמה"}
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 left-2 my-auto h-7 px-2 rounded text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>

        {loginError && <div className="text-red-600 text-sm mb-3 text-right">{loginError}</div>}

        <button
          className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {checking ? "מתחבר..." : "כניסה"}
        </button>
      </div>
    </div>
  );
}
