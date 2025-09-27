import { useEffect, useMemo, useState, useCallback } from "react";
import { Company, Project, ReportResponse } from "../types";
import {
  fetchCompanies, fetchProjects,
  fetchReportCompanyProjectDays, fetchReportBlob
} from "../api/adminApi";
import { API } from "../constants";

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export function useReports(headers: Record<string,string>) {
  // filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // selects (IDs)
  const [companyId, setCompanyId] = useState("");
  const [projectId, setProjectId] = useState("");

  // options
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // report
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // load companies once
  useEffect(() => {
    fetchCompanies(headers)
      .then(setCompanies)
      .catch(() => {});
  }, [headers]);

  // load projects when company changes (and also keep an allProjects cache)
  useEffect(() => {
    fetchProjects(headers, companyId || undefined)
      .then((items) => {
        setProjects(items);
        if (!companyId) setAllProjects(items);
      })
      .catch(() => {});
  }, [headers, companyId]);

  // reset project when company changes
  useEffect(() => setProjectId(""), [companyId]);

  // resolve selected names for server (backend filters by NAME)
  const selectedCompanyName = useMemo(
    () => companies.find((c) => c.id === companyId)?.name || "",
    [companies, companyId]
  );

  const selectedProjectList = useMemo(
    () => (companyId ? projects : (allProjects.length ? allProjects : projects)),
    [companyId, projects, allProjects]
  );

  const selectedProjectName = useMemo(
    () => selectedProjectList.find((p) => p.id === projectId)?.name || "",
    [selectedProjectList, projectId]
  );

  const baseReportUrl = `${API}/admin/reports/company-project-days`;

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const json = await fetchReportCompanyProjectDays(headers, baseReportUrl, {
        from: from || undefined,
        to: to || undefined,
        companyName: selectedCompanyName || undefined,
        projectName: selectedProjectName || undefined,
      });
      setReport(json || { rows: [] });
    } catch {
      setErr("שגיאה בטעינת הדוח");
      setReport({ rows: [] });
    } finally {
      setLoading(false);
    }
  }, [headers, baseReportUrl, from, to, selectedCompanyName, selectedProjectName]);

  const openJson = useCallback(async () => {
    try {
      const blob = await fetchReportBlob(headers, baseReportUrl, {
        from: from || undefined,
        to: to || undefined,
        companyName: selectedCompanyName || undefined,
        projectName: selectedProjectName || undefined,
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("שגיאה בטעינת הדוח");
    }
  }, [headers, baseReportUrl, from, to, selectedCompanyName, selectedProjectName]);

const downloadXlsx = useCallback(async () => {
  try {
    const blob = await fetchReportBlob(headers, baseReportUrl, {
      from: from || undefined,
      to: to || undefined,
      companyName: selectedCompanyName || undefined,
      projectName: selectedProjectName || undefined,
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
      uniqueDays: "ימי עבודה ייחודיים",
      fullCount: "ימים מלאים",
      halfCount: "חצאי ימים",
      logsTotal: "סה\"כ דיווחים",
    };
    if (aoa.length > 0) aoa[0] = aoa[0].map(h => HEADERS_MAP[String(h)] ?? h);

    // build XLSX with ExcelJS (RTL!)
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("דוח", { views: [{ rightToLeft: true }] });

    
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
    // download
    const buf = await wb.xlsx.writeBuffer();
    const out = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = "דוח-חברה-פרויקט-ימים.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    console.error(e);
    alert("שגיאה בייצוא XLSX");
  }
}, [headers, baseReportUrl, from, to, selectedCompanyName, selectedProjectName]);

  return {
    // options + selected IDs
    companies, projects, allProjects,
    companyId, setCompanyId,
    projectId, setProjectId,

    // filters
    from, setFrom, to, setTo,

    // report
    report, loading, err, setErr,

    // actions
    loadReport, openJson, downloadXlsx,
  };
}
