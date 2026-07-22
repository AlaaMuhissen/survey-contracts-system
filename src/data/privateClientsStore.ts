import localforage from "localforage";

const KEY = "private-clients-cache-v1";

export type PrivateClient = { id: string; name: string; active?: boolean };

export async function loadPrivateClientsCache(): Promise<PrivateClient[] | null> {
  return (await localforage.getItem<PrivateClient[]>(KEY)) || null;
}
export async function savePrivateClientsCache(items: PrivateClient[]) {
  await localforage.setItem(KEY, items);
}
export async function clearPrivateClientsCache() {
  await localforage.removeItem(KEY);
}
