import { get, set } from "idb-keyval";

const KEY = "worklogQueue";

type WorkLogQueueItem = {
  id: string;
  meta: any;
  pdfBase64: string;
};

export async function enqueue(item: WorkLogQueueItem) {
  const q: WorkLogQueueItem[] = (await get(KEY)) || [];
  q.push(item);
  await set(KEY, q);
}

export async function drain(processFn: (item: WorkLogQueueItem) => Promise<void>) {
  let q: WorkLogQueueItem[] = (await get(KEY)) || [];
  const remain: WorkLogQueueItem[] = [];
  for (const item of q) {
    try {
      await processFn(item);
    } catch {
      // השאר בתור אם נכשל
      remain.push(item);
    }
  }
  await set(KEY, remain);
}

export async function removeById(id: string) {
  const q: WorkLogQueueItem[] = (await get(KEY)) || [];
  await set(KEY, q.filter(x => x.id !== id));
}

export async function peekAll(): Promise<WorkLogQueueItem[]> {
  return (await get(KEY)) || [];
}
