import localforage from "localforage";

const KEY = "worker-cache-v1";
type CachedWorker = {
  id: string;
  surveyId: string;
  displayName?: string;
  updatedAt: number;
};



export async function saveWorkerToCache(surveyId: string, workerId: string, worker: any) {
  const cachedWorkers = await localforage.getItem<CachedWorker[]>(KEY) || [];
  const updatedWorkers = cachedWorkers.filter(w => w.id !== workerId);
  updatedWorkers.push({
    id: workerId,
    surveyId,
    displayName: worker?.displayName || "",
    updatedAt: Date.now(),
  });
  await localforage.setItem(KEY, updatedWorkers);
}

export async function loadWorkerFromCache(surveyId: string, workerId: string): Promise<CachedWorker | null> {
  const cachedWorkers = await localforage.getItem<CachedWorker[]>(KEY) || [];
  return cachedWorkers.find(w => w.id === workerId && w.surveyId === surveyId) || null;
}
