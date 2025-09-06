import React, { useLayoutEffect, useRef } from "react";

export type Point = { x: number; y: number };
export type Stroke = Point[];
export type SigMeta = { w: number; h: number };

type Props = {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  setMeta: (m: SigMeta) => void;
  height?: number;
};

export default function SignaturePad({ strokes, setStrokes, setMeta, height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  // keep canvas DPI-correct & report size to PDF
  const fitToSize = () => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    c.width = Math.max(1, Math.floor(rect.width * ratio));
    c.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // redraw current strokes
    for (const s of strokes) {
      for (let i = 1; i < s.length; i++) {
        ctx.beginPath();
        ctx.moveTo(s[i - 1].x, s[i - 1].y);
        ctx.lineTo(s[i].x, s[i].y);
        ctx.stroke();
      }
    }
    setMeta({ w: rect.width, h: rect.height });
  };

  useLayoutEffect(() => {
    fitToSize();
    const onResize = () => fitToSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw after strokes change (e.g., clear)
  useLayoutEffect(() => {
    fitToSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes.length]);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    setStrokes((prev) => [...prev, [p]]);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = getPos(e);

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice();
      const last = next[next.length - 1];
      const from = last[last.length - 1];

      // live draw
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      next[next.length - 1] = [...last, p];
      return next;
    });
  };

  const stop = () => { drawingRef.current = false; };

  const clear = () => {
    setStrokes([]);
    fitToSize();
  };

  return (
    <div className="w-full relative">
      <div className="border border-black/70 rounded-md relative print:hidden">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height, touchAction: "none", cursor: "crosshair" }}
          className="bg-white"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onContextMenu={(e) => e.preventDefault()}
        />
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 bottom-2 text-sm px-2 py-1 rounded border bg-white/90"
        >
          נקה
        </button>
      </div>
    </div>
  );
}
