import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// React + TypeScript + Tailwind (RTL)
// Strict A4 printing: the form NEVER exceeds an A4 rectangle.
// Added: SignaturePad (mouse/touch), print-safe sizing using @page + mm units.

function LineInput({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  labelClassName = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <label className={`whitespace-nowrap text-sm print:text-[12px]${labelClassName}`}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-right bg-transparent border-0 border-b border-black/80 focus:outline-none focus:ring-0 print:border-black/90 print:bg-transparent"
      />
    </div>
  );
}

function LinedArea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const lineHeight = 30;
  const height = rows * lineHeight + 10;
  return (
    <div>
      <div className="text-sm mb-2">{label}:</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height,
          lineHeight: `${lineHeight}px`,
          backgroundImage:
            `repeating-linear-gradient(to bottom, transparent 0, transparent ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight}px)`,
          backgroundSize: "100% 100%",
        }}
        className="w-full bg-transparent outline-none resize-none p-2 print:bg-transparent"
      />
    </div>
  );
}

// Lightweight signature pad using <canvas>
function SignaturePad({
  value,
  onChange,
  height = 120,
}: {
  value?: string; // dataURL to load (optional)
  onChange: (dataUrl: string) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Resize for device pixel ratio for sharp lines
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);
    // redraw previous image if value exists
    if (value) {
      const img = new Image();
      img.onload = () => ctx?.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e as any).clientX - rect.left;
    const y = (e as any).clientY - rect.top;
    return { x, y };
  };

  const start = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getPos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const p = getPos(e);
    const lp = lastPointRef.current || p;
    ctx.beginPath();
    ctx.moveTo(lp.x, lp.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };
  const end = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="w-full">
      <div className="border border-black/70 rounded-md bg-black relative print:border-0 print:bg-transparent print:hidden">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height }}
          className="touch-none bg-white print:bg-transparent"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="absolute print:hidden">
        <button onClick={clear} className="text-sm px-2 py-1 rounded border">נקה</button>
      </div>
    </div>
  );
}
/**
 +  <div className="print:hidden absolute left-2 bottom-2">
+    <button onClick={clear} className="text-sm px-2 py-1 rounded border">נקה</button>
+  </div>
 * 
 */
// Global print CSS to strictly constrain to A4
function PrintCSS() {
  return (
    <style>{`
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body, #root { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; }
        /* Show ONLY the A4 page */
        body * { visibility: hidden !important; }
        #a4-page, #a4-page * { visibility: visible !important; }
        #a4-page { width: 210mm !important; height: 297mm !important; overflow: hidden !important; box-sizing: border-box; position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );
}
    

export default function SurveyWorkLog() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    src: "מקור",
    number: "01190",
    date: "",
    company: "",
    project: "",
    manager: "",
    teamLead: "",
    helper1: "",
    helper2: "",
    workDesc: "",
    notes: "",
  });
  const [sigManager, setSigManager] = useState<string>("");
  const [sigLead, setSigLead] = useState<string>("");

  const set = (k: keyof typeof form) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const printPage = () => {
    window.print();
  };
  const downloadPDF = async () => {
  if (!pageRef.current) return;
  const page = pageRef.current;

  // להסתיר זמנית אלמנטים שמסומנים print:hidden (כמו כפתור "נקה")
  const toHide = Array.from(page.querySelectorAll(".print\\:hidden")) as HTMLElement[];
  const prevDisplay = toHide.map(el => el.style.display);
  toHide.forEach(el => (el.style.display = "none"));

  // לכידה מדויקת של ה-A4 בלי הסטות גלילה
  const rect = page.getBoundingClientRect();
  const canvas = await html2canvas(page, {
    backgroundColor: "#ffffff",
    scale: 2,                 // איכות טובה
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.ceil(rect.width),
    windowHeight: Math.ceil(rect.height),
    useCORS: true,
  });

  // להחזיר את מה שהוסתר
  toHide.forEach((el, i) => (el.style.display = prevDisplay[i]));

  // יצירת PDF A4 מלא
  const img = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const w = pdf.internal.pageSize.getWidth();   // 210
  const h = pdf.internal.pageSize.getHeight();  // 297
  pdf.addImage(img, "JPEG", 0, 0, w, h);
  pdf.save(`work-log-${(form.date || new Date().toLocaleDateString('he-IL')).replace(/\\./g,'-')}.pdf`);
};


  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white">
      <PrintCSS />
      <div className="mx-auto max-w-[900px] px-3">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold">יומן עבודה – טופס מדידות (React RTL)</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const d = today.toLocaleDateString("he-IL");
                setForm((s) => ({ ...s, date: d }));
              }}
              className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
            >
              תאריך להיום
            </button>
            <button onClick={printPage} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">הדפס</button>
            <button onClick={downloadPDF} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">
  הורד PDF
</button>

          </div>
        </div>

        {/* Strict A4 page */}
        <div
          id="a4-page"
          ref={pageRef}
          className="relative bg-white shadow-xl border border-black/70 mx-auto w-[794px] h-[1123px] p-6 print:shadow-none print:border-black print:mx-auto print:w-[210mm] print:h-[297mm] print:overflow-hidden print:box-border"
        >
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-black/80 pb-3">
            <div className="w-20 h-20 border border-black/60 rounded-full shrink-0 flex items-center justify-center text-xs">
              לוגו
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold leading-tight">טרווארס מדידות</div>
              <div className="text-sm">אל-אנסאר 25, ירושלים</div>
              <div className="text-sm">054-7312492</div>
            </div>
            <div className="shrink-0 text-sm text-right">
              <div className="border border-black/70 px-2 py-1 inline-block mb-2">
                עוסק מורשה<br />
                <span className="font-mono">301156782</span>
              </div>
              <div className="text-xs">{form.src}</div>
            </div>
          </div>

          <div className="flex items-end justify-between mt-3 mb-2">
            <div className="text-sm">מקור</div>
            <div className="text-xl font-semibold">יומן עבודה</div>
            <div className="flex items-end gap-3">
              <div className="text-sm">No.</div>
              <input
                value={form.number}
                onChange={(e) => set("number")(e.target.value)}
                className="w-24 text-center bg-transparent border-0 border-b border-black/80 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end mb-4 gap-2 items-end">
            <div className="text-sm">תאריך</div>
            <input
              value={form.date}
              onChange={(e) => set("date")(e.target.value)}
              placeholder="יום.חודש.שנה"
              className="w-40 bg-transparent border-0 border-b border-black/80 focus:outline-none"
            />
          </div>

          <div className="mb-1 font-semibold">פרטי החברה</div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <LineInput label="חברה:" value={form.company} onChange={set("company")} placeholder="שם החברה" />
            <LineInput label="פרויקט:" value={form.project} onChange={set("project")} placeholder="שם הפרויקט" />
            <LineInput label="מנהל עבודה:" value={form.manager} onChange={set("manager")} placeholder="שם מנהל העבודה" />
          </div>

          <div className="mb-1 font-semibold">פרטי צוות מדידה</div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <LineInput label="ראש צוות:" value={form.teamLead} onChange={set("teamLead")} placeholder="שם" />
            <LineInput label="עוזר:" value={form.helper1} onChange={set("helper1")} placeholder="שם" />
            <LineInput label="עוזר:" value={form.helper2} onChange={set("helper2")} placeholder="שם" />
          </div>

          <div className="mb-4">
            <LinedArea label="תיאור עבודה" value={form.workDesc} onChange={set("workDesc")} rows={8} />
          </div>

          <div className="mb-10">
            <LinedArea label="הערות" value={form.notes} onChange={set("notes")} rows={5} />
          </div>

          {/* Signatures */}
          <div className="absolute left-0 right-0 bottom-4 px-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col ">
                <SignaturePad value={sigManager} onChange={setSigManager} />
                <div className="h-0 -mt-[1px] border-t border-black/80" />
                <div className="mt-1 text-center text-sm">חתימת מנהל</div>
              </div>
              <div className="flex flex-col">
                <SignaturePad value={sigLead} onChange={setSigLead} />
                <div className="h-0 -mt-[1px] border-t border-black/80" />
                <div className="mt-1 text-center text-sm">חתימת ראש צוות</div>
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-10 text-[120px] font-black tracking-widest rotate-[-18deg]">
            GIS
          </div>
        </div>
      </div>
    </div>
  );
}
