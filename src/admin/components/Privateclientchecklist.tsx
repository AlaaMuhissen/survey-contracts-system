import { useMemo, useState } from "react";
import { PrivateClient } from "../types";

function StateIcon({ state }: { state: "all" | "some" | "none" }) {
  if (state === "all") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
        <path d="M8 12.5l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "some") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
        <rect x="7.5" y="11" width="9" height="2" fill="white" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    </svg>
  );
}

export default function PrivateClientChecklist({
  privateClients,
  checkedIds,
  onToggle,
  masterState,
  toggleAll,
}: {
  privateClients: PrivateClient[];
  checkedIds: string[];
  onToggle: (id: string) => void;
  masterState: "all" | "some" | "none";
  toggleAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const items = useMemo(
    () => (q ? privateClients.filter((c) => c.name.toLowerCase().includes(q)) : privateClients),
    [privateClients, q]
  );

  return (
    <div dir="rtl">
      <div className="flex items-center gap-2 mb-2 cursor-pointer select-none" onClick={toggleAll}>
        <span className={masterState === "none" ? "text-neutral-400" : "text-black/80"}>
          <StateIcon state={masterState} />
        </span>
        <span className="text-sm font-semibold">שירותים פרטיים</span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש לקוח פרטי..."
        className="w-full text-sm border rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
      />

      <div className="max-h-40 overflow-y-auto border rounded-lg p-1">
        {items.length === 0 ? (
          <div className="text-xs text-neutral-400 text-center py-4">אין תוצאות</div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 text-sm">
              <span
                className={`shrink-0 cursor-pointer ${checkedIds.includes(c.id) ? "text-black/80" : "text-neutral-400"}`}
                onClick={() => onToggle(c.id)}
              >
                <StateIcon state={checkedIds.includes(c.id) ? "all" : "none"} />
              </span>
              <span className="cursor-pointer truncate" onClick={() => onToggle(c.id)}>
                {c.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}