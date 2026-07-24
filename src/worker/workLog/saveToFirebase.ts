import { useNavigate } from "react-router-dom";
import { generateWorkLogPdfBlob } from "../utils/pdf/WorkLogPDF";
import { sendOrQueue } from "../utils/queue/sendOrQueue";
import { validateWorklog, describeMissingFields } from "../utils/validation/validateWorklog";
import { slugify } from "../utils/slugify";

// PLACEHOLDER: the upload endpoint is keyed by companyId/projectId in the URL
// path. Private-service logs have neither, so until there's a dedicated
// backend route we route them through the same endpoint with a fixed
// companyId of "private" and the client's id (or a slug of their typed name)
// as the projectId. Swap this out once the backend has a real route.
const apiIdsFor = (form: any) => ({
  companyId: form.isPrivate ? "private" : form.companyId,
  projectId: form.isPrivate
    ? form.privateClientId || slugify(form.privateClientName)
    : form.projectId,
});

const saveToFirebase = async (
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

  // 2) Let React flush pending state
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  // 3) Offline path
  if (!navigator.onLine) {
    const { companyId, projectId } = apiIdsFor(form);
    const { queued } = await sendOrQueue(
      { ...form, number: "00000" },
      null, // <- no pdf yet
      surveyId,
      companyId,
      projectId,
      { sigManager, sigLead, sigMeta } // keep signatures to build later
    );

    alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
    resetForm();
    return;
  }


 
  // 4) Reserve number
  const resp = await fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/workLogs/next-number`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("next-number failed:", resp.status, txt);
    alert("שגיאה בקבלת מספר סידורי");
    return;
  }

  const { number, seq } = await resp.json();

  // 5) Update form with number before rendering PDF
  setForm((s: any) => ({ ...s, number }));
  await new Promise<void>(r => requestAnimationFrame(() => r()));
  await new Promise<void>(r => setTimeout(r, 0));

  // 6) Generate PDF once with final number
  const pdfBlob = await generateWorkLogPdfBlob({ ...form, number }, sigManager, sigLead, sigMeta, surveyId);
  console.log("pdfBlob for the online", pdfBlob);
  const sigPack = { sigManager, sigLead, sigMeta };
  // 7) Upload (or queue) with number+seq
  const { companyId, projectId } = apiIdsFor(form);
  const { queued } = await sendOrQueue({ ...form, number, seq }, pdfBlob, surveyId, companyId, projectId, sigPack);
  alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
  resetForm();
};
export default saveToFirebase;