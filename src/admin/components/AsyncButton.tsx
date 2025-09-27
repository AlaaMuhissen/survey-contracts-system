// AsyncButton.tsx
import { useState } from "react";
import clsx from "clsx";

type Props = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
};

export default function AsyncButton({
  onClick,
  disabled,
  className,
  loadingText = "מבצע...",
  children,
  type = "button",
}: Props) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      await Promise.resolve(onClick());
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || pending}
      aria-busy={pending}
      className={clsx(
        "rounded-lg border px-3 py-2 inline-flex items-center gap-2 text-sm bg-white backdrop-blur shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300/60",
        pending ? "opacity-60 cursor-not-allowed" : "text-black/80 hover:bg-black/80 hover:text-white",
        className
      )}
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
      {pending ? loadingText : children}
    </button>
  );
}
