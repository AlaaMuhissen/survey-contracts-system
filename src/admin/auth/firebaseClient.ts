
import { initializeApp } from "firebase/app";
import { getAuth, onIdTokenChanged, signInWithEmailAndPassword } from "firebase/auth";
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID } from "../constants";



const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
};

console.log("🔥 Firebase config check:", firebaseConfig);

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Subscribe once in app startup (e.g., in a provider)
export function startIdTokenListener(onToken: (token: string | null) => void) {
  return onIdTokenChanged(auth, async (user) => {
    if (!user) { onToken(null); return; }
    const token = await user.getIdToken(/* forceRefresh? */ false);
    onToken(token);
  });
}

// Use this for login (instead of POST /auth/login)
export async function loginEmailPassword(username: string, password: string) {
  // if your backend uses email, map username→email here
  const { user } = await signInWithEmailAndPassword(auth, username, password);
  const idToken = await user.getIdToken();
  return { user, idToken };
}
