import { useEffect, useRef } from "react";

export function useInactivityLogout(enabled: boolean, timeoutMs = 30 * 60 * 1000, onTimeout?: () => void) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const reset = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        onTimeout?.();
        window.location.assign("/");
      }, timeoutMs);
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true } as any));
    reset();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset as any));
    };
  }, [enabled, timeoutMs, onTimeout]);
}
