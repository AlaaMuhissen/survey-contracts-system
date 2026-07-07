import localforage from "localforage";

export type Project = { id: string; name: string; companyId: string; active?: boolean };

const KEY = (surveyId: string) => `projects-cache-v2:${surveyId}`;

export async function loadAllProjectsCache(surveyId: string): Promise<Project[]> {
  return (await localforage.getItem<Project[]>(KEY(surveyId))) || [];
}

export async function saveAllProjectsCache(surveyId: string, items: Project[]) {
  await localforage.setItem(KEY(surveyId), items);
}

export async function clearAllProjectsCache(surveyId: string) {
  await localforage.removeItem(KEY(surveyId));
}

export async function loadProjectsByCompanyFromAll(surveyId: string, companyId: string) {
  const all = await loadAllProjectsCache(surveyId);
  return all.filter(p => p.companyId === companyId && p.active !== false);
}
