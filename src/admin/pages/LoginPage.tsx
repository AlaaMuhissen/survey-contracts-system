
import React from "react";
import LockScreen from "../components/LockScreen"; // <- your LockScreen component from before
import { useNavigate } from "react-router-dom";

const API = process.env.NEXT_PUBLIC_API_URL || "https://survey-contracts-system-backend.onrender.com";

export default function LoginPage({
  onSuccess,
}: {
  onSuccess?: (data: {
    idToken: string;
    refreshToken?: string;
    expiresIn?: string;
    user?: any;
  }) => void;
}) {
  const [checking, setChecking] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");
  const navig = useNavigate();
  return (
    <LockScreen
      checking={checking}
      loginError={loginError}
      initialUsername={typeof window !== "undefined" ? localStorage.getItem("username") || "" : ""}
      onSubmit={async ({ username, password }) => {
        setChecking(true);
        setLoginError("");
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();

          if (!res.ok) {
            // common Firebase errors: INVALID_PASSWORD, EMAIL_NOT_FOUND, etc.
            const msg =
              data?.error === "INVALID_CREDENTIALS"
                ? "שם משתמש או סיסמה שגויים"
                : data?.error || "שגיאת התחברות";
            throw new Error(msg);
          }

          // tokens
          const idToken: string = data.idToken;
          localStorage.setItem("adminToken", idToken);
          localStorage.setItem("username", username);
          localStorage.setItem("surveyId", data.user?.surveyId || "");
          // survey idAS
          const sid: string | undefined = data?.user?.surveyId;
          if (sid) {
            localStorage.setItem("surveyId", sid);
            // Redirect WITH surveyId as path param:
            console.log("LoginPage navig to surveyId", { sid });
            navig(`/admin/${encodeURIComponent(sid)}`);
          } else {
            // fallback if backend didn’t return it
            setLoginError("לא נמצא surveyId למשתמש");
            return;
          }

          onSuccess?.(data);
        } catch (e: any) {
          setLoginError(e?.message || "שגיאת התחברות");
        } finally {
          setChecking(false);
        }
      }}
    />
  );
}
