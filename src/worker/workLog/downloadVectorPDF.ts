import { useNavigate } from "react-router-dom";
import { generateWorkLogPdfBlob } from "../utils/pdf/WorkLogPDF";
import { sendOrQueue } from "../utils/queue/sendOrQueue";
import { validateWorklog } from "../utils/validation/validateWorklog";

const toISO = (d: Date | undefined | null) =>
  (d ?? new Date()).toISOString().slice(0, 10);

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Download a PDF copy of the work log AND persist it exactly like Save does
 * (reserve a real serial number, upload/queue to the server). Previously
 * this only generated a local file with no server round-trip at all — no
 * serial number, nothing saved.
 */
const downloadVectorPDF = async (
  form: any,
  setForm: (fn: any) => void,
  setErrors: (errs: Record<string, string>) => void,
  sigManager: any,
  sigLead: any,
  sigMeta: any,
  surveyId: string | undefined,
  resetForm: () => void,
  API_BASE: string,
  nav: ReturnType<typeof useNavigate>,
) => {
  // 0) Guards
  if (!surveyId) {
    alert("חסר surveyId");
    return;
  }
  const token = localStorage.getItem("workerToken");
  if (!token) {
    alert("אין הרשאה — אנא התחבר שוב");
    nav("/");
    return;
  }

  // 1) Validate
  const errs = validateWorklog(form);
  setErrors(errs);
  if (Object.keys(errs).length > 0) return;

  // 2) Let React flush pending state
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  const dateStr = toISO(form.date);
  const filename = (num: string) => `work-log-${num}-${dateStr}.pdf`;

  // 3) Offline path — same handling as Save: queue it for later sync. There's
  // no way to get a REAL serial number without the server, so the local
  // download uses a placeholder; the synced copy gets renumbered once online.
  if (!navigator.onLine) {
    const offlineBlob = await generateWorkLogPdfBlob(
      { ...form, number: "00000" },
      sigManager,
      sigLead,
      sigMeta,
      surveyId
    );
    triggerBrowserDownload(offlineBlob, filename("00000-offline"));

    const { queued } = await sendOrQueue(
      { ...form, number: "00000" },
      null,
      surveyId,
      form.companyId,
      form.projectId,
      { sigManager, sigLead, sigMeta }
    );

    alert(
      queued
        ? "אופליין — נשמר לתור. הקובץ שהורד מסומן במספר זמני ויקבל מספר סופי בסנכרון"
        : "נשמר בהצלחה."
    );
    resetForm();
    return;
  }

  // 4) Reserve a real number
  const resp = await fetch(
    `${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workLogs/next-number`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("next-number failed:", resp.status, txt);
    alert("שגיאה בקבלת מספר סידורי");
    return;
  }

  const { number, seq } = await resp.json();

  // 5) Update form with the real number before rendering the PDF
  setForm((s: any) => ({ ...s, number }));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  // 6) Generate PDF once with the final number
  const pdfBlob = await generateWorkLogPdfBlob(
    { ...form, number },
    sigManager,
    sigLead,
    sigMeta,
    surveyId
  );

  // 7) Trigger the local download with the REAL number
  triggerBrowserDownload(pdfBlob, filename(number));

  // 8) Upload (or queue) — same as Save
  const sigPack = { sigManager, sigLead, sigMeta };
  const { queued } = await sendOrQueue(
    { ...form, number, seq },
    pdfBlob,
    surveyId,
    form.companyId,
    form.projectId,
    sigPack
  );

  alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
  resetForm();
};

export default downloadVectorPDF;