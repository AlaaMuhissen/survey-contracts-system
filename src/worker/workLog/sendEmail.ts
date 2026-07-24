import { useNavigate } from "react-router-dom";
import { generateWorkLogPdfBlob } from "../utils/pdf/WorkLogPDF";
import { sendPdfViaEmailNoBackend } from "../utils/shareNoBackend";
import { validateWorklog, describeMissingFields } from "../utils/validation/validateWorklog";
import { sendOrQueue } from "../utils/queue/sendOrQueue";
import { slugify } from "../utils/slugify";
import { buildWorkLogSummary, buildWorkLogEmailSubject } from "../utils/worklogsummary";

// PLACEHOLDER — see saveToFirebase.ts for the full explanation.
const apiIdsFor = (form: any) => ({
  companyId: form.isPrivate ? "private" : form.companyId,
  projectId: form.isPrivate
    ? form.privateClientId || slugify(form.privateClientName)
    : form.projectId,
});

const toISO = (d: Date | undefined | null) =>
  (d ?? new Date()).toISOString().slice(0, 10);

/**
 * Send the work log PDF via email AND persist it exactly like Save does
 * (reserve a real serial number, upload/queue to the server). Previously
 * this only shared a local file with no server round-trip at all — no
 * serial number, nothing saved.
 */
const sendEmail = async (
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
  const errs = validateWorklog(form, { sigManager, sigLead });
  setErrors(errs);
  if (Object.keys(errs).length > 0) {
    alert(`חסרים השדות הבאים: ${describeMissingFields(errs)}`);
    return;
  }

  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  const dateStr = toISO(form.date);
  const filename = (num: string) => `work-log-${num}-${dateStr}.pdf`;

  // 2) Offline path — same handling as Save/Download: queue it for later
  // sync, share locally with a placeholder number.
  if (!navigator.onLine) {
    const offlineBlob = await generateWorkLogPdfBlob(
      { ...form, number: "00000" },
      sigManager,
      sigLead,
      sigMeta,
      surveyId
    );
    await sendPdfViaEmailNoBackend(offlineBlob, filename("00000-offline"), {
      subject: buildWorkLogEmailSubject(form, "זמני (אופליין)"),
      bodyPrefix: `שלום,\nמצורף קובץ יומן העבודה. הפרטים:\n\n${buildWorkLogSummary(form, "זמני (אופליין)")}`,
    });

    const { companyId, projectId } = apiIdsFor(form);
    const { queued } = await sendOrQueue(
      { ...form, number: "00000" },
      null,
      surveyId,
      companyId,
      projectId,
      { sigManager, sigLead, sigMeta }
    );

    alert(
      queued
        ? "אופליין — נשמר לתור. הקובץ שנשלח מסומן במספר זמני ויקבל מספר סופי בסנכרון"
        : "נשמר בהצלחה."
    );
    resetForm();
    return;
  }

  // 3) Reserve a real number
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

  // 4) Update form with the real number before rendering the PDF
  setForm((s: any) => ({ ...s, number }));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  // 5) Generate PDF once with the final number
  const pdfBlob = await generateWorkLogPdfBlob(
    { ...form, number },
    sigManager,
    sigLead,
    sigMeta,
    surveyId
  );

  // 6) Share via email with the REAL number
  await sendPdfViaEmailNoBackend(pdfBlob, filename(number), {
    subject: buildWorkLogEmailSubject(form, number),
    bodyPrefix: `שלום,\nמצורף קובץ יומן העבודה. הפרטים:\n\n${buildWorkLogSummary(form, number)}`,
  });

  // 7) Upload (or queue) — same as Save/Download
  const sigPack = { sigManager, sigLead, sigMeta };
  const { companyId, projectId } = apiIdsFor(form);
  const { queued } = await sendOrQueue(
    { ...form, number, seq },
    pdfBlob,
    surveyId,
    companyId,
    projectId,
    sigPack
  );

  alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
  resetForm();
};

export default sendEmail;