import  { useState } from "react";
import { Company, Project } from "../types";
import AsyncButton from "./AsyncButton";

type EditableProjectFields = {
  name: string;
  cost: number;
  address: string;
};

export default function ProjectManager({
  companies,
  projects,
  projectCompany,
  setProjectCompany,
  newProject,
  setNewProject,
  newCost,
  setNewCost,
  newAddress,
  setNewAddress,
  onAddProject,
  onDeleteProject,

  onUpdateProject, 
}: {
  companies: Company[];
  projects: Project[];
  projectCompany: string;
  setProjectCompany: (v: string) => void;

  newProject: string;
  setNewProject: (v: string) => void;

  newCost: number;
  setNewCost: (v: number) => void;

  newAddress: string;
  setNewAddress: (v: string) => void;

  onAddProject: () => void;
  onDeleteProject: (id: string) => void;

  onUpdateProject: (id: string, patch: Partial<EditableProjectFields>) => Promise<void> | void; // ✅ NEW
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // local form state for editing
  const [edit, setEdit] = useState<EditableProjectFields>({
    name: "",
    cost: 1,
    address: "",
  });


  const visibleCompanies = projectCompany
    ? companies.filter((co) => co.id === projectCompany)
    : companies;

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEdit({
      name: p.name ?? "",
      cost: (p as any).cost ?? 1,
      address: (p as any).address ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({ name: "", cost: 1, address: "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await onUpdateProject(editingId, {
      name: edit.name.trim(),
      cost: Number(edit.cost) || 0,
      address: edit.address.trim(),
    });
    setEditingId(null);
  };
  
  return (
     
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white">

      <div className="space-y-4">
        {visibleCompanies.map((co) => {
          const list = projects.filter((p) => p.companyId === co.id);

          return (
            <div
              key={co.id}
              className="rounded-xl border bg-white/70 p-3 background-gradient-to-b from-indigo-50 to-white"
            >
              <div className="flex items-center justify-between mb-2 bg-black/80 h-12 px-3 rounded-lg py-8">
                            {/* ✅ Add project row */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <select
                    className="border rounded-lg px-3 py-2"
                    value={projectCompany}
                    onChange={(e) => setProjectCompany(e.target.value)}
                  >
                    <option value="">בחר חברה</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    className="border rounded-lg px-3 py-2"
                    placeholder="שם פרויקט"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                  />

                 <input
                      type="number"
                      className="border rounded-lg px-3 py-2"
                      placeholder="עלות (₪)"
                      value={newCost ?? 0}              // ✅ important
                      onChange={(e) => {
                        const v = e.target.value;
                        console.log("Setting new cost:", v);
                        setNewCost(Number(e.target.value || 0));

                      }}
/>

                  <input
                    className="border rounded-lg px-3 py-2"
                    placeholder="כתובת"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                  <AsyncButton
                    onClick={ () => {
                      console.log("Adding project:", { newProject, newCost, newAddress, projectCompany });
                      onAddProject();
                    }}
                    // disabled={!canAdd}}
                  >
                    הוסף
                  </AsyncButton>
                </div>
           
                <div className="text-xs text-neutral-200">{list.length} פרויקטים</div>
              </div>

              {list.length === 0 ? (
                <div className="text-sm text-neutral-500">אין פרויקטים לחברה זו</div>
              ) : (
                <ul className="divide-y max-h-60 overflow-y-auto">
                  {list.map((p) => {
                    const isEditing = editingId === p.id;

                    return (
                      <li
                        key={p.id}
                        className={`py-2 px-2 rounded-lg transition-colors ${
                          isEditing ? "bg-indigo-50" : "hover:bg-neutral-100 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isEditing) startEdit(p);
                        }}
                      >
                        {!isEditing ? (
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-black/80">{p.name}</div>
                              <div className="text-xs text-neutral-500 truncate">
                                {"cost" in p && (p as any).cost != null ? `₪${(p as any).cost}` : ""}
                                {"address" in p && (p as any).address ? ` • ${(p as any).address}` : ""}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs
                                           hover:bg-red-50 hover:border-red-200 text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm("למחוק את הפרויקט?")) onDeleteProject(p.id);
                                }}
                              >
                                מחק
                              </button>
                            </div>
                          </div>
                        ) : (
              
                          <div
                            className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                            onClick={(e) => e.stopPropagation()} 
                          >
                            <input
                              className="border rounded-lg px-3 py-2 sm:col-span-2"
                              value={edit.name}
                              onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
                              placeholder="שם פרויקט"
                              autoFocus
                            />
                            <input
                              className="border rounded-lg px-3 py-2"
                              value={edit.cost}
                              onChange={(e) => setEdit((s) => ({ ...s, cost: Number(e.target.value) }))}
                              placeholder="עלות (₪)"
                              type="number"
                            />
                            <input
                              className="border rounded-lg px-3 py-2 sm:col-span-2"
                              value={edit.address}
                              onChange={(e) => setEdit((s) => ({ ...s, address: e.target.value }))}
                              placeholder="כתובת"
                            />

                            <div className="flex gap-2 justify-end sm:col-span-1">
                              <AsyncButton onClick={saveEdit}>שמור</AsyncButton>
                              <button
                                className="border rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
                                onClick={cancelEdit}
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
