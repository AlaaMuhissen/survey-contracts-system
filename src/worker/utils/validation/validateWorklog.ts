type WorkLogForm = {
  companyId?: string;
  company?: string;
  projectId?: string;
  project?: string;
  isPrivate?: boolean;
  privateClientId?: string;
  privateClientName?: string;
  manager?: string;      // “מנהל עבודה”
  teamLead?: string;     // “ראש צוות”
  date?: Date;         // "YYYY-MM-DD"
  number?: string;       // serial
  dayType?: "full" | "half";
  workDesc?: string;
  notes?: string;
};

type SignaturesInput = {
  sigManager?: any[];
  sigLead?: any[];
};

export function validateWorklog(
  form: WorkLogForm,
  signatures?: SignaturesInput,
  opts?: { requireManagerSignature?: boolean }
) {
  const errors: Record<string, string> = {};

  // Choose the fields you truly want to require:
  console.log("validateWorklogssss function", { form });
  if (form.isPrivate) {
    if (!form.privateClientName?.trim()) errors.privateClientName = "חובה למלא שם לקוח";
  } else {
    if (form.companyId === ''&& form.company === '') errors.company = "חובה לבחור חברה";
    if (!form.projectId && !form.project) errors.project = "חובה לבחור פרויקט";
  }
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

  // Signatures — optional param so callers that don't pass them (or that
  // legitimately don't have one yet, e.g. "send for manager signature")
  // aren't forced into this check.
  if (signatures) {
    if (!signatures.sigLead || signatures.sigLead.length === 0) {
      errors.sigLead = "חובה לחתום כראש צוות";
    }
    const requireManager = opts?.requireManagerSignature !== false;
    if (requireManager && (!signatures.sigManager || signatures.sigManager.length === 0)) {
      errors.sigManager = "חובה לחתום כמנהל עבודה";
    }
  }

  return errors;
}

const FIELD_LABELS: Record<string, string> = {
  company: "חברה",
  project: "פרויקט",
  privateClientName: "שם לקוח פרטי",
  manager: "מנהל עבודה",
  teamLead: "ראש צוות",
  date: "תאריך",
  dayType: "סוג יום",
  workDesc: "תיאור עבודה",
  sigManager: "חתימת מנהל",
  sigLead: "חתימת ראש צוות",
};

// Turns the errors object from validateWorklog into a readable list of
// field names for an alert/toast, e.g. "חברה, מנהל עבודה, חתימת ראש צוות"
// — instead of a generic "something's missing" message that doesn't say
// what.
export function describeMissingFields(errs: Record<string, string>): string {
  return Object.keys(errs)
    .map((k) => FIELD_LABELS[k] || k)
    .join(", ");
}