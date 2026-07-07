import { openDB } from "idb";
import type { Stroke, SigMeta } from "../../components/SignaturePad";
import type { WorkLogForm } from "../pdf/WorkLogPDF";

export type PendingWorklog = {
  id: string;              // local id
  createdAt: number;
  surveyId: string;
  companyId?: string ;
  projectId?: string;
  form: WorkLogForm;
  sigManager: Stroke[];
  sigLead: Stroke[];
  sigMeta: SigMeta;
  status: "pending" | "synced" | "error";
  lastError?: string;
};

export const offlineDB = openDB("fielo_offline", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("pending_worklogs")) {
      const store = db.createObjectStore("pending_worklogs", { keyPath: "id" });
      store.createIndex("status", "status");
      store.createIndex("createdAt", "createdAt");
      store.createIndex("surveyId", "surveyId");
    }
  },
});

export async function addPendingWorklog(item: PendingWorklog) {
  const db = await offlineDB;
  await db.put("pending_worklogs", item);
}

export async function listPendingWorklogs() {
  const db = await offlineDB;
  return db.getAllFromIndex("pending_worklogs", "status", "pending");
}

export async function markWorklogSynced(id: string) {
  const db = await offlineDB;
  const item = await db.get("pending_worklogs", id);
  if (!item) return;
  item.status = "synced";
  item.lastError = "";
  await db.put("pending_worklogs", item);
}

export async function markWorklogError(id: string, message: string) {
  const db = await offlineDB;
  const item = await db.get("pending_worklogs", id);
  if (!item) return;
  item.status = "error";
  item.lastError = message;
  await db.put("pending_worklogs", item);
}
