import { useCallback, useEffect, useMemo, useState } from "react";
import { Company, Project } from "../types";
import {
  getCompanies, getProjects,
  createCompany, deleteCompany,
  createProject, deleteProject, patchProject,
} from "../api/adminApi";

export function useCatalog(headers: Record<string, string>) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // form state
  const [newCompany, setNewCompany] = useState("");
  const [newProject, setNewProject] = useState("");
  const [projectCompany, setProjectCompany] = useState<string>("");

  // load
  const loadCompanies = useCallback(async () => {
    const items = await getCompanies(headers);
    setCompanies(items);
    if (!projectCompany && items.length) setProjectCompany(items[0].id);
  }, [headers, projectCompany]);

  const loadProjects = useCallback(async () => {
    const items = await getProjects(headers);
    setProjects(items);
  }, [headers]);

  useEffect(() => { loadCompanies().catch(() => {}); }, [loadCompanies]);
  useEffect(() => { loadProjects().catch(() => {}); }, [loadProjects]);
  useEffect(() => {
    if (!headers["x-admin-key"]) return;        // ⟵ guard
    getCompanies(headers).then(setCompanies).catch(() => {});
    }, [headers]);

    useEffect(() => {
    if (!headers["x-admin-key"]) return;        // ⟵ guard
    getProjects(headers).then(setProjects).catch(() => {});
    }, [headers]);
  // actions
  const addCompany = useCallback(async () => {
    const name = newCompany.trim();
    if (!name) return;
    await createCompany(headers, name);
    setNewCompany("");
    await loadCompanies();
  }, [headers, newCompany, loadCompanies]);

  const addProject = useCallback(async () => {
    const name = newProject.trim();
    if (!name || !projectCompany) return;
    await createProject(headers, { name, companyId: projectCompany });
    setNewProject("");
    await loadProjects();
  }, [headers, newProject, projectCompany, loadProjects]);

  const toggleProject = useCallback(async (p: Project) => {
    await patchProject(headers, p.id, { isActive: !p.isActive });
    setProjects((s) => s.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
  }, [headers]);

  const removeCompany = useCallback(async (id: string) => {
    await deleteCompany(headers, id);
    if (projectCompany === id) setProjectCompany("");
    await Promise.all([loadCompanies(), loadProjects()]);
  }, [headers, projectCompany, loadCompanies, loadProjects]);

  const removeProject = useCallback(async (id: string) => {
    await deleteProject(headers, id);
    await loadProjects();
  }, [headers, loadProjects]);

  // derived
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      if (!map.has(p.companyId)) map.set(p.companyId, []);
      map.get(p.companyId)!.push(p);
    }
    return map;
  }, [projects]);

  return {
    // data
    companies, projects, groupedProjects,

    // forms
    newCompany, setNewCompany,
    newProject, setNewProject,
    projectCompany, setProjectCompany,

    // actions
    addCompany, addProject,
    toggleProject, removeCompany, removeProject,
  };
}
