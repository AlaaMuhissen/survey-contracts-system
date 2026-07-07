import React, { useEffect, useMemo ,useState} from "react";
import { useCatalog } from "../hooks/useCatalog";
import CompanyList from "../components/CompanyList";
import ProjectManager from "../components/ProjectManager";
import AsyncButton from "../components/AsyncButton";
import { useNavigate, useParams } from "react-router-dom";
import { updateCompany } from "../api/adminApi";

export default function AdminCatalogPage() {
  const adminKey = localStorage.getItem("adminToken") || "";
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const headers = useMemo(() => ({ "authorization": `Bearer ${adminKey}`, "Content-Type": "application/json" }), [adminKey]);
  const nav = useNavigate();



  const {
    companies, projects,
    newCompany, setNewCompany,
    newCompanyNumber, setNewCompanyNumber,
    newContactPerson, setNewContactPerson,
    newContactEmail, setNewContactEmail,
    newContactPhone, setNewContactPhone,
    newProject, setNewProject,
    projectCompany, setProjectCompany,
    newCost, setNewCost,
    newAddress, setNewAddress,
    errors, setErrors,
    validateCompanyForm,
    addCompany, addProject,
    removeCompany, removeProject, loadCompanies , onUpdateProject,
    

  } = useCatalog(surveyId, headers);

  const hasKey = Boolean(adminKey.trim());
  console.log("hasKey:", hasKey);
  useEffect(() => {
    if (!hasKey) {
      nav("/");
    }
  }, [hasKey]);

  const inputClass = (key: string) =>
  `w-full min-w-0 border rounded-xl px-3 py-2 bg-white overflow-hidden text-ellipsis whitespace-nowrap
   focus:outline-none focus:ring-2 focus:ring-black/10
   ${errors[key] ? "border-red-500" : ""}`;


   const canSubmit =
      newCompany.trim() &&
      newCompanyNumber.trim() &&
      newContactPerson.trim() &&
      newContactEmail.trim() &&
      newContactPhone.trim();

   const onSubmitCompany = async () => {
          if (!validateCompanyForm()) return;

          // ✅ continue your add logic here
          await addCompany();

          // ✅ reset after success
          setNewCompany("");
          setNewCompanyNumber("");
          setNewContactPerson("");
          setNewContactEmail("");
          setNewContactPhone("");
          setErrors({});
        };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white " dir="rtl">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">ניהול קטלוג</h1>
            <p className="text-sm text-neutral-500">חברות ופרויקטים • הוספה, מחיקה וניהול</p>
          </div>
          <a className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
                bg-white  backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white"
             href="/admin">
            <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 18l-6-6 6-6"/></svg>
            חזרה ללוח
          </a>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Add company card */}
            <section className="lg:col-span-2 rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-black/80">
                <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h18M5 7V5h6l2 2h6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
                הוסף חברה
              </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2" dir="rtl">
            {/* Row 1: full width */}
            <div className="md:col-span-2">
              <label className="block text-xs text-neutral-600 mb-1">שם חברה</label>
              <input
                className={inputClass("newCompany")}
                placeholder="לדוגמה: ABC הנדסה"
                value={newCompany}
                onChange={(e) => {
                  setNewCompany(e.target.value);
                  if (errors.newCompany) setErrors(s => ({ ...s, newCompany: "" }));
                }}
                required
              />
              {errors.newCompany && <p className="text-xs text-red-600 mt-1">{errors.newCompany}</p>}

            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-xs text-neutral-600 mb-1">ח״פ / מספר חברה</label>
              <input
                className={inputClass("newCompanyNumber")}
                placeholder="לדוגמה: 512345687778"
                value={newCompanyNumber}
                onChange={(e) => {
                  setNewCompanyNumber(e.target.value);
                  if (errors.newCompanyNumber) setErrors(s => ({ ...s, newCompanyNumber: "" }));
                }}
                inputMode="numeric"
                required
              />
              {errors.newCompanyNumber && <p className="text-xs text-red-600 mt-1">{errors.newCompanyNumber}</p>}

            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">איש קשר</label>
              <input
                className={inputClass("newContactPerson")}
                placeholder="שם מלא"
                value={newContactPerson}
                onChange={(e) => {
                  setNewContactPerson(e.target.value);
                  if (errors.newContactPerson) setErrors(s => ({ ...s, newContactPerson: "" }));
                }}
                required
              />
              {errors.newContactPerson && <p className="text-xs text-red-600 mt-1">{errors.newContactPerson}</p>}

            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-xs text-neutral-600 mb-1">אימייל</label>
              <input
                className={inputClass("newContactEmail")}
                placeholder="name@company.com"
                value={newContactEmail}
                onChange={(e) => {
                  setNewContactEmail(e.target.value);
                  if (errors.newContactEmail) setErrors(s => ({ ...s, newContactEmail: "" }));
                }}
                type="email"
                required
              />
              {errors.newContactEmail && <p className="text-xs text-red-600 mt-1">{errors.newContactEmail}</p>}

            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">טלפון</label>
              <input
                className={inputClass("newContactPhone")}
                placeholder="05X-XXXXXXX"
                value={newContactPhone}
                onChange={(e) => {
                  setNewContactPhone(e.target.value);
                  if (errors.newContactPhone) setErrors(s => ({ ...s, newContactPhone: "" }));
                }}
                inputMode="tel"
                required
              />
              {errors.newContactPhone && <p className="text-xs text-red-600 mt-1">{errors.newContactPhone}</p>}


            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="text-sm underline text-neutral-600 hover:text-neutral-900"
                onClick={() => {
                  setNewCompany("");
                  setNewCompanyNumber("");
                  setNewContactPerson("");
                  setNewContactEmail("");
                  setNewContactPhone("");
                }}
              >
                ניקוי
              </button>

              <AsyncButton
                onClick={onSubmitCompany} disabled={!canSubmit}>
              
                הוסף חברה
              </AsyncButton>
            </div>
          </div>

            </section>

            {/* Companies list */}
            <section className="lg:col-span-3">
              <CompanyList companies={companies} onDelete={removeCompany}   onUpdate={async (id, patch) => {
                    await updateCompany(surveyId, id, headers, patch);
                    await loadCompanies(); // refresh list
                  }} />
            </section>

            {/* Projects manager spans full width */}
            <section className="lg:col-span-5">
            {companies.length !== 0 && (
              
      
              <ProjectManager
                companies={companies}
                projects={projects}
                projectCompany={projectCompany}
                setProjectCompany={setProjectCompany}
                newProject={newProject}
                setNewProject={setNewProject}

                newCost={newCost}
                setNewCost={setNewCost}

                newAddress={newAddress}
                setNewAddress={setNewAddress}

                onAddProject={addProject}
                onDeleteProject={removeProject}
                onUpdateProject={onUpdateProject}
              />
         )}
            </section>
          </div>
      
      </div>
    </div>
  );
}
