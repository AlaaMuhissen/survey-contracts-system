export const API: string =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";
export const FIREBASE_API_KEY: string =
  (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyBPM4PrmvXJ8d8Go3U-AyJBlJkVFKcHpHs"; 
export const FIREBASE_AUTH_DOMAIN: string =
  (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "contracts-10c5e.firebaseapp.com"; 
export const FIREBASE_PROJECT_ID: string =
  (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "contracts-10c5e";