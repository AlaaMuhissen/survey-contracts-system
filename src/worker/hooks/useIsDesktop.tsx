// useIsDesktop.ts
import { useEffect, useState } from "react";

export function useIsDesktop(breakpointPx = 768) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.matchMedia(`(min-width: ${breakpointPx}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange); // Safari < 14
    setIsDesktop(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [breakpointPx]);
  return isDesktop;
}
