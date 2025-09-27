export type FirestoreTimestampJSON = { _seconds: number; _nanoseconds: number };

export type DayType = "full" | "half";

export type WorkLog = {
  id: string;
  number: string;
  company?: string;
  project?: string;
  manager?: string;
  teamLead?: string;
  dayType?: DayType;
  createdAt?: FirestoreTimestampJSON;
  fileName?: string;
  fileUrl?: string;
  storageKey?: string;
};

export type Filters = {
  number?: string;       // client-side
  company?: string;
  project?: string;
  teamLead?: string;
  day?: "all" | DayType;
  from?: string;         // YYYY-MM-DD
  to?: string;           // YYYY-MM-DD
  hasFile?: "all" | "yes" | "no";
  q?: string;            // server-side search by number
};

export type ReportRow = {
  company: string;
  project: string;
  uniqueDays: number;
  fullCount: number;
  halfCount: number;
  logsTotal: number;
};

export type ReportResponse = { rows?: ReportRow[] };

export type Company = { id: string; name: string };

export type Project = {
  id: string;
  name: string;
  companyId: string;
  companyName?: string;
  isActive?: boolean;
};