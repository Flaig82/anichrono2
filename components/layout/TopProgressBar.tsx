"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isNavigating = useRef(false);
  const trickleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathnameRef = useRef(pathname);

  // Start progress on internal link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }
      if (!target) return;

      const anchor = target as HTMLAnchorElement;
      if (anchor.target === "_blank" || anchor.hasAttribute("download") || !anchor.href) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathnameRef.current && url.hash) return;
      if (url.pathname === pathnameRef.current && url.search === window.location.search) return;

      // Start the bar
      isNavigating.current = true;
      setProgress(15);
      setVisible(true);

      // Trickle progress
      if (trickleTimer.current) clearInterval(trickleTimer.current);
      trickleTimer.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) return p;
          return p + (85 - p) * 0.1;
        });
      }, 200);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // Complete on pathname change
  useEffect(() => {
    pathnameRef.current = pathname;

    if (!isNavigating.current && !visible) return;

    // Complete the bar
    if (trickleTimer.current) {
      clearInterval(trickleTimer.current);
      trickleTimer.current = null;
    }
    isNavigating.current = false;
    setProgress(100);

    const fadeTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);

    return () => clearTimeout(fadeTimer);
  }, [pathname, visible]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[9999] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      <div
        className="h-full bg-aura-orange motion-reduce:transition-none"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 0.2s ease" : "width 0.4s ease",
        }}
      />
    </div>
  );
}
