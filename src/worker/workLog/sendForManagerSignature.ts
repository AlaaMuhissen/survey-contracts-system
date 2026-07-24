export async function sendForManagerSignature(
  form: any,
  sigLead: any[],
  sigMeta: any,
  surveyId: string,
  API_BASE: string
): Promise<string> {
  const token = localStorage.getItem("workerToken");
  if (!token) throw new Error("no worker token");

  const res = await fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/pending-signatures`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ formSnapshot: form, sigLead, sigMeta }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

export function buildManagerSignLink(surveyId: string, token: string) {
  return `${window.location.origin}/${encodeURIComponent(surveyId)}/sign/${token}`;
}

export function openWhatsAppWithLink(link: string, message = "יומן עבודה ממתין לחתימתך:") {
  const text = encodeURIComponent(`${message}\n${link}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}