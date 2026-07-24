// Builds a human-readable summary of a work log for share messages
// (WhatsApp text, email subject/body) — shared by sendWhatsApp.ts and
// sendEmail.ts so both stay consistent.

const formatDMY = (val: string | Date | undefined) => {
  let d: Date;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === "string") {
    // A full ISO datetime (already has a "T", e.g. from JSON.stringify(Date)
    // as fetched back from Firestore) parses correctly on its own — only a
    // plain "YYYY-MM-DD" string needs a local time appended, to avoid the
    // UTC conversion shifting it to the previous day in timezones ahead of
    // UTC.
    d = val.includes("T") ? new Date(val) : new Date(val + "T00:00:00");
  } else {
    d = new Date();
  }
  if (isNaN(d.getTime())) d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export function buildWorkLogSummary(form: any, number: string): string {
  const lines: string[] = [];
  lines.push(`יומן עבודה מס' ${number}`);
  lines.push(`תאריך: ${formatDMY(form.date)}`);

  if (form.isPrivate) {
    lines.push(`שירות פרטי: ${form.privateClientName || "—"}`);
  } else {
    lines.push(`חברה: ${form.company || "—"}`);
    lines.push(`פרויקט: ${form.project || "—"}`);
  }

  lines.push(`מנהל עבודה: ${form.manager || "—"}`);
  lines.push(`ראש צוות: ${form.teamLead || "—"}`);
  lines.push(`סוג יום: ${form.dayType === "half" ? "חצי יום" : "יום מלא"}`);

  if (form.workDesc) lines.push(`תיאור עבודה: ${form.workDesc}`);

  return lines.join("\n");
}

export function buildWorkLogWhatsAppMessage(form: any, number: string): string {
  const who = form.isPrivate
    ? (form.privateClientName || "לקוח פרטי")
    : ` ${form.project || "—"}/${form.company || "—"} `;
  const dayTypeText = form.dayType === "half" ? "יום עבודה חצי יום" : "יום עבודה מלא";

  let msg = `שלום, מצורף יומן עבודה מס' ${number} עבור ${form.isPrivate ? "" : "פרויקט "}${who} ` +
    `מתאריך ${formatDMY(form.date)}. ראש צוות: ${form.teamLead || "—"}, ${dayTypeText}.`;

  return msg;
}

export function buildWorkLogEmailSubject(form: any, number: string): string {
  const who = form.isPrivate ? (form.privateClientName || "לקוח פרטי") : (form.company || "חברה");
  return `יומן עבודה מס' ${number} — ${who} — ${formatDMY(form.date)}`;
}