"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Complete progress on route change
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Find closest link or submit button
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;

      if (link && link.href) {
        const url = new URL(link.href, window.location.href);
        const isInternal = url.origin === window.location.origin;
        const isDifferent =
          url.pathname !== window.location.pathname ||
          url.search !== window.location.search;
        const isNewTab =
          link.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey;

        if (isInternal && isDifferent && !isNewTab) {
          setVisible(true);
          setProgress(35);
          setTimeout(() => setProgress(75), 100);
        }
      } else if (button && (button.type === "submit" || button.form)) {
        setVisible(true);
        setProgress(40);
        setTimeout(() => setProgress(80), 150);
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 overflow-hidden pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-brand-600 via-blue-500 to-emerald-400 shadow-sm shadow-brand-500/50 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}
