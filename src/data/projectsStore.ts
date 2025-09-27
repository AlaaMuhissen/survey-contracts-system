import localforage from "localforage";
import type { Company } from "./companiesStore";

export type Project = { id: string; name: string; companyId: string; active?: boolean };

const PREFIX = "projects-cache-v1-"; // per companyId

export async function loadProjectsCache(companyId: string): Promise<Project[] | null> {
  return (await localforage.getItem<Project[]>(PREFIX + companyId)) || null;
}
export async function saveProjectsCache(companyId: string, items: Project[]) {
  await localforage.setItem(PREFIX + companyId, items);
}
export async function clearProjectsCache(companyId: string) {
  await localforage.removeItem(PREFIX + companyId);
}
