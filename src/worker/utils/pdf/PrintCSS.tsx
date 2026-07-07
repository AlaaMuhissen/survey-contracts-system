

export default function PrintCSS() {
  return (
    <style>{`
  /* mobile comfort */
  @media (max-width: 768px) {
    html, body { -webkit-text-size-adjust: 100%; }
    input, textarea, button { font-size: 16px; } /* avoid iOS zoom */
    #a4-page { box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
  }

  /* better momentum scroll on iOS */
  body { -webkit-overflow-scrolling: touch; }

  /* ensure signature canvas always receives touches */
  canvas { touch-action: none; }

  /* print page to exact A4 */
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body, #root { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden !important; }
    #a4-page, #a4-page * { visibility: visible !important; }
    #a4-page { width: 210mm !important; height: 297mm !important; overflow: hidden !important; box-sizing: border-box; position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`}</style>
  );
}
