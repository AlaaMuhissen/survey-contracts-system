import { enqueue, drain, removeById } from "./offlineQueue";

const ENDPOINT = "http://localhost:8080/worklogs/upload-json";

export async function blobToBase64(blob: Blob): Promise<string> {
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function sendOrQueue(meta: any, pdfBlob: Blob) {
  const pdfBase64 = await blobToBase64(pdfBlob);
  const item = { id: `${meta.number || "no-num"}_${Date.now()}`, meta, pdfBase64 };

  // ניסיון אונליין מיידי
  try {
    await postJson(ENDPOINT, { meta, pdfBase64 });
    return { queued: false, ok: true };
  } catch {
    // בלי אינטרנט/נכשל – לתור
    await enqueue(item);
    return { queued: true, ok: true };
  }
}

// קריאה בהתחברות מחדש
export function setupOnlineDrain() {
  const tryDrain = () =>
    drain(async (item) => {
      await postJson(ENDPOINT, { meta: item.meta, pdfBase64: item.pdfBase64 });
      await removeById(item.id);
    });

  window.addEventListener("online", tryDrain);
  // אפשר גם לנסות פעם אחת עם טעינת האפליקציה
  tryDrain();
}
