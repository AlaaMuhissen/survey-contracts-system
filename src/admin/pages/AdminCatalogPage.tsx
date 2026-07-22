import React, { useEffect, useMemo, useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import CompanyList from "../components/CompanyList";
import PrivateClientList from "../components/PrivateClientList";
import ProjectManager from "../components/ProjectManager";
import AsyncButton from "../components/AsyncButton";
import Modal from "../components/Modal";
import { useNavigate, useParams } from "react-router-dom";
import { updateCompany } from "../api/adminApi";

type TabId = "companies" | "projects" | "private";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "companies",
    label: "חברות",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 7h18M5 7V5h6l2 2h6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "פרויקטים",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 7l3-3h5l2 2h8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    id: "private",
    label: "לקוחות פרטיים",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function AdminCatalogPage() {
  const adminKey = localStorage.getItem("adminToken") || "";
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const headers = useMemo(() => ({ "authorization": `Bearer ${adminKey}`, "Content-Type": "application/json" }), [adminKey]);
  const nav = useNavigate();

  const [tab, setTab] = useState<TabId>("companies");
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addPrivateClientOpen, setAddPrivateClientOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);

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
    removeCompany, removeProject, loadCompanies, onUpdateProject,
    privateClients,
    newPrivateClientName, setNewPrivateClientName,
    newPrivateClientPrice, setNewPrivateClientPrice,
    newPrivateClientAddress, setNewPrivateClientAddress,
    newPrivateClientPhone, setNewPrivateClientPhone,
    newPrivateClientEmail, setNewPrivateClientEmail,
    addPrivateClient, onUpdatePrivateClient, removePrivateClient,
  } = useCatalog(surveyId, headers);

  const hasKey = Boolean(adminKey.trim());
  useEffect(() => {
    if (!hasKey) nav("/");
  }, [hasKey]);

  const inputClass = (key: string) =>
    `w-full min-w-0 border rounded-xl px-3 py-2.5 bg-white text-base whitespace-nowrap
     focus:outline-none focus:ring-2 focus:ring-indigo-300/60
     ${errors[key] ? "border-red-500" : ""}`;

  const canSubmitCompany =
    newCompany.trim() && newCompanyNumber.trim() && newContactPerson.trim() &&
    newContactEmail.trim() && newContactPhone.trim();

  const resetCompanyForm = () => {
    setNewCompany("");
    setNewCompanyNumber("");
    setNewContactPerson("");
    setNewContactEmail("");
    setNewContactPhone("");
    setErrors({});
  };

  const onSubmitCompany = async () => {
    if (!validateCompanyForm()) return;
    await addCompany();
    resetCompanyForm();
    setAddCompanyOpen(false);
  };

  const resetPrivateClientForm = () => {
    setNewPrivateClientName("");
    setNewPrivateClientPrice(0);
    setNewPrivateClientAddress("");
    setNewPrivateClientPhone("");
    setNewPrivateClientEmail("");
  };

  const onSubmitPrivateClient = async () => {
    await addPrivateClient();
    setAddPrivateClientOpen(false);
  };

  const resetProjectForm = () => {
    setNewProject("");
    setNewCost(0);
    setNewAddress("");
  };

  const onSubmitProject = async () => {
    await addProject();
    resetProjectForm();
    setAddProjectOpen(false);
  };

  const counts: Record<TabId, number> = {
    companies: companies.length,
    projects: projects.length,
    private: privateClients.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="mx-auto max-w-5xl p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-black">ניהול קטלוג</h1>
            <p className="text-xs sm:text-sm text-neutral-500">חברות, פרויקטים ולקוחות פרטיים</p>
          </div>
          <a
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm
                       bg-white shadow-sm transition
                       focus:outline-none focus:ring-2 focus:ring-indigo-300/60
                       text-black/80 hover:bg-black/80 hover:text-white shrink-0"
            href="/admin"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">חזרה ללוח</span>
          </a>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 mb-4 bg-gradient-to-b from-indigo-50/95 to-white/95 backdrop-blur">
          <div className="flex gap-2 border rounded-2xl bg-white/70 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition
                  ${tab === t.id ? "bg-black/85 text-white shadow-sm" : "text-black/70 hover:bg-neutral-100"}`}
              >
                <span className="opacity-80 shrink-0">{t.icon}</span>
                <span className="truncate min-w-0">{t.label}</span>
                <span className={`shrink-0 text-[10px] rounded-full px-1.5 ${tab === t.id ? "bg-white/20" : "bg-neutral-200 text-neutral-600"}`}>
                  {counts[t.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div className="rounded-2xl border bg-white/80 backdrop-blur p-3 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-black/80 text-sm sm:text-base">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
            <AsyncButton
              className="!bg-black !text-white hover:!bg-black/85 !border-black"
              onClick={async () => {
                if (tab === "companies") setAddCompanyOpen(true);
                else if (tab === "private") setAddPrivateClientOpen(true);
                else setAddProjectOpen(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              {tab === "companies" ? "הוסף חברה" : tab === "private" ? "הוסף לקוח" : "הוסף פרויקט"}
            </AsyncButton>
          </div>

          {tab === "companies" && (
            <CompanyList
              companies={companies}
              onDelete={removeCompany}
              onUpdate={async (id, patch) => {
                await updateCompany(surveyId, id, headers, patch);
                await loadCompanies();
              }}
            />
          )}

          {tab === "projects" && (
            companies.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white/60 py-12 text-center text-sm text-neutral-500">
                יש להוסיף חברה לפני הוספת פרויקטים
              </div>
            ) : (
              <ProjectManager
                companies={companies}
                projects={projects}
                onDeleteProject={removeProject}
                onUpdateProject={onUpdateProject}
              />
            )
          )}

          {tab === "private" && (
            <PrivateClientList
              privateClients={privateClients}
              onDelete={removePrivateClient}
              onUpdate={onUpdatePrivateClient}
            />
          )}
        </div>
      </div>

      {/* Add company modal */}
      <Modal
        open={addCompanyOpen}
        onClose={() => { setAddCompanyOpen(false); resetCompanyForm(); }}
        title="הוסף חברה"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              className="text-sm underline text-neutral-600 hover:text-neutral-900 py-2 sm:py-0"
              onClick={resetCompanyForm}
            >
              ניקוי
            </button>
            <AsyncButton className="w-full sm:w-auto justify-center" onClick={onSubmitCompany} disabled={!canSubmitCompany}>
              הוסף חברה
            </AsyncButton>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">שם חברה</label>
            <input
              className={inputClass("newCompany")}
              placeholder="לדוגמה: ABC הנדסה"
              value={newCompany}
              onChange={(e) => {
                setNewCompany(e.target.value);
                if (errors.newCompany) setErrors((s) => ({ ...s, newCompany: "" }));
              }}
              required
            />
            {errors.newCompany && <p className="text-xs text-red-600 mt-1">{errors.newCompany}</p>}
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">ח״פ / מספר חברה</label>
            <input
              className={inputClass("newCompanyNumber")}
              placeholder="לדוגמה: 512345687778"
              value={newCompanyNumber}
              onChange={(e) => {
                setNewCompanyNumber(e.target.value);
                if (errors.newCompanyNumber) setErrors((s) => ({ ...s, newCompanyNumber: "" }));
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
                if (errors.newContactPerson) setErrors((s) => ({ ...s, newContactPerson: "" }));
              }}
              required
            />
            {errors.newContactPerson && <p className="text-xs text-red-600 mt-1">{errors.newContactPerson}</p>}
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">אימייל</label>
            <input
              className={inputClass("newContactEmail")}
              placeholder="name@company.com"
              value={newContactEmail}
              onChange={(e) => {
                setNewContactEmail(e.target.value);
                if (errors.newContactEmail) setErrors((s) => ({ ...s, newContactEmail: "" }));
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
                if (errors.newContactPhone) setErrors((s) => ({ ...s, newContactPhone: "" }));
              }}
              inputMode="tel"
              required
            />
            {errors.newContactPhone && <p className="text-xs text-red-600 mt-1">{errors.newContactPhone}</p>}
          </div>
        </div>
      </Modal>

      {/* Add private client modal */}
      <Modal
        open={addPrivateClientOpen}
        onClose={() => { setAddPrivateClientOpen(false); resetPrivateClientForm(); }}
        title="הוסף לקוח פרטי"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              className="text-sm underline text-neutral-600 hover:text-neutral-900 py-2 sm:py-0"
              onClick={resetPrivateClientForm}
            >
              ניקוי
            </button>
            <AsyncButton className="w-full sm:w-auto justify-center" onClick={onSubmitPrivateClient} disabled={!newPrivateClientName.trim()}>
              הוסף לקוח
            </AsyncButton>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">שם לקוח</label>
            <input
              className={inputClass("newPrivateClientName")}
              placeholder="שם הלקוח"
              value={newPrivateClientName}
              onChange={(e) => setNewPrivateClientName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">מחיר (אופציונלי)</label>
            <input
              className={inputClass("newPrivateClientPrice")}
              placeholder="0"
              value={newPrivateClientPrice || ""}
              onChange={(e) => setNewPrivateClientPrice(Number(e.target.value) || 0)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">טלפון (אופציונלי)</label>
            <input
              className={inputClass("newPrivateClientPhone")}
              placeholder="מספר טלפון"
              value={newPrivateClientPhone}
              onChange={(e) => setNewPrivateClientPhone(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">כתובת (אופציונלי)</label>
            <input
              className={inputClass("newPrivateClientAddress")}
              placeholder="כתובת"
              value={newPrivateClientAddress}
              onChange={(e) => setNewPrivateClientAddress(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">אימייל (אופציונלי)</label>
            <input
              className={inputClass("newPrivateClientEmail")}
              placeholder="אימייל"
              value={newPrivateClientEmail}
              onChange={(e) => setNewPrivateClientEmail(e.target.value)}
              inputMode="email"
            />
          </div>
        </div>
      </Modal>

      {/* Add project modal */}
      <Modal
        open={addProjectOpen}
        onClose={() => { setAddProjectOpen(false); resetProjectForm(); }}
        title="הוסף פרויקט"
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              className="text-sm underline text-neutral-600 hover:text-neutral-900 py-2 sm:py-0"
              onClick={resetProjectForm}
            >
              ניקוי
            </button>
            <AsyncButton className="w-full sm:w-auto justify-center" onClick={onSubmitProject} disabled={!newProject.trim() || !projectCompany}>
              הוסף פרויקט
            </AsyncButton>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">חברה</label>
            <select
              className={inputClass("projectCompany")}
              value={projectCompany}
              onChange={(e) => setProjectCompany(e.target.value)}
            >
              <option value="">בחר חברה</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">שם פרויקט</label>
            <input
              className={inputClass("newProject")}
              placeholder="שם פרויקט"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">עלות (₪)</label>
            <input
              className={inputClass("newCost")}
              type="number"
              placeholder="0"
              value={newCost ?? 0}
              onChange={(e) => setNewCost(Number(e.target.value || 0))}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">כתובת</label>
            <input
              className={inputClass("newAddress")}
              placeholder="כתובת"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}