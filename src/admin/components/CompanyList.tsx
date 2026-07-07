import { useState } from "react";
import { Company } from "../types";

export default function CompanyList({
  companies,
  onDelete,
  onUpdate,
}: {
  companies: Company[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Company>) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const openEdit = (c: Company) => {
    setSelected(c);
    setName(c.name || "");
    setCompanyNumber(c.companyNumber || "");
    setContactPerson(c.contactPerson || "");
    setContactEmail(c.contactEmail || "");
    setContactPhone(c.contactPhone || "");
    setOpen(true);
  };

  const closeEdit = () => {
    setOpen(false);
    setSelected(null);
    setSaving(false);
  };

  const save = async () => {
    if (!selected) return;
    const trimmed = name.trim();
    if (!trimmed) return alert("שם חברה הוא שדה חובה");

    setSaving(true);
    try {
      await onUpdate(selected.id, {
        name: trimmed,
        companyNumber: companyNumber.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });
      closeEdit();
    } catch (e) {
      console.error(e);
      alert("שגיאה בשמירה");
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="mb-3 flex items-center justify-between text-black/80">
        <h2 className="font-semibold flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 7h18M5 7V5h6l2 2h6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
          חברות
        </h2>
        <div className="text-xs text-neutral-500">{companies.length} רשומות</div>
      </div>

      <div className="border bg-white/60 max-h-80 overflow-y-auto rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="text-right sticky top-0 bg-black/80">
            <tr>
              <th className="p-2 font-medium text-white">שם חברה</th>
              <th className="p-2 font-medium text-white">ח״פ</th>
              <th className="p-2 font-medium text-white">איש קשר</th>
              <th className="p-2 w-40 font-medium text-white">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {companies.length ? (
              companies.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-neutral-100 transition-colors cursor-pointer"
                  onClick={() => openEdit(c)}
                  title="לחצי לעריכה"
                >
                  <td className="p-2 text-black/80">
                    <div className="max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {c.name}
                    </div>
                  </td>
                  <td className="p-2 text-black/80">
                    <div className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {c.companyNumber || "—"}
                    </div>
                  </td>
                  <td className="p-2 text-black/80">
                    <div className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {c.contactPhone || "—"}
                    </div>
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-2 justify-start">
                      <button
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs hover:bg-neutral-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                      >
                        ערוך
                      </button>

                      <button
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs
                                   hover:bg-red-50 hover:border-red-200 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("למחוק חברה זו? ייתכן שקיימים פרויקטים המשוייכים אליה.")) onDelete(c.id);
                        }}
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">
                  אין חברות עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative w-[95vw] max-w-2xl rounded-2xl bg-white shadow-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg">עריכת חברה</div>
              <button className="text-sm underline text-neutral-600" onClick={closeEdit}>
                סגור
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-neutral-600 mb-1">שם חברה</label>
                <input
                  className="w-full min-w-0 border rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">ח״פ / מספר חברה</label>
                <input
                  className="w-full min-w-0 border rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
                  value={companyNumber}
                  onChange={(e) => setCompanyNumber(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">איש קשר</label>
                <input
                  className="w-full min-w-0 border rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">אימייל</label>
                <input
                  className="w-full min-w-0 border rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  type="email"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-600 mb-1">טלפון</label>
                <input
                  className="w-full min-w-0 border rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="text-sm underline text-neutral-600" onClick={closeEdit} disabled={saving}>
                ביטול
              </button>

              <button
                className="rounded-xl px-4 py-2 text-sm bg-black text-white hover:bg-black/85 disabled:opacity-50"
                onClick={save}
                disabled={saving || !name.trim()}
              >
                {saving ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
