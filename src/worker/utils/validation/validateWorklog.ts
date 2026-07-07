type WorkLogForm = {
  companyId?: string;
  company?: string;
  projectId?: string;
  project?: string;
  manager?: string;      // “מנהל עבודה”
  teamLead?: string;     // “ראש צוות”
  date?: Date;         // "YYYY-MM-DD"
  number?: string;       // serial
  dayType?: "full" | "half";
  workDesc?: string;
  notes?: string;
};

export function validateWorklog(form: WorkLogForm) {
  const errors: Record<string, string> = {};

  // Choose the fields you truly want to require:
  console.log("validateWorklogssss function", { form });
  if (form.companyId === ''&& form.company === '') errors.company = "חובה לבחור חברה";
  if (!form.projectId && !form.project) errors.project = "חובה לבחור פרויקט";
  if (!form.manager?.trim()) errors.manager = "חובה למלא מנהל עבודה";
  if (!form.teamLead?.trim()) errors.teamLead = "חובה למלא ראש צוות";
  if (!form.date) errors.date = "חובה לבחור תאריך";
  if (!form.dayType) errors.dayType = "חובה לבחור סוג יום";
  // `number` is intentionally NOT validated here — it's always a
  // server-reserved serial, assigned right before submission in both
  // saveToFirebase and downloadVectorPDF. The user never types it, so
  // requiring it here was just a landmine: any form-reset path that
  // doesn't happen to set a non-empty placeholder for `number` (e.g.
  // INITIAL_FORM using "" instead of "00000") would silently block every
  // subsequent save with no visible error beyond a red field label.
  if (!form.workDesc?.trim()) errors.workDesc = "חובה לבחור תיאור עבודה";

  return errors;
}