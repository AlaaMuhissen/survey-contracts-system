import { generateWorkLogPdfBlob } from "../utils/pdf/WorkLogPDF";
import { sendPdfViaEmailNoBackend } from "../utils/shareNoBackend";
import { validateWorklog } from "../utils/validation/validateWorklog";


  const sendEmail = async (
    form: any,
    setErrors: (errs: Record<string, string>) => void,
    sigManager: any,
    sigLead: any,
    sigMeta: any,
    surveyId: string | undefined,
    resetForm: () => void,
    ) => {
        
    const toISO = (d: Date | undefined | null) =>
    (d ?? new Date()).toISOString().slice(0, 10);
    const dateStr = toISO(form.date);
    const filename = () => `work-log-${dateStr}.pdf`;
    const errs = validateWorklog(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // stop here – don’t generate PDF, don’t upload
      return;
    }
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 0));

    const blob = await generateWorkLogPdfBlob(
      form,
      sigManager,
      sigLead,
      sigMeta,
      surveyId!
    );
    await sendPdfViaEmailNoBackend(blob, filename(), {
      // to: "client@example.com", // optional
      subject: "יומן עבודה (PDF)",
      bodyPrefix: "שלום,\nמצורף קובץ יומן העבודה.",
    });
    resetForm();
  };
    export default sendEmail;