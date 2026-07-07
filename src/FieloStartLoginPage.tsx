import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Role = "worker" | "admin";

// תומך בכל ה-ENV שהופיעו אצלך
const API = "https://survey-contracts-system-backend.onrender.com";

export default function FieloStartLoginPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("worker");

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-900" dir="rtl">
      <LightPremiumBg />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full"
        >
          {/* Shell */}
          <div className="grid gap-6 rounded-[30px] border border-black/5 bg-white/60 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl md:grid-cols-2 md:p-8">
            {/* Left brand */}
            <LeftBrandLight />

            {/* Right login */}
            <div className="rounded-[26px] border border-black/5 bg-white/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-7">
              <RoleTabsLight role={role} setRole={setRole} />

              <AnimatePresence mode="wait">
                {role === "admin" ? (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.28 }}
                  >
                    <AdminLoginEmbedded
                      apiBase={API}
                      onAfterLogin={(sid) => nav(`/admin/${encodeURIComponent(sid)}`)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="worker"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.28 }}
                  >
                    <WorkerLoginEmbedded
                      apiBase={API}
                      onAfterLogin={(sid) => nav(`/${encodeURIComponent(sid)}`)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-center text-xs text-neutral-500"
          >
            Fielo — עמוד פתיחה פרימיום לעובדים ולמנהלים
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ===================== Admin (אותה לוגיקה שלך) ===================== */

function AdminLoginEmbedded({
  apiBase,
  onAfterLogin,
}: {
  apiBase: string;
  onAfterLogin: (surveyId: string) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [username, setUsername] = useState(
    typeof window !== "undefined" ? localStorage.getItem("username") || "" : ""
  );
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const canSubmit = username.trim().length > 0 && password.length > 0 && !checking;

  async function handleSubmit() {
    if (!canSubmit) return;

    setChecking(true);
    setLoginError("");

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error === "INVALID_CREDENTIALS"
            ? "שם משתמש או סיסמה שגויים"
            : data?.error || "שגיאת התחברות";
        throw new Error(msg);
      }

      const idToken: string = data.idToken;
      localStorage.setItem("adminToken", idToken);
      localStorage.setItem("username", username);

      const sid: string | undefined = data?.user?.surveyId;
      if (sid) {
        localStorage.setItem("surveyId", sid);
        onAfterLogin(sid);
      } else {
        setLoginError("לא נמצא surveyId למשתמש");
      }
    } catch (e: any) {
      setLoginError(e?.message || "שגיאת התחברות");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <HeaderBlockLight title="התחברות מנהל" subtitle="כניסה ללוח הבקרה ולניהול המערכת" />
      <AnimatePresence>{loginError ? <ErrorBoxLight text={loginError} /> : null}</AnimatePresence>

      <FieldLight label="שם משתמש">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none transition focus:border-black/20 focus:bg-white"
          placeholder="שם משתמש"
          autoComplete="username"
        />
      </FieldLight>

      <FieldLight label="סיסמה">
        <div className="relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none transition focus:border-black/20 focus:bg-white pl-12  text-black"
            placeholder="••••••••"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white/80 px-3 py-1 text-xs text-neutral-700 hover:bg-white"
          >
            {showPass ? "הסתר" : "הצג"}
          </button>
        </div>
      </FieldLight>

      <PrimaryButtonLight disabled={!canSubmit} loading={checking} onClick={handleSubmit}>
        כניסה
      </PrimaryButtonLight>

      <FooterHintLight text="גישה למנהלים בלבד • מאובטח" />
    </div>
  );
}

/* ===================== Worker (אותה לוגיקה שלך) ===================== */

function WorkerLoginEmbedded({
  apiBase,
  onAfterLogin,
}: {
  apiBase: string;
  onAfterLogin: (surveyId: string) => void;
}) {
  const [workerId, setWorkerId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  const canSubmit = workerId.trim().length > 0 && password.length > 0 && !checking;

  async function handleSubmit() {
    if (!canSubmit) return;

    try {
      setChecking(true);
      setLoginError("");

      const res = await fetch(`${apiBase}/surveys/workers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "שגיאת התחברות");

      localStorage.setItem("workerToken", data.idToken);
      localStorage.setItem("workerId", data.workerId);
      localStorage.setItem("surveyId", data.surveyId);
       localStorage.setItem("workerName", data.displayName);

      onAfterLogin(data.surveyId);
    } catch (e: any) {
      setLoginError(e?.message || "שגיאת התחברות");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <HeaderBlockLight title="כניסת עובד" subtitle="התחברות מהירה לעבודה בשטח (כולל אופליין)" />
      <AnimatePresence>{loginError ? <ErrorBoxLight text={loginError} /> : null}</AnimatePresence>

      <FieldLight label='ת"ז עובד'>
        <input
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none transition focus:border-black/20 focus:bg-white"
          placeholder='הקלידי ת"ז עובד'
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
      </FieldLight>

      <FieldLight label="סיסמה">
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 outline-none transition focus:border-black/20 focus:bg-white pl-12"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            type={show ? "text" : "password"}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white/80 px-3 py-1 text-xs text-neutral-700 hover:bg-white"
          >
            {show ? "הסתר" : "הצג"}
          </button>
        </div>
      </FieldLight>

      <PrimaryButtonLight disabled={!canSubmit} loading={checking} onClick={handleSubmit}>
        כניסה
      </PrimaryButtonLight>

      <FooterHintLight text="גישה לעובדים • עובד טוב גם ברשת חלשה" />
    </div>
  );
}

/* ===================== Light UI bits ===================== */

function RoleTabsLight({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-neutral-100/80 p-1 border border-black/5">
      <motion.div
        className="absolute top-1 bottom-1 w-1/2 rounded-xl bg-white shadow-[0_10px_26px_rgba(0,0,0,0.08)]"
        animate={{ x: role === "worker" ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      />
      <button
        type="button"
        onClick={() => setRole("worker")}
        className={`relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          role === "worker" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        עובד
      </button>
      <button
        type="button"
        onClick={() => setRole("admin")}
        className={`relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          role === "admin" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        מנהל
      </button>
    </div>
  );
}

function HeaderBlockLight({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold tracking-tight">{title}</div>
      <div className="text-sm text-neutral-600">{subtitle}</div>
    </div>
  );
}

function FieldLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-neutral-800">{label}</div>
      {children}
    </div>
  );
}

function ErrorBoxLight({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {text}
    </motion.div>
  );
}

function PrimaryButtonLight({
  children,
  disabled,
  loading,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
        disabled
          ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
          : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_14px_40px_rgba(0,0,0,0.16)]"
      }`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <SpinnerDarkOnLight /> מתחברת...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

function FooterHintLight({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-neutral-500">
      <span>{text}</span>
      <span className="rounded-xl border border-black/10 bg-white/70 px-3 py-1">Fielo</span>
    </div>
  );
}

function SpinnerDarkOnLight() {
  return (
    <span className="inline-flex h-4 w-4">
      <motion.span
        className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white/90"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}

/* ===================== Left brand (Light premium) ===================== */

function LeftBrandLight() {
  // אנימציית אותיות נחמדה ל-Fielo (בלי להגזים)
  const letters = useMemo(() => "oleiF".split(""), []);
//fileo
  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <motion.div
            className="h-12 w-12 rounded-2xl border border-black/10 bg-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.98 }}
          >
           <img
                src="/fielo_logo_noBG.png"
                alt="Fielo logo"
                className="h-7 w-7 object-contain"
                />

          </motion.div>

          <div>
            <div className="text-lg font-bold tracking-tight flex gap-[2px]">
              {letters.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.4 }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <div className="text-xs text-neutral-500">סקרים בשטח • חוזים • אופליין</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.6 }}
          className="space-y-3"
        >
          <div className="text-4xl font-extrabold leading-tight tracking-tight">
            ברוכים הבאים ל־<span className="text-neutral-900">Fielo</span>
          </div>
          <div className="text-neutral-600 leading-relaxed">
            מערכת לניהול עבודה של מודדים ומהנדסים בשטח
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <PillLight>חוסך זמן</PillLight>
            <PillLight>מבטל ניירת</PillLight>
            <PillLight>עובד גם בלי אינטרנט</PillLight>
            
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.6 }}
          className="rounded-[22px] border border-black/5 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="text-sm font-semibold text-neutral-900">הזרימה היומית</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-600">
            <MiniStepLight idx="1" text="התחברות" />
            <MiniStepLight idx="2" text="מילוי + חתימה" />
            <MiniStepLight idx="3" text="סנכרון + הפקה" />
          </div>
        </motion.div>
      </div>

      <div className="text-xs text-neutral-400">
        © {new Date().getFullYear()} Fielo — נבנה לעבודה אמיתית בשטח.
      </div>
    </div>
  );
}

function PillLight({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      whileHover={{ y: -1 }}
      className="rounded-2xl border border-black/10 bg-white/70 px-3 py-1 text-xs text-neutral-700 shadow-[0_10px_25px_rgba(0,0,0,0.05)]"
    >
      {children}
    </motion.span>
  );
}

function MiniStepLight({ idx, text }: { idx: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-3 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
      <div className="text-neutral-900 font-semibold">{idx}</div>
      <div className="mt-1 text-neutral-600">{text}</div>
    </div>
  );
}

/* ===================== Light Premium Background ===================== */

function LightPremiumBg() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Animated blobs (Light) */}
      <motion.div
        className="absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.45), rgba(59,130,246,0.0) 60%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 25, 55, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -bottom-64 -right-64 h-[680px] w-[680px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(168,85,247,0.42), rgba(168,85,247,0.0) 60%)",
        }}
        animate={{ x: [0, -55, 15, 0], y: [0, -20, -70, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.28), rgba(34,197,94,0.0) 62%)",
        }}
        animate={{ scale: [1, 1.07, 0.98, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-neutral-50 to-neutral-100" />

      {/* Grid */}
      <GridLinesLight />
    </div>
  );
}

function GridLinesLight() {
  return (
    <div
      className="absolute inset-0 opacity-[0.22]"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
      }}
    />
  );
}
