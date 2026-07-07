import React from "react";
import { motion } from "framer-motion"; 

export default function StatsRow({
  total, fullDays, halfDays, monthLabel, companyCount
}: {
  total: number; fullDays: number; halfDays: number;  monthLabel: string;  companyCount: number;
}) {
  const Card = ({ title, value, sub }: any) => (
    <motion.div
      layout
      className="rounded-2xl border bg-white/70 bg-white backdrop-blur p-4 shadow-sm"
    >
      <div className="text-m text-black">{title}</div>
      <div className="text-2xl font-bold text-black">{value}</div>
      <div className="text-xs text-black">{sub}</div>
    </motion.div>
  );
  return (
    <>
    {console.log("Rendering StatsRow", { total, fullDays, halfDays, monthLabel, companyCount })}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <Card title="סה״כ רשומות" value={total} sub={monthLabel} />
      <Card title="ימים מלאים" value={fullDays} sub="נוכחי במסננים" />
      <Card title="חצאי ימים" value={halfDays} sub="נוכחי במסננים" />
      <Card title="מספר חברות" value={companyCount} sub="ייחודיות בתוצאות" />
    </div>
    </>
  );
}
