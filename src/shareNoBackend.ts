// src/utils/shareNoBackend.ts
export async function tryWebSharePdf(
  blob: Blob,
  filename: string,
  { title = "יומן עבודה", text = "מצורף PDF" }: { title?: string; text?: string } = {}
): Promise<boolean> {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as any;

  if (nav?.canShare?.({ files: [file] }) && nav?.share) {
    await nav.share({ files: [file], title, text });
    return true;
  }
  return false;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function openWhatsAppWithText(text: string, phoneE164?: string) {
  const base = phoneE164 ? `https://wa.me/${phoneE164}` : "https://wa.me";
  const href = `${base}?text=${encodeURIComponent(text)}`;
  window.open(href, "_blank");
}

export function openMailTo({
  to = "",
  subject = "",
  body = "",
}: {
  to?: string;
  subject?: string;
  body?: string;
}) {
  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;
  window.location.href = href;
}

export async function sendPdfViaWhatsAppNoBackend(
  blob: Blob,
  filename: string,
  opts?: { phoneE164?: string; messagePrefix?: string }
) {
  const messagePrefix = opts?.messagePrefix ?? "שלום, מצורף קובץ יומן העבודה.";
  const shared = await tryWebSharePdf(blob, filename, {
    title: "יומן עבודה",
    text: messagePrefix,
  });
  if (shared) return;

  // Fallback: download file locally and open WhatsApp with a note
  downloadBlob(blob, filename);
  const text =
    `${messagePrefix}\n\n` +
    `הקובץ נשמר במכשיר בשם: ${filename}\n` +
    `בבקשה צרף/י את הקובץ להודעה בוואטסאפ.`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
  openWhatsAppWithText(text, opts?.phoneE164);
}

export async function sendPdfViaEmailNoBackend(
  blob: Blob,
  filename: string,
  opts?: { to?: string; subject?: string; bodyPrefix?: string }
) {
  const subject = opts?.subject ?? "יומן עבודה (PDF)";
  const bodyPrefix = opts?.bodyPrefix ?? "שלום,\nמצורף קובץ יומן העבודה.";
  const shared = await tryWebSharePdf(blob, filename, {
    title: subject,
    text: bodyPrefix,
  });
  if (shared) return;

  // Fallback: download file + open mailto
  downloadBlob(blob, filename);
  const body =
    `${bodyPrefix}\n\n` +
    `הקובץ נשמר בשם: ${filename}\n` +
    `בבקשה צרף/י אותו כקובץ מצורף במייל.`;
  try {
    await navigator.clipboard.writeText(body);
  } catch {}
  openMailTo({ to: opts?.to ?? "", subject, body });
}
