import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Company, Project } from "../types";
import {
  getCompanies, getProjects,
  createCompany, deleteCompany,
  createProject, deleteProject, patchProject,
} from "../api/adminApi";
import { useNavigate } from "react-router";



export function useCatalog(surveyId: string, headers: Record<string, string>) {
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [newCompany, setNewCompany] = useState("");
  const [newCompanyNumber, setNewCompanyNumber] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [projectCompany, setProjectCompany] = useState<string>("");
  const [newProject, setNewProject] = useState("");
  const [newCost, setNewCost] = useState(0);
  const [newAddress, setNewAddress] = useState("");  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nav = useNavigate();
  const validateCompanyForm = () => {
    const e: Record<string, string> = {};

    if (!newCompany.trim()) e.newCompany = "חובה למלא שם חברה";
    if (!newCompanyNumber.trim()) e.newCompanyNumber = "חובה למלא ח״פ / מספר חברה";

    if (!newContactPerson.trim()) e.newContactPerson = "חובה למלא איש קשר";

    if (!newContactEmail.trim()) {
      e.newContactEmail = "חובה למלא אימייל";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactEmail.trim())) {
      e.newContactEmail = "אימייל לא תקין";
    }

    if (!newContactPhone.trim()) {
      e.newContactPhone = "חובה למלא טלפון";
    } else if (!/^[0-9+\-\s()]{7,}$/.test(newContactPhone.trim())) {
      e.newContactPhone = "מספר טלפון לא תקין";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const onUpdateProject = async (id: string, patch: { name?: string; cost?: number; address?: string }) => {
    await patchProject(surveyId, headers, id, patch); 
     await loadProjects(); // refresh list
  };

  // loaders
  const loadCompanies = useCallback(async () => {
    if (!surveyId || !headers["authorization"]) return;
      try {
        const items = await getCompanies(surveyId, headers);
        setCompanies(items);
        if (!projectCompany && items.length) setProjectCompany(items[0].id);
      }catch (e: any) {
        throw e;
      }
  }, [surveyId, headers, projectCompany]);

  const loadProjects = useCallback(async () => {
    if (!surveyId || !headers["authorization"]) return;
    try{
      const items = await getProjects(surveyId, headers);
      console.log("useCatalog loadProjects", { items });  
      setProjects(items);

    }catch(e: any) {
      throw e;
    }
  }, [surveyId, headers]);

  useEffect(() => { loadCompanies().catch((e: any) => {
  if (e?.code === 401) {
    localStorage.removeItem("adminToken");
    console.log("useCatalog loadCompanies 401");
    nav("/");
    return;
  }
  throw e;
}); }, [loadCompanies]);
  useEffect(() => { loadProjects().catch((e: any) => {
  if (e?.code === 401) {
    localStorage.removeItem("adminToken");
    nav("/");
    return;
  }
  throw e;
}); }, [loadProjects]);
  // actions
  const addCompany = useCallback(async () => {
    // if (!validateCompanyForm()) return;
    const name = newCompany.trim();
    const companyNumber = newCompanyNumber.trim();
    const contactPerson = newContactPerson.trim();
    const contactEmail = newContactEmail.trim();
    const contactPhone = newContactPhone.trim();
    console.log("useCatalog", { companyNumber, contactPerson, contactEmail, contactPhone });

    if (!name || !surveyId) return;
    await createCompany(surveyId, headers, name, companyNumber, contactPerson, contactEmail, contactPhone);
    setNewCompany("");
    setNewCompanyNumber("");
    setNewContactPerson("");
    setNewContactEmail("");
    setNewContactPhone("");
    // setErrors({});
    await loadCompanies();
  }, [surveyId, headers, newCompany, newCompanyNumber, newContactPerson, newContactEmail, newContactPhone, loadCompanies]);

  const addProject = useCallback(async () => {
    const name = newProject.trim();
    const cost = newCost;
    const address = newAddress.trim();
    console.log("useCatalog addProject", { cost, address });
    if (!name || !projectCompany || !surveyId) return;
    console.log(`cost ${cost}, address ${address}`);
    await createProject(surveyId, headers, { name, companyId: projectCompany, cost, address });
    setNewProject("");
    setNewCost(0);
    setNewAddress("");
    await loadProjects();
  }, [surveyId, headers, newProject, newCost, newAddress, projectCompany, loadProjects]);

  const toggleProject = useCallback(async (p: Project) => {
    if (!surveyId) return;
    await patchProject(surveyId, headers, p.id, { isActive: !p.isActive });
    setProjects(s => s.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
  }, [surveyId, headers]);

  const removeCompany = useCallback(async (id: string) => {
    if (!surveyId) return;
    await deleteCompany(surveyId, headers, id);
    if (projectCompany === id) setProjectCompany("");
    await Promise.all([loadCompanies(), loadProjects()]);
  }, [surveyId, headers, projectCompany, loadCompanies, loadProjects]);

  const removeProject = useCallback(async (id: string) => {
    if (!surveyId) return;
    await deleteProject(surveyId, headers, id);
    await loadProjects();
  }, [surveyId, headers, loadProjects]);

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
    newCompanyNumber, setNewCompanyNumber,
    newContactPerson, setNewContactPerson,
    newContactEmail, setNewContactEmail,
    newContactPhone, setNewContactPhone,
    newProject, setNewProject,
    projectCompany, setProjectCompany,
    newCost, setNewCost,
    newAddress, setNewAddress, 
     errors,setErrors,
    
    // actions
    addCompany, addProject, toggleProject, removeCompany, removeProject, loadCompanies, loadProjects, onUpdateProject,validateCompanyForm

  };
}