import localforage from "localforage";

const KEY = "companies-cache-v1";

export type Company = { id: string; name: string; active?: boolean };

export async function loadCompaniesCache(): Promise<Company[] | null> {
  return (await localforage.getItem<Company[]>(KEY)) || null;
}
export async function saveCompaniesCache(items: Company[]) {
  await localforage.setItem(KEY, items);
}
export async function clearCompaniesCache() {
  await localforage.removeItem(KEY);
}
