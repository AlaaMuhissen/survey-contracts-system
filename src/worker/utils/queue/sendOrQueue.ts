import { generateWorkLogPdfBlob } from "../pdf/WorkLogPDF";
import { enqueue, drain } from "./offlineQueue";


const API =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

const endpoint = (surveyId: string , companyId?: string, projectId?: string) =>
  `${API.replace(/\/+$/,'')}/surveys/${encodeURIComponent(surveyId)}/companies/${encodeURIComponent(companyId || "")}/projects/${encodeURIComponent(projectId || "")}/workLogs/upload-json`;


export type QueuedItem = {
  id: string;
  meta: any;
  surveyId: string;
  companyId?: string;
  projectId?: string;
  pdfBase64?: string;

};


export async function blobToBase64(blob: Blob): Promise<string> {
  if(!blob) return "";
  console.log("blobToBase64", blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob); // data:application/pdf;base64,....
  });
}

async function postJson(url: string, body: any) {
  try{
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" , "authorization": `Bearer ${localStorage.getItem("workerToken")}` || "" },
      body: JSON.stringify(body),
    });
     console.log(res.status)
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     return res.json();
  }catch(error){
    console.error("postJson error:", error);
    throw error;
  }
}


export async function sendOrQueue(
  meta: any,
  pdfBlob: Blob | null,// keep signature, but we won't use it when offline
  surveyId?: string,
  companyId?: string,
  projectId?: string,
  sigPack?: { sigManager: any; sigLead: any; sigMeta: any }
) {
   const sid = surveyId || meta?.surveyId;
   if (!sid) throw new Error("surveyId is required (arg or meta.surveyId)");

  const itemId = `${meta.number || "TEMP"}_${Date.now()}`;

  if (!navigator.onLine) {
    await enqueue({
      id: itemId,
      surveyId: sid,
      companyId,
      projectId,
      meta,
      kind: "draft",
      sigPack,      // ✅ save signatures
      pdfBase64: "", // ✅ optional, keep field but empty
    });
    return { queued: true, resp: null };
  }
   if (!pdfBlob) {
    // decide what you want: throw or queue without pdf etc.
    throw new Error("PDF blob is null");
  }
    const pdfBase64 = await blobToBase64(pdfBlob);

    // ✅ Online: try send, fallback to queue if request fails
    try {
       console.log("pdf base64 for online", pdfBase64);
      const resp = await postJson(endpoint(sid, companyId, projectId), { meta, pdfBase64 });
      return { queued: false, resp };
    } catch (e) {
      // NOTE: we don't actually know whether the server received and
      // processed this write before the error was thrown (e.g. a slow
      // Cloudinary upload + a flaky connection can drop the RESPONSE after
      // the write already succeeded). Queueing here for retry is the safer
      // default vs. losing the entry, but it does mean a retry could create
      // a second entry server-side in the rare case the original actually
      // went through. If you want this to be airtight, add an idempotency
      // key to `meta` here and have the backend dedupe on it.
      console.log("online send failed, queueing for retry", e);
      await enqueue({ id: itemId, meta, kind: "ready", pdfBase64, surveyId: sid, companyId, projectId });
      return { queued: true, resp: null };
    }

}




// קריאה בהתחברות מחדש
let isDraining = false; // module-level guard: survives across multiple
                        // setupOnlineDrain() calls (StrictMode double-effect,
                        // remounts, fast refresh, etc.) so two overlapping
                        // drains can never run at once.

export function setupOnlineDrain(onItemSynced?: (resp: any, item: QueuedItem) => void) {
  const tryDrain = async () => {
    if (isDraining) return;
    isDraining = true;
    try {
      await drain(async (item: any) => {
        const token = localStorage.getItem("workerToken");

        if (item.kind === "ready") {
          // This item already has its final meta.number/seq AND a
          // ready-to-send pdfBase64 from the failed online attempt.
          // Do NOT reserve a new number and do NOT regenerate the PDF —
          // there's no sigPack on "ready" items, so the old code that
          // unconditionally called generateWorkLogPdfBlob() here would
          // throw "Missing sigPack" for every single "ready" item, forever.
          const resp = await postJson(
            endpoint(item.surveyId, item.meta?.companyId, item.meta?.projectId),
            { meta: item.meta, pdfBase64: item.pdfBase64 }
          );
          onItemSynced?.(resp, item);
          return;
        }

        // "draft" items: reserve a real number, rebuild the PDF from the
        // saved signatures, then upload.
        const numRes = await fetch(
          `${API}/surveys/${encodeURIComponent(item.surveyId)}/workLogs/next-number`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!numRes.ok) throw new Error(`next-number failed HTTP ${numRes.status}`);

        const { number, seq } = await numRes.json();

        const finalMeta = { ...item.meta, number, seq };

        const sig = item.sigPack; // {sigManager, sigLead, sigMeta}
        if (!sig) throw new Error("Missing sigPack for queued item");

        const pdfBlob = await generateWorkLogPdfBlob(
          finalMeta,
          sig.sigManager,
          sig.sigLead,
          sig.sigMeta,
          item.surveyId
        );

        const pdfBase64 = await blobToBase64(pdfBlob);

        const resp = await postJson(
          endpoint(item.surveyId, finalMeta.companyId, finalMeta.projectId),
          { meta: finalMeta, pdfBase64 }
        );

        onItemSynced?.(resp, { ...item, meta: finalMeta });
      });
    } finally {
      isDraining = false;
    }
  };

  const onOnline = () => tryDrain();
  window.addEventListener("online", onOnline);
  if (navigator.onLine) tryDrain();

  return () => window.removeEventListener("online", onOnline);
}