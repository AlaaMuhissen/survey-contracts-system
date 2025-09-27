import { enqueue, drain, removeById } from "./offlineQueue";


const ENDPOINT = "http://localhost:8080/worklogs/upload-json";

export type QueuedItem = { id: string; meta: any; pdfBase64: string };

export async function blobToBase64(blob: Blob): Promise<string> {
  console.log("blobToBase64", blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob); // data:application/pdf;base64,....
  });
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
   console.log(ENDPOINT)
   console.log(res.status)
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function sendOrQueue(meta: any, pdfBlob: Blob) {
  const pdfBase64 = await blobToBase64(pdfBlob);
  const item = { id: `${meta.number || "TEMP"}_${Date.now()}`, meta, pdfBase64 };

  try {
    const resp = await postJson(ENDPOINT, { meta, pdfBase64 });
    return { queued: false, resp };
  } catch (e) {
    await enqueue(item);
    return { queued: true, resp: null };
  }
}


// קריאה בהתחברות מחדש
export function setupOnlineDrain(
  onItemSynced?: (resp: any, item: QueuedItem) => void
) {
  const tryDrain = () =>
    drain(async (item) => {
      // שולחים לשרת את הפריט מהתור
      const resp = await postJson(ENDPOINT, {
        meta: item.meta,
        pdfBase64: item.pdfBase64,
      });

      // מוחקים מהתור רק אחרי הצלחה
      await removeById(item.id);

      // מעדכנים את הפרונט עם התשובה (למשל number סידורי)
      onItemSynced?.(resp, item);
    });

  // נרשמים לאירועים שמריצים ריקון אוטומטי
  window.addEventListener("online", tryDrain);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryDrain();
  });

  // נסיון ראשוני (נניח שהטאב נטען כשהרשת חזרה)
  tryDrain();
}
