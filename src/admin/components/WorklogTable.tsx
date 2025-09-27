import React, { useEffect, useMemo, useState } from "react";
import { WorkLog } from "../types";
import { tsToMs } from "../../utils/time";
import Badge from "./Badge";

export default function WorklogTable({
  items, onCreateUrl,
}: {
  items: WorkLog[];
  onCreateUrl: (w: WorkLog) => void;
}) {

  // -------- MOBILE (cards) --------
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {items.map((w) => {
        const ms = tsToMs(w.createdAt);
        const date = ms ? new Date(ms).toLocaleDateString("he-IL") : "—";
        const tone = w.dayType === "half" ? "amber" : "green";
        const hasFile = Boolean(w.fileUrl || w.storageKey);

        return (
          <div
            key={w.id}
            className="rounded-2xl border bg-white/90 backdrop-blur shadow-sm background-gradient-to-b from-indigo-50 to-white p-3  "
          >
            {/* Header row: number + day badge */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                <span className="text-neutral-500">מס׳&nbsp;</span>{w.number}
              </div>
              <Badge tone={tone as any}>{w.dayType === "half" ? "חצי יום" : "יום מלא"}</Badge>
            </div>

            {/* Key info */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
              <InfoRow label="חברה" value={w.company} />
              <InfoRow label="פרויקט" value={w.project} />
              <InfoRow label="ראש צוות" value={w.teamLead} />
              <InfoRow label="תאריך" value={date} />
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-8 items-center">
              {w.fileUrl ? (
                <a
                  href={w.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-sm hover:bg-black/80 hover:text-white"
                  aria-label={`פתיחת הקובץ של ${w.number}`}
                >
                  פתח
                </a>
              ) : w.storageKey ? (
                <button
                  onClick={() => onCreateUrl(w)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-black/80 hover:text-white"
                  aria-label={`צור קישור שעה עבור ${w.number}`}
                >
                  צור קישור שעה
                </button>
              ) : (
                <span className="text-neutral-400 text-sm">אין קובץ</span>
              )}

              <div className="text-xs text-neutral-500">
                {hasFile ? "קובץ זמין" : "ללא קובץ"}
              </div>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <EmptyStateMobile />
      )}
    </div>
  );

  // -------- DESKTOP (table) --------
  const DesktopTable = () => (
    <div className="hidden md:block overflow-hidden rounded-2xl border bg-white/80 dark:bg-neutral-900/60 backdrop-blur max-h-screen overflow-y-auto shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-sm ">
          <thead className="bg-neutral-50/70 dark:bg-neutral-800 sticky top-[64px] md:top-0 z-10 backdrop-blur">
            <tr className="text-right">
              <TH>#</TH>
              <TH>חברה</TH>
              <TH>פרויקט</TH>
              <TH>ראש צוות</TH>
              <TH>סוג יום</TH>
              <TH>תאריך</TH>
              <TH>קובץ</TH>
            </tr>
          </thead>

          <tbody className="bg-white">
            {items.map((w) => {
              const ms = tsToMs(w.createdAt);
              const d = ms ? new Date(ms).toLocaleDateString("he-IL") : "";
              const tone = w.dayType === "half" ? "amber" : "green";

              return (
                <tr key={w.id} className="border-t hover:bg-emerald-50 transition-colors">
                  <td className="p-3 font-mono tabular-nums text-black/80">{w.number}</td>
                  <td className="p-3 text-black/80">{w.company || <MutedDash />}</td>
                  <td className="p-3 text-black/80">{w.project || <MutedDash />}</td>
                  <td className="p-3 text-black/80">{w.teamLead || <MutedDash />}</td>
                  <td className="p-3"><Badge tone={tone as any}>{w.dayType === "half" ? "חצי יום" : "יום מלא"}</Badge></td>
                  <td className="p-3 text-black/80">{d}</td>
                  <td className="p-3">
                    {w.fileUrl ? (
                      <a
                        href={w.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-white/60 hover:border-white/90 text-black/80 hover:text-lime-950"
                      >
                        פתח
                      </a>
                    ) : w.storageKey ? (
                      <button
                        className="inline-flex items-center rounded-full border px-2 py-1 text-xs hover:bg-indigo-50 hover:border-indigo-300 text-white/80 hover:text-black"
                        onClick={() => onCreateUrl(w)}
                      >
                        צור קישור שעה
                      </button>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <EmptyStateDesktop />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
}

/* ---------- small helpers (same file for convenience) ---------- */

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-3 font-medium text-white/90 select-none">
      {children} <span className="opacity-40">↕</span>
    </th>
  );
}

function MutedDash() {
  return <span className="text-neutral-400">—</span>;
}

function InfoRow({
  label, value, className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-neutral-500">{label}</div>
      <div className="text-black/80 ">{value || "—"}</div>
    </div>
  );
}

function EmptyStateDesktop() {
  return (
    <div>
      <div className="mx-auto w-24 h-24 rounded-full border-2 border-dashed grid place-items-center mb-3 animate-pulse">
        🗂️
      </div>
      <div className="text-neutral-600">אין תוצאות למסננים שנבחרו</div>
      <div className="text-xs text-neutral-500 mt-1">נסה לנקות מסננים או לשנות טווח תאריכים</div>
    </div>
  );
}

function EmptyStateMobile() {
  return (
    <div className="rounded-2xl border bg-white/90 dark:bg-neutral-900/70 p-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full border-2 border-dashed grid place-items-center mb-2 animate-pulse">
        🗂️
      </div>
      <div className="text-neutral-600">אין תוצאות למסננים שנבחרו</div>
      <div className="text-xs text-neutral-500 mt-1">נסה לנקות מסננים או לשנות טווח תאריכים</div>
    </div>
  );
}
