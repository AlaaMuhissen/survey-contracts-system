import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =  "https://survey-contracts-system-backend.onrender.com";

export default function WorkerLockScreen() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  const canSubmit = username.trim().length > 0 && password.length > 0 && !checking;

  async function handleSubmit() {
    if (!canSubmit) return;

    try {
      setChecking(true);
      setLoginError("");

      const res = await fetch(`${API_BASE}/surveys/workers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      // save session
      localStorage.setItem("workerToken", data.idToken);
      localStorage.setItem("workerName", data.displayName);
      localStorage.setItem("workerId", data.workerId);
      localStorage.setItem("surveyId", data.surveyId);
      console.log("Logged in worker:", data);
      // redirect to worklog
      nav(`/${encodeURIComponent(data.surveyId)}`);
    } catch (e: any) {
      setLoginError(e?.message || "שגיאת התחברות");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold mb-3 text-right">כניסת עובד</h1>

        {/* Worker ID */}
        <div className="mb-3">
          <input
            className="w-full border rounded px-3 py-2 text-right"
            placeholder="ת״ז עובד"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            type={show ? "text" : "password"}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 left-2 my-auto h-7 px-2 rounded text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Error */}
        {loginError && (
          <div className="text-red-600 text-sm mb-3 text-right">
            {loginError}
          </div>
        )}

        {/* Submit */}
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
