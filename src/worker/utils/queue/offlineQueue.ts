import { get, set } from "idb-keyval";

const KEY = "worklogQueue";

type SigPack = { sigManager: any; sigLead: any; sigMeta: any };

export type WorkLogQueueItem =
  | {
      id: string;
      kind: "ready";
      meta: any;
      pdfBase64: string;
      surveyId: string;
      companyId?: string;
      projectId?: string;
    }
  | {
      id: string;
      kind: "draft";       // ✅ queued while offline
      meta: any;           // ✅ form data (may have number: "00000")
      surveyId: string;
      companyId?: string;
      projectId?: string;
      sigPack?: SigPack;    // ✅ so we can rebuild PDF later
      pdfBase64: string;
    };

export async function enqueue(item: WorkLogQueueItem) {
  const q: WorkLogQueueItem[] = (await get(KEY)) || [];
  console.log("enqueue", item, q);
  q.push(item);
  await set(KEY, q);
}

/**
 * Drain the queue.
 *
 * IMPORTANT: this "claims" every item currently in the queue by writing an
 * EMPTY queue back to storage BEFORE processing anything. That's what makes
 * this safe if drain() somehow gets called twice concurrently (e.g. a
 * StrictMode double-effect, a component remount racing the 'online' event,
 * or a slow upload still in flight when 'online' fires again): the second
 * call reads an already-emptied queue and has nothing left to send, instead
 * of re-sending the same item a second time.
 *
 * Anything that fails is put back, merged with any NEW items that were
 * enqueued while this drain was running (so we don't clobber a fresh
 * offline save that happened mid-drain).
 */
export async function drain(processFn: (item: WorkLogQueueItem) => Promise<void>) {
  const claimed: WorkLogQueueItem[] = (await get(KEY)) || [];
  if (claimed.length === 0) return;

  await set(KEY, []); // claim immediately — nobody else can pick these up now

  const remain: WorkLogQueueItem[] = [];
  for (const item of claimed) {
    try {
      await processFn(item);
    } catch (e) {
      console.error("drain: item failed, re-queueing", item.id, e);
      remain.push(item);
    }
  }

  if (remain.length) {
    const addedWhileDraining: WorkLogQueueItem[] = (await get(KEY)) || [];
    await set(KEY, [...addedWhileDraining, ...remain]);
  }
}

export async function removeById(id: string) {
  const q: WorkLogQueueItem[] = (await get(KEY)) || [];
  console.log("removeById", id, q);
  await set(KEY, q.filter(x => x.id !== id));
}

export async function updateById(id: string, patch: Partial<WorkLogQueueItem>) {
  const q: WorkLogQueueItem[] = (await get(KEY)) || [];

  const next = q.map(x => {
    if (x.id !== id) return x;

    return {
      ...x,
      ...patch,
      meta: (patch as any).meta ? { ...x.meta, ...(patch as any).meta } : x.meta,
    };
  });
  console.log("queue ids:", q.map(x => x.id));
  await set(KEY, next);
}