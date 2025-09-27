export const API: string =
  (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080";
