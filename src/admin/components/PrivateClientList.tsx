import { useState } from "react";
import { PrivateClient } from "../types";
import Modal from "./Modal";

export default function PrivateClientList({
  privateClients,
  onDelete,
  onUpdate,
}: {
  privateClients: PrivateClient[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PrivateClient>) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<PrivateClient | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const openEdit = (c: PrivateClient) => {
    setSelected(c);
    setName(c.name || "");
    setPrice(typeof c.price === "number" ? String(c.price) : "");
    setAddress(c.address || "");
    setPhone(c.phone || "");
    setEmail(c.email || "");
  };

  const closeEdit = () => {
    setSelected(null);
    setSaving(false);
  };

  const save = async () => {
    if (!selected) return;
    const trimmed = name.trim();
    if (!trimmed) return alert("שם לקוח הוא שדה חובה");

    const priceNum = price.trim() === "" ? undefined : Number(price);
    if (priceNum !== undefined && !Number.isFinite(priceNum)) {
      return alert("מחיר לא תקין");
    }

    setSaving(true);
    try {
      await onUpdate(selected.id, {
        name: trimmed,
        ...(priceNum !== undefined ? { price: priceNum } : {}),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      closeEdit();
    } catch (e) {
      console.error(e);
      alert("שגיאה בשמירה");
      setSaving(false);
    }
  };

  const fieldCls = "w-full min-w-0 border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300/60";

  return (
    <div dir="rtl">
      {privateClients.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white/60 py-12 text-center text-sm text-neutral-500">
          אין לקוחות פרטיים עדיין — לחצו על "הוסף לקוח" כדי להתחיל
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid grid-cols-1 gap-2 sm:hidden">
            {privateClients.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white p-3 active:bg-neutral-50" onClick={() => openEdit(c)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-black/80 truncate">{c.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 truncate" dir="ltr">
                      {c.phone || "—"}{c.email ? ` · ${c.email}` : ""}
                    </div>
                    {typeof c.price === "number" && (
                      <div className="text-xs text-neutral-400 mt-0.5">מחיר: {c.price}</div>
                    )}
                  </div>
                  <button
                    className="shrink-0 inline-flex items-center rounded-full border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("למחוק לקוח פרטי זה?")) onDelete(c.id);
                    }}
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="text-right bg-black/80">
                <tr>
                  <th className="p-2.5 font-medium text-white first:rounded-tr-xl">שם לקוח</th>
                  <th className="p-2.5 font-medium text-white">מחיר</th>
                  <th className="p-2.5 font-medium text-white">טלפון</th>
                  <th className="p-2.5 w-32 font-medium text-white last:rounded-tl-xl">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {privateClients.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => openEdit(c)}>
                    <td className="p-2.5 text-black/80 max-w-[240px] truncate">{c.name}</td>
                    <td className="p-2.5 text-black/80">{typeof c.price === "number" ? c.price : "—"}</td>
                    <td className="p-2.5 text-black/80" dir="ltr">{c.phone || "—"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-neutral-50"
                          onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                        >
                          ערוך
                        </button>
                        <button
                          className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-red-50 hover:border-red-200 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("למחוק לקוח פרטי זה?")) onDelete(c.id);
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={closeEdit}
        title="עריכת לקוח פרטי"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button className="text-sm underline text-neutral-600 py-2 sm:py-0" onClick={closeEdit} disabled={saving}>
              ביטול
            </button>
            <button
              className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-base sm:text-sm bg-black text-white hover:bg-black/85 disabled:opacity-50"
              onClick={save}
              disabled={saving || !name.trim()}
            >
              {saving ? "שומר..." : "שמור"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">שם לקוח</label>
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">מחיר</label>
            <input className={fieldCls} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">טלפון</label>
            <input className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">כתובת</label>
            <input className={fieldCls} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">אימייל</label>
            <input className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
          </div>
        </div>
      </Modal>
    </div>
  );
}