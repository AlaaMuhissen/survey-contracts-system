// ================= FRONTEND =================
// File: src/admin/pages/SurveyEditPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminProfile } from "../types";

const API_BASE = process.env.BACKEND_URL || "http://localhost:8080";

type Survey = {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  businessId?: string;   // עוסק מורשה / ח"פ
  logoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

const emptySurvey: Survey = {
  name: "",
  address: "",
  phone: "",
  businessId: "",
  logoUrl: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      {children}
    </label>
  );
}

export default function SurveyEditPage() {
  const navigate = useNavigate();
  const { surveyId = "" } = useParams<{ surveyId: string }>();
   
  const [survey, setSurvey] = useState<Survey>(emptySurvey);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [detailsSavedMsg, setDetailsSavedMsg] = useState<string | null>(null);
  const [passwordSavedMsg, setPasswordSavedMsg] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [profile, setProfile] = useState<AdminProfile>({
  displayName: "",
  username: "",
  email: "",
  title: "",
});
  
  
  // Helpers
  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
  });
    const adminToken = localStorage.getItem("adminToken") || "";
  
  async function loadProfile(cancelled = false) {
      // if no token → redirect and stop
      if (!adminToken) {
        if (!cancelled) {
          navigate("/");
        }
        return;
      }

      if (!surveyId) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}/profile`,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          if (!cancelled) navigate("/");
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Profile load failed (${res.status}): ${txt}`);
        }

        const data = await res.json();
        const p = (data.profile || data.admin || data) as Partial<AdminProfile>;

        if (!cancelled) {
          setProfile({
            displayName: p.displayName || "",
            username: p.username || "",
            email: p.email || "",
            title: p.title || "",
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "שגיאה בטעינת הפרופיל");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
  // Load profile
    // טוען פרטי אדמין בהתחלה
    useEffect(() => {
    let cancelled = false;


    loadProfile(cancelled);
    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  // Load survey
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!surveyId) {
        setError("Missing surveyId in route");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}`, {
          headers: { ...authHeader() },
        });
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
        const data = await res.json();
        // Expecting { ok: true, survey: {...} }
        const s: Survey = data?.survey || {};
        if (!ignore) setSurvey({ ...emptySurvey, ...s });
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [surveyId]);

  // Save text fields (PATCH)
  async function save() {
    if (!surveyId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          name: survey.name?.trim(),
          address: survey.address?.trim(),
          phone: survey.phone?.trim(),
          businessId: survey.businessId?.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      // Optionally re-read server copy
      const data = await res.json();
      const s: Survey = data?.survey || {};
      setSurvey({ ...survey, ...s });
      // Back to dashboard
      navigate(`/admin/${encodeURIComponent(surveyId)}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // Upload logo to PUT /admin/surveys/:surveyId/logo
  async function onLogoPick(file: File | null) {
    if (!file || !surveyId) return;
    setLogoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}/logo`, {
        method: "PUT",
        headers: { ...authHeader() },
        body: fd,
      });
      if (!res.ok) throw new Error(`Logo upload failed (${res.status})`);
      const data = await res.json();
      const s: Survey = data?.survey || {};
      // If you return a signed URL, assign it; otherwise a public URL.
      setSurvey((prev) => ({ ...prev, logoUrl: s.logoUrl || prev.logoUrl }));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLogoUploading(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;




  


  async function handleSaveDetails() {
    if (!surveyId || !adminToken) {
      navigate("/");
      return;
    }
    setSavingDetails(true);
    setError(null);
    setDetailsSavedMsg(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            displayName: profile.displayName,
            username: profile.username,
            phone: profile.email,
            title: profile.title,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/");
        return;
      }

      if (!res.ok) {
        if (data?.error === "USERNAME_TAKEN") {
          throw new Error("שם משתמש כבר קיים למשתמש אחר");
        }
        throw new Error(data?.error || "שמירת פרטי מנהל נכשלה");
      }

      setDetailsSavedMsg("הפרטים נשמרו בהצלחה");
    } catch (e: any) {
      setError(e?.message || "שמירת פרטי מנהל נכשלה");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSavePassword() {
    if (!surveyId || !adminToken) {
      navigate("/");
      return;
    }
    setError(null);
    setPasswordSavedMsg(null);

    if (!password || !password2) {
      setError("יש למלא סיסמה חדשה ואישור סיסמה");
      return;
    }
    if (password !== password2) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setSavingPassword(true);
    try {
      // מניחים שהקמת endpoint: PATCH /auth/password (עם requireAuth)
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || "עדכון הסיסמה נכשל");
      }

      setPassword("");
      setPassword2("");
      setPasswordSavedMsg("הסיסמה עודכנה בהצלחה");
    } catch (e: any) {
      setError(e?.message || "עדכון הסיסמה נכשל");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100" dir="rtl">
        <div className="max-w-3xl mx-auto p-6">טוען פרטי מנהל...</div>
      </div>
    );
  }


return (
  <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
    <div className="mx-auto max-w-6xl p-4">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            הגדרות חברה &amp; מנהל
          </h1>
          <p className="text-sm text-neutral-600">
            עדכון פרטי העסק, הלוגו ופרטי המנהל
          </p>
        </div>

        <Link
          to={`/admin/${surveyId}`}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm
                     bg-white/80 backdrop-blur shadow-sm
                     text-black/80 hover:bg-black/80 hover:text-white
                     transition focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
        >
           <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 18l-6-6 6-6"/></svg>
          <span>חזרה ללוח</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 p-3 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* כרטיס: פרטי העסק */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">פרטי העסק</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="שם העסק">
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                           focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={survey.name}
                onChange={(e) =>
                  setSurvey({ ...survey, name: e.target.value })
                }
                placeholder="למשל: טרוורס מדידות"
              />
            </Field>

            <Field label="מס' טלפון">
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                           focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={survey.phone || ""}
                onChange={(e) =>
                  setSurvey({ ...survey, phone: e.target.value })
                }
                placeholder="054-1234567"
              />
            </Field>

            <Field label="כתובת">
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                           focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={survey.address || ""}
                onChange={(e) =>
                  setSurvey({ ...survey, address: e.target.value })
                }
                placeholder="אל-אנסאר 25, ירושלים"
              />
            </Field>

            <Field label="עוסק מורשה / ח.פ">
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                           focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={survey.businessId || ""}
                onChange={(e) =>
                  setSurvey({ ...survey, businessId: e.target.value })
                }
                placeholder="301156782"
              />
            </Field>

            <Field label="לוגו">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogoPick(e.target.files?.[0] || null)}
                  disabled={logoUploading}
                  className="text-sm"
                />
                {survey.logoUrl ? (
                  <img
                    src={survey.logoUrl}
                    alt="logo"
                    className="h-10 w-10 rounded-full border object-contain bg-white"
                  />
                ) : (
                  <span className="text-sm text-neutral-500">אין לוגו</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                העלאה תשמור את הקובץ ב-Supabase ותעדכן את כתובת הלוגו במסמך השאלון.
              </p>
            </Field>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !survey.name.trim()}
              className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium
                           hover:bg-black/80 disabled:opacity-60
                           focus:outline-none focus:ring-2 focus:ring-neutral-300/70"
            >
              {saving ? "שומר..." : "שמור פרטי עסק"}
            </button>

            <Link
              to={`/admin/${surveyId}`}
              className="px-4 py-2 rounded-xl border text-sm
                         bg-white text-neutral-700 hover:bg-neutral-50
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
            >
              ביטול
            </Link>
          </div>
        </div>

        {/* צד ימין: פרטי מנהל + שינוי סיסמה */}
        <div className="space-y-6">
          {/* פרטי מנהל */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-4">פרטי מנהל</h2>

            {detailsSavedMsg && (
              <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {detailsSavedMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <label className="block text-sm">
                <span className="block mb-1 text-neutral-700">שם משתמש</span>
                <input
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                             focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={profile.username}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="לדוגמה: manager1"
                />
                <span className="text-xs text-neutral-500">
                  ישמש גם ככתובת המייל הלוגית במערכת.
                </span>
              </label>

              <label className="block text-sm">
                <span className="block mb-1 text-neutral-700">אימייל</span>
                <input
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                             focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={profile.email || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="example@example.com"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-start gap-3">
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={savingDetails}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium
                           hover:bg-black/80 disabled:opacity-60
                           focus:outline-none focus:ring-2 focus:ring-neutral-300/70"
              >
                {savingDetails ? "שומר..." : "שמירת פרטי מנהל"}
              </button>
            </div>
          </div>

          {/* שינוי סיסמה */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-4">שינוי סיסמה</h2>

            {passwordSavedMsg && (
              <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {passwordSavedMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="block mb-1 text-neutral-700">סיסמה חדשה</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                             focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1 text-neutral-700">אימות סיסמה</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-right
                             focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="חזרה על הסיסמה"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-start gap-3">
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={savingPassword}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium
                           hover:bg-black/80 disabled:opacity-60
                           focus:outline-none focus:ring-2 focus:ring-neutral-300/70"
              >
                {savingPassword ? "מעדכן..." : "עדכון סיסמה"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
