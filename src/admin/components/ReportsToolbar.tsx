import React from "react";
import { Company, Project, PrivateClient } from "../types";
import AsyncButton from "./AsyncButton";
import CompanyProjectTree from "./Companyprojecttree";
import PrivateClientChecklist from "./Privateclientchecklist";


export default function ReportsToolbar({
  companies, projectsByCompany, privateClients,
  checkedCompanyIds, checkedProjectIds,
  companyState, toggleCompany, toggleProject,
  masterCompanyState, toggleAllCompanies,
  checkedPrivateClientIds, togglePrivateClient,
  masterPrivateState, toggleAllPrivateClients,
  from, setFrom, to, setTo,
  onLoad, onOpenJson, onDownloadXlsx, loading,
}: {
  companies: Company[];
  projectsByCompany: Map<string, Project[]>;
  privateClients: PrivateClient[];
  checkedCompanyIds: string[];
  checkedProjectIds: string[];
  companyState: (companyId: string) => "all" | "some" | "none";
  toggleCompany: (companyId: string) => void;
  toggleProject: (companyId: string, projectId: string) => void;
  masterCompanyState: "all" | "some" | "none";
  toggleAllCompanies: () => void;
  checkedPrivateClientIds: string[];
  togglePrivateClient: (id: string) => void;
  masterPrivateState: "all" | "some" | "none";
  toggleAllPrivateClients: () => void;
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  onLoad: () => void;
  onOpenJson: () => void;
  onDownloadXlsx: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="mb-4 flex flex-col gap-3
                 sticky top-0 z-10 bg-white/80 backdrop-blur background-gradient-to-b from-indigo-50 to-white
                 rounded-xl p-3 border"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CompanyProjectTree
          companies={companies}
          projectsByCompany={projectsByCompany}
          companyState={companyState}
          toggleCompany={toggleCompany}
          toggleProject={toggleProject}
          checkedProjectIds={checkedProjectIds}
          masterState={masterCompanyState}
          toggleAll={toggleAllCompanies}
        />

        <PrivateClientChecklist
          privateClients={privateClients}
          checkedIds={checkedPrivateClientIds}
          onToggle={togglePrivateClient}
          masterState={masterPrivateState}
          toggleAll={toggleAllPrivateClients}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs mb-1 text-neutral-600">מתאריך</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-full text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-neutral-600">עד תאריך</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-full text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="flex gap-2 md:col-span-2">
          <button
            className="rounded-lg border px-3 py-2 grow inline-flex items-center justify-center gap-2 text-sm
                  bg-white backdrop-blur shadow-sm
                  transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                  text-black/80 hover:bg-black/80 hover:text-white"
            onClick={onLoad}
            disabled={loading}
          >
            {loading ? "טוען..." : "הצג בטבלה"}
          </button>
          <AsyncButton
            className="rounded-lg border px-3 py-2 grow inline-flex items-center justify-center gap-2 text-sm
                  bg-white  backdrop-blur shadow-sm
                  transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                  text-black/80 hover:bg-black/80 hover:text-white"
            onClick={onDownloadXlsx}
          >
            הורד
          </AsyncButton>
        </div>
      </div>
    </div>
  );
}