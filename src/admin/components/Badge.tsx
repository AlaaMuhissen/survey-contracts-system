import React from "react";

export default function Badge({
  children, tone = "neutral",
}: { children: React.ReactNode; tone?: "neutral"|"green"|"amber" }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-800 border-neutral-200",
    green: "bg-green-100 text-green-800 border-green-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
