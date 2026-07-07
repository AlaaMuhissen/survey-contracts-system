import React, { use, useEffect, useMemo, useState } from "react";
import AsyncButton from "./components/AsyncButton";
import { useNavigate, useParams } from "react-router-dom";
import { Company, Project } from "./types";
const API = (import.meta as any).env?.VITE_BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";



export default function AdminCatalogPage() {
  const adminKey = localStorage.getItem("adminToken") || "";
  const hasKey = Boolean(adminKey.trim());
  const nav = useNavigate();
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const headers = useMemo(() => ({ "authorization": `Bearer ${adminKey}`, "Content-Type": "application/json" }), [adminKey]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [newCompany, setNewCompany] = useState("");
  const [newProject, setNewProject] = useState("");
  const [projectCompany, setProjectCompany] = useState<string>("");
 
  const [newCompanyNumber, setNewCompanyNumber] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");


  const loadCompanies = async () => {
    const res = await fetch(`${API}/surveys/${surveyId}/companies`, { headers });
    const data = await res.json();
    setCompanies(data.items?.map((c:any)=>({ id:c.id, name:c.name })) || []);
    if (!projectCompany && data.items?.length) setProjectCompany(data.items[0].id);
  };

    const loadProjects = async () => {
    // fetch ALL projects
    const res = await fetch(`${API}/surveys/${surveyId}/projects`, { headers });
    const data = await res.json();
    setProjects(data.items || []);
    };

    // useEffect(() => { loadCompanies().catch(console.error); }, []);
    // useEffect(() => { loadProjects().catch(console.error); }, []);

  const addCompany = async () => {
    console.log("useCatalog", { surveyId, headers });
    const name = newCompany.trim();
    if (!name) return;
    const res = await fetch(`${API}/surveys/${surveyId}/companies`, { method: "POST", headers, body: JSON.stringify({ name, companyNumber: newCompanyNumber, contactPerson: newContactPerson, contactEmail: newContactEmail, contactPhone: newContactPhone }) });
    if (!res.ok) { alert("שגיאה ביצירת חברה"); return; }
    setNewCompany("");
    await loadCompanies();
  };

    const addProject = async () => {
    const name = newProject.trim();
    if (!name || !projectCompany) return;
    const res = await fetch(`${API}/surveys/${surveyId}/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, companyId: projectCompany }),
    });
    if (!res.ok) { alert("שגיאה ביצירת פרויקט"); return; }
    setNewProject("");
    await loadProjects(); // refresh ALL projects
    };

  const toggleProject = async (p: Project) => {
    const res = await fetch(`${API}/surveys/${surveyId}/projects/${p.id}`, { method: "PATCH", headers, body: JSON.stringify({ isActive: !p.isActive }) });
    if (!res.ok) return alert("שגיאה בעדכון");
    setProjects(s => s.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
  };

// after deleting a company
const delCompany = async (id: string) => {
  if (!window.confirm("למחוק חברה זו? ייתכן שקיימים פרויקטים המשוייכים אליה.")) return;
  const res = await fetch(`${API}/surveys/${surveyId}/companies/${id}`, { method: "DELETE", headers });
  if (!res.ok) return alert("שגיאה במחיקה");
  if (projectCompany === id) setProjectCompany("");
  await Promise.all([loadCompanies(), loadProjects()]); // refresh both lists
};

// after deleting a project
const delProject = async (id: string) => {
  if (!window.confirm("למחוק את הפרויקט?")) return;
  const res = await fetch(`${API}/surveys/${surveyId}/projects/${id}`, { method: "DELETE", headers });
  if (!res.ok) return alert("שגיאה במחיקה");
  await loadProjects(); // keep state in sync
};
const [viewCompany, setViewCompany] = useState<string>("");

   useEffect(() => {
    if (!hasKey) {
      nav("/");
    } 
  }, [hasKey]);

  return (
    <div className="mx-auto max-w-6xl p-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול קטלוג: חברות & פרויקטים</h1>
        <a className="underline text-sm" href="/admin">← חזרה ללוח</a>
      </div>

      {/* Add Company */}
      <section className="mb-6 p-4 border rounded-2xl bg-white">
        <h2 className="font-semibold mb-3">הוסף חברה</h2>
        <div className="flex gap-2">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <input
              className="border rounded px-3 py-2 md:col-span-2"
              placeholder="שם חברה"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder='ח"פ / מספר חברה'
              value={newCompanyNumber}
              onChange={(e) => setNewCompanyNumber(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="איש קשר"
              value={newContactPerson}
              onChange={(e) => setNewContactPerson(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="אימייל איש קשר"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="טלפון איש קשר"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
          </div>

          <div className="mt-2 flex gap-2">
            <AsyncButton
              className="border rounded px-3 py-2"
              onClick={addCompany}
  
            >
              הוסף חב
            </AsyncButton>

            <button
              className="text-xs underline text-neutral-600"
              onClick={() => {
                setNewCompany("");
                setNewCompanyNumber("");
                setNewContactPerson("");
                setNewContactEmail("");
                setNewContactPhone("");
              }}
              type="button"
            >
              ניקוי
            </button>
          </div>
     
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-right">
                <th className="p-2">חברה</th>
                <th className="p-2 w-24">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">
                    <button className="text-red-600 underline" onClick={()=>delCompany(c.id)}>מחק</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && <tr><td className="p-2 text-neutral-500" colSpan={2}>אין חברות</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      

      {/* Add Project */}
      {/* Add Project + All Projects */}
<section className="p-4 border rounded-2xl bg-white" dir="rtl">
  <h2 className="font-semibold mb-3">ניהול פרויקטים</h2>

  {/* Add Project row */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <select
        className="border rounded px-3 py-2"
        value={projectCompany}
        onChange={(e) => setProjectCompany(e.target.value)}
        >
        <option value="">כל החברות</option> {/* ← default = show all */}
        {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        </select>

   

    <input
      className="border rounded px-3 py-2"
      placeholder="שם פרויקט"
      value={newProject}
      onChange={(e) => setNewProject(e.target.value)}
    />

    <AsyncButton
      className="border rounded px-3 py-2"
      onClick={addProject}
      disabled={!projectCompany || !newProject.trim()}
    >
      הוסף
    </AsyncButton>
  </div>

  {/* Optional quick filter */}
  {/* <div className="mb-3">
    <input
      className="border rounded px-3 py-2 w-full"
      placeholder="סינון לפי שם פרויקט…"
      value={projectFilter}
      onChange={(e) => setProjectFilter(e.target.value)}
    />
  </div> */}


<div className="space-y-4">
  {(projectCompany ? companies.filter(co => co.id === projectCompany) : companies)
    .map((co) => {
      const list = projects.filter(p => p.companyId === co.id);
      return (
        <div key={co.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{co.name}</div>
            <div className="text-sm text-neutral-500">{list.length} פרויקטים</div>
          </div>

          {list.length === 0 ? (
            <div className="text-sm text-neutral-500">אין פרויקטים לחברה זו</div>
          ) : (
            <ul className="divide-y">
              {list.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <div className="truncate">{p.name}</div>
                  <div className="flex items-center gap-2">
                    <button className="text-red-600 underline" onClick={() => delProject(p.id)}>
                      מחק
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    })}
</div>


</section>

    </div>
  );
}
