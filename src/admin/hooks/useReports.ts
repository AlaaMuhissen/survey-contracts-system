import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Company, Project, PrivateClient, ReportResponse } from "../types";
import {
  fetchCompanies, fetchProjects,
  fetchReportCompanyProjectDays, fetchReportBlob,
  getPrivateClients,
} from "../api/adminApi";
import { API } from "../constants";

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

const PRIVATE_LABEL = "שירות פרטי";

// Local-date formatting (avoid toISOString() here — it converts to UTC
// first, which can shift the date by one day depending on timezone/time
// of day, e.g. right after local midnight in timezones ahead of UTC).
function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfThisMonth() {
  const d = new Date();
  return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function today() {
  return formatLocalDate(new Date());
}

export function useReports(headers: Record<string,string> ,surveyId: string) {
  // filters
 const [from, setFrom] = useState(() => firstOfThisMonth());
const [to, setTo] = useState(() => today());

  // Tree/checklist selections. Empty means "no filter" — the report shows
  // everything, matching the standard convention (nothing checked = all).
  // checkedCompanyIds holds companies whose master checkbox is fully
  // checked — sent as an independent OR'd filter so a company match always
  // includes projects added later, not just whatever existed at selection
  // time. checkedProjectIds holds every individually-checked project,
  // whether picked one at a time or via a company's cascade.
  const [checkedCompanyIds, setCheckedCompanyIds] = useState<string[]>([]);
  const [checkedProjectIds, setCheckedProjectIds] = useState<string[]>([]);
  const [checkedPrivateClientIds, setCheckedPrivateClientIds] = useState<string[]>([]);

  // options
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [privateClients, setPrivateClients] = useState<PrivateClient[]>([]);

  // report
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const adminKey = localStorage.getItem("adminToken") || "";
  const hasKey = Boolean(adminKey.trim());

  // load companies once, default to all-selected — admin unchecks what
  // they don't want, rather than starting from nothing
  const companiesInitRef = useRef(false);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  useEffect(() => {
    if(!hasKey) return;
    fetchCompanies(headers , surveyId)
      .then((items) => {
        setCompanies(items);
        if (!companiesInitRef.current && items.length) {
          companiesInitRef.current = true;
          setCheckedCompanyIds(items.map((c) => c.id));
        }
      })
      .catch(() => {})
      .finally(() => setCompaniesLoaded(true));
  }, [headers , surveyId]);

  // load ALL projects once (survey-wide), default to all-selected
  const projectsInitRef = useRef(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  useEffect(() => {
    if (!hasKey) return;
    fetchProjects(headers, undefined, surveyId)
      .then((items) => {
        setAllProjects(items);
        if (!projectsInitRef.current && items.length) {
          projectsInitRef.current = true;
          setCheckedProjectIds(items.map((p) => p.id));
        }
      })
      .catch(() => {})
      .finally(() => setProjectsLoaded(true));
  }, [headers, surveyId]);

  // load private clients once, default to all-selected
  const privateClientsInitRef = useRef(false);
  const [privateClientsLoaded, setPrivateClientsLoaded] = useState(false);
  useEffect(() => {
    if (!hasKey) return;
    getPrivateClients(surveyId, headers)
      .then((items) => {
        setPrivateClients(items);
        if (!privateClientsInitRef.current && items.length) {
          privateClientsInitRef.current = true;
          setCheckedPrivateClientIds(items.map((c) => c.id));
        }
      })
      .catch(() => {})
      .finally(() => setPrivateClientsLoaded(true));
  }, [headers, surveyId]);

  // gates the auto-refresh below — prevents a section that hasn't finished
  // loading yet from briefly acting like "explicitly selected nothing" and
  // hiding real rows for a moment
  const optionsReady = companiesLoaded && projectsLoaded && privateClientsLoaded;

  const projectsByCompany = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of allProjects) {
      const list = map.get(p.companyId) || [];
      list.push(p);
      map.set(p.companyId, list);
    }
    return map;
  }, [allProjects]);

  const companyState = useCallback((companyId: string): "all" | "some" | "none" => {
    const projectIds = (projectsByCompany.get(companyId) || []).map((p) => p.id);
    if (projectIds.length === 0) return checkedCompanyIds.includes(companyId) ? "all" : "none";
    const checkedCount = projectIds.filter((id) => checkedProjectIds.includes(id)).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === projectIds.length) return "all";
    return "some";
  }, [projectsByCompany, checkedProjectIds, checkedCompanyIds]);

  const toggleCompany = useCallback((companyId: string) => {
    const projectIds = (projectsByCompany.get(companyId) || []).map((p) => p.id);
    const state = companyState(companyId);
    if (state === "all") {
      setCheckedCompanyIds((s) => s.filter((id) => id !== companyId));
      setCheckedProjectIds((s) => s.filter((id) => !projectIds.includes(id)));
    } else {
      setCheckedCompanyIds((s) => (s.includes(companyId) ? s : [...s, companyId]));
      setCheckedProjectIds((s) => Array.from(new Set([...s, ...projectIds])));
    }
  }, [projectsByCompany, companyState]);

  const toggleProject = useCallback((companyId: string, projectId: string) => {
    setCheckedProjectIds((s) => {
      const next = s.includes(projectId) ? s.filter((id) => id !== projectId) : [...s, projectId];
      const projectIds = (projectsByCompany.get(companyId) || []).map((p) => p.id);
      const allChecked = projectIds.length > 0 && projectIds.every((id) => next.includes(id));
      setCheckedCompanyIds((cs) => {
        if (allChecked) return cs.includes(companyId) ? cs : [...cs, companyId];
        return cs.filter((id) => id !== companyId);
      });
      return next;
    });
  }, [projectsByCompany]);

  // master toggle: if literally everything is checked, clear it all;
  // otherwise check every company and every project
  const masterCompanyState = useMemo<"all" | "some" | "none">(() => {
    if (allProjects.length === 0) return "none";
    if (checkedProjectIds.length === 0) return "none";
    if (checkedProjectIds.length === allProjects.length) return "all";
    return "some";
  }, [allProjects, checkedProjectIds]);

  const toggleAllCompanies = useCallback(() => {
    if (masterCompanyState === "all") {
      setCheckedCompanyIds([]);
      setCheckedProjectIds([]);
    } else {
      setCheckedCompanyIds(companies.map((c) => c.id));
      setCheckedProjectIds(allProjects.map((p) => p.id));
    }
  }, [masterCompanyState, companies, allProjects]);

  const togglePrivateClient = useCallback((id: string) => {
    setCheckedPrivateClientIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }, []);

  const masterPrivateState = useMemo<"all" | "some" | "none">(() => {
    if (privateClients.length === 0) return "none";
    if (checkedPrivateClientIds.length === 0) return "none";
    if (checkedPrivateClientIds.length === privateClients.length) return "all";
    return "some";
  }, [privateClients, checkedPrivateClientIds]);

  const toggleAllPrivateClients = useCallback(() => {
    if (masterPrivateState === "all") setCheckedPrivateClientIds([]);
    else setCheckedPrivateClientIds(privateClients.map((c) => c.id));
  }, [masterPrivateState, privateClients]);

  const baseReportUrl = `${API}/surveys/${surveyId}/reports/company-project-days`;

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const json = await fetchReportCompanyProjectDays(headers, baseReportUrl, {
        from: from || undefined,
        to: to || undefined,
        companyIds: checkedCompanyIds,
        projectIds: checkedProjectIds,
        privateClientIds: checkedPrivateClientIds,
      });
      setReport(json || { rows: [] });
    } catch {
      setErr("שגיאה בטעינת הדוח");
      setReport({ rows: [] });
    } finally {
      setLoading(false);
    }
  }, [headers, baseReportUrl, from, to, checkedCompanyIds, checkedProjectIds, checkedPrivateClientIds]);

  // Auto-refresh: the table stays in sync with whatever is currently
  // checked, rather than requiring a manual click after every change.
  // Debounced so rapidly ticking several checkboxes doesn't fire a request
  // per click. Gated on optionsReady so it doesn't fire mid-load, when a
  // not-yet-loaded section would look like "explicitly selected nothing".
  useEffect(() => {
    if (!optionsReady) return;
    const t = setTimeout(() => { loadReport(); }, 350);
    return () => clearTimeout(t);
  }, [optionsReady, loadReport]);

  const openJson = useCallback(async () => {
    try {
      const blob = await fetchReportBlob(headers, baseReportUrl, {
        from: from || undefined,
        to: to || undefined,
        companyIds: checkedCompanyIds,
        projectIds: checkedProjectIds,
        privateClientIds: checkedPrivateClientIds,
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("שגיאה בטעינת הדוח");
    }
  }, [headers, baseReportUrl, from, to, checkedCompanyIds, checkedProjectIds, checkedPrivateClientIds]);

const downloadXlsx = useCallback(async () => {
  try {
    const blob = await fetchReportBlob(headers, baseReportUrl, {
      from: from || undefined,
      to: to || undefined,
      companyIds: checkedCompanyIds,
      projectIds: checkedProjectIds,
      privateClientIds: checkedPrivateClientIds,
      format: "csv",
    });

    // parse CSV → AOA with SheetJS
    let csv = await blob.text();
    if (csv.startsWith("sep=")) csv = csv.slice(csv.indexOf("\n") + 1);
    const wbFromCsv = XLSX.read(csv, { type: "string" });
    const wsFromCsv = wbFromCsv.Sheets[wbFromCsv.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(wsFromCsv, { header: 1, raw: true }) as any[][];

    // map headers
    const HEADERS_MAP: Record<string, string> = {
      company: "חברה",
      project: "פרויקט",
      projectCost: "מחיר",
      fullCount: "ימים מלאים",
      halfCount: "חצאי ימים",
      logsTotal: "סה\"כ דיווחים",
      totalCost: "מחיר כללי"
    };
    if (aoa.length > 0) aoa[0] = aoa[0].map(h => HEADERS_MAP[String(h)] ?? h);

    // build XLSX with ExcelJS (RTL!)
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("דוח", { views: [{ rightToLeft: true }] });
    const safe = (s?: string) =>
    (s || "")
      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s_-]/g, "") // keep Hebrew + EN
      .replace(/\s+/g, "-")
      .trim();

    
    const colCount = Math.max(...aoa.map(r => r.length));
    ws.columns = Array.from({ length: colCount }, () => ({
      width: 22,
      alignment: { horizontal: "right" },
    }));

    // write rows
    aoa.forEach((row, i) => {
      const r = ws.addRow(row);
      if (i === 0) r.font = { bold: true };
    });
    const header = ws.getRow(1);
  header.height = 24;
  header.alignment = { horizontal: "center", vertical: "middle" };
  header.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white text

  header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F497D" },  // background color
      };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });

    // (optional) freeze and add filter
    ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 1 }];
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to:   { row: 1, column: Math.max(...aoa.map(r => r.length)) },
    };

    const companyNames = checkedCompanyIds
      .map((id) => companies.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];
    const privateNames = checkedPrivateClientIds
      .map((id) => privateClients.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const companyPart = companyNames.length ? `חברות-${safe(companyNames.join("_"))}` : "";
    const privatePart = privateNames.length ? `${safe(PRIVATE_LABEL)}-${safe(privateNames.join("_"))}` : "";
    const allPart = (!companyPart && !privatePart) ? "כל-הנתונים" : "";

  const datePart =
    from || to
      ? `${from || "התחלה"}_עד_${to || "היום"}`
      : "";

  const fileName = [
    "דוח",
    companyPart,
    privatePart,
    allPart,
    datePart,
  ]
    .filter(Boolean)
    .join("-") + ".xlsx";


      // download
      const buf = await wb.xlsx.writeBuffer();
      const out = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
      alert("שגיאה בייצוא XLSX");
    }
  }, [headers, baseReportUrl, from, to, checkedCompanyIds, checkedProjectIds, checkedPrivateClientIds, companies, privateClients]);

  return {
    // options
    companies, allProjects, projectsByCompany, privateClients,

    // company/project tree
    checkedCompanyIds, checkedProjectIds,
    companyState, toggleCompany, toggleProject,
    masterCompanyState, toggleAllCompanies,

    // private clients
    checkedPrivateClientIds, togglePrivateClient,
    masterPrivateState, toggleAllPrivateClients,

    // filters
    from, setFrom, to, setTo,

    // report
    report, loading, err, setErr,

    // actions
    loadReport, openJson, downloadXlsx,
  };
}