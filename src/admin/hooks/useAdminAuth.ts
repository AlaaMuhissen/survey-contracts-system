import { useCallback, useEffect, useState,useMemo } from "react";
import { getKeyMeta } from "../api/adminApi";

export function useAdminAuth(initialKey: string) {
  const [adminKey, setAdminKey] = useState<string>(initialKey);
  const [authed, setAuthed] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(!!initialKey);
  const [loginError, setLoginError] = useState<string>("");

  const verifyKey = useCallback(async () => {
    const key = adminKey.trim();
    if (!key) return false;
    setChecking(true); setLoginError("");
    try {
      await getKeyMeta(key);
      localStorage.setItem("adminKey", key);
      setAuthed(true);
      return true;
    } catch {
      setAuthed(false);
      setLoginError("מפתח לא תקין. נסה שוב.");
      return false;
    } finally {
      setChecking(false);
    }
  }, [adminKey]);

  // try stored on mount
  useEffect(() => { if (adminKey) verifyKey(); }, [verifyKey]);

    const headers = useMemo(
    () => ({
      "x-admin-key": adminKey.trim(),
      "Content-Type": "application/json",
    }),
    [adminKey]
  );

  return { adminKey, setAdminKey, authed, setAuthed, checking, loginError, verifyKey, headers };

//   const headers = { "x-admin-key": adminKey.trim(), "Content-Type": "application/json" };
}
