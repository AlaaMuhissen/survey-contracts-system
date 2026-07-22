import { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) return null;

  // Rendered via a portal straight onto <body>. Without this, any ancestor
  // with backdrop-blur/filter/transform (the sticky tab bar above this
  // modal in the page has backdrop-blur) silently creates a new CSS
  // containing block, which breaks `position: fixed` for everything inside
  // it — the modal ends up positioned relative to that ancestor instead of
  // the real viewport, and content meant to sit behind it (like that tab
  // bar) can bleed through into the middle of the modal. Portaling to body
  // sidesteps the whole class of bug regardless of what's above it in the
  // tree.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidthClass} sm:m-4 bg-white shadow-xl border
                    rounded-t-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl">
          <div className="font-semibold text-base sm:text-lg">{title}</div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 text-lg leading-none"
            onClick={onClose}
            aria-label="סגור"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}