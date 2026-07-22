import { useState } from "react";
import { Company, Project } from "../types";
import Modal from "./Modal";

type EditableProjectFields = {
  name: string;
  cost: number;
  address: string;
};

export default function ProjectManager({
  companies,
  projects,
  onDeleteProject,
  onUpdateProject,
}: {
  companies: Company[];
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, patch: Partial<EditableProjectFields>) => Promise<void> | void;
}) {
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditableProjectFields>({ name: "", cost: 0, address: "" });

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name || "—";
  const visible = filterCompanyId ? projects.filter((p) => p.companyId === filterCompanyId) : projects;

  const startEdit = (p: Project) => {
    setEditing(p);
    setEdit({
      name: p.name ?? "",
      cost: (p as any).cost ?? 0,
      address: (p as any).address ?? "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setSaving(false);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await onUpdateProject(editing.id, {
        name: edit.name.trim(),
        cost: Number(edit.cost) || 0,
        address: edit.address.trim(),
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
      <div className="mb-3">
        <label className="block text-xs text-neutral-600 mb-1">סינון לפי חברה</label>
        <select
          className="border rounded-xl px-3 py-2.5 text-base w-full sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
          value={filterCompanyId}
          onChange={(e) => setFilterCompanyId(e.target.value)}
        >
          <option value="">כל החברות</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white/60 py-12 text-center text-sm text-neutral-500">
          אין פרויקטים להצגה
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid grid-cols-1 gap-2 sm:hidden">
            {visible.map((p) => (
              <div key={p.id} className="rounded-xl border bg-white p-3 active:bg-neutral-50" onClick={() => startEdit(p)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-black/80 truncate">{p.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 truncate">{companyName(p.companyId)}</div>
                    <div className="text-xs text-neutral-400 mt-0.5 truncate">
                      {(p as any).cost != null ? `₪${(p as any).cost}` : ""}
                      {(p as any).address ? ` · ${(p as any).address}` : ""}
                    </div>
                  </div>
                  <button
                    className="shrink-0 inline-flex items-center rounded-full border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("למחוק את הפרויקט?")) onDeleteProject(p.id);
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
                  <th className="p-2.5 font-medium text-white first:rounded-tr-xl">פרויקט</th>
                  <th className="p-2.5 font-medium text-white">חברה</th>
                  <th className="p-2.5 font-medium text-white">עלות</th>
                  <th className="p-2.5 font-medium text-white">כתובת</th>
                  <th className="p-2.5 w-32 font-medium text-white last:rounded-tl-xl">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {visible.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => startEdit(p)}>
                    <td className="p-2.5 text-black/80 max-w-[220px] truncate">{p.name}</td>
                    <td className="p-2.5 text-black/80">{companyName(p.companyId)}</td>
                    <td className="p-2.5 text-black/80">{(p as any).cost != null ? `₪${(p as any).cost}` : "—"}</td>
                    <td className="p-2.5 text-black/80 max-w-[200px] truncate">{(p as any).address || "—"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-neutral-50"
                          onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                        >
                          ערוך
                        </button>
                        <button
                          className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-red-50 hover:border-red-200 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("למחוק את הפרויקט?")) onDeleteProject(p.id);
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
        open={!!editing}
        onClose={closeEdit}
        title="עריכת פרויקט"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button className="text-sm underline text-neutral-600 py-2 sm:py-0" onClick={closeEdit} disabled={saving}>
              ביטול
            </button>
            <button
              className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-base sm:text-sm bg-black text-white hover:bg-black/85 disabled:opacity-50"
              onClick={save}
              disabled={saving || !edit.name.trim()}
            >
              {saving ? "שומר..." : "שמור"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">שם פרויקט</label>
            <input className={fieldCls} value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">עלות (₪)</label>
            <input className={fieldCls} type="number" value={edit.cost} onChange={(e) => setEdit((s) => ({ ...s, cost: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">כתובת</label>
            <input className={fieldCls} value={edit.address} onChange={(e) => setEdit((s) => ({ ...s, address: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}