export type FirestoreTimestampJSON = { _seconds: number; _nanoseconds: number };

export type DayType = "full" | "half";

export type WorkLog = {
  id: string;
  number: string;
  company?: string;
  companyId?: string;
  project?: string;
  projectId?: string;
  manager?: string;
  teamLead?: string;
  dayType?: DayType;
  createdAt?: FirestoreTimestampJSON;
  fileName?: string;
  fileUrl?: string;
  storageKey?: string;
  address?: string;
};

export type Filters = {
  number?: string;       // client-side
  company?: string;
  companyId?: string;
  project?: string;
  projectId?: string;
  teamLead?: string;
  address?: string;
  day?: "all" | DayType;
  from?: string;         // YYYY-MM-DD
  to?: string;           // YYYY-MM-DD
  hasFile?: "all" | "yes" | "no";
  q?: string;            // server-side search by number
};

export type ReportRow = {
  company: string;
  project: string;
  projectCost: number;
  fullCount: number;
  halfCount: number;
  logsTotal: number;
  totalCost: number;
  pdfUrls?: string[];
};

export type ReportResponse = {
  from?: string | null;
  to?: string | null;
  count?: number;
  rows: ReportRow[];
};
export type Company = {
   id: string;
   name: string;
   surveyId : string;
   companyNumber ?: string;
   contactPerson ?: string;
   contactEmail ?: string;
   contactPhone ?: string;
   };

export type Project = {
  id: string;
  name: string;
  companyId: string;
  companyName?: string;
  surveyId ?: string;
  isActive?: boolean;
  cost: number,
  address: string,
};

export type Worker = {
  id: string;
  workerId: string;
  displayName: string;
  createdAt?: { _seconds: number };
  disabled?: boolean;
};

export type AdminProfile = {
  displayName: string;
  username: string;
  email?: string;
  title?: string;
};