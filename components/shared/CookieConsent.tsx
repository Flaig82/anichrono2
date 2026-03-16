"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already made a choice
    if (localStorage.getItem(CONSENT_KEY)) return;

    // Only show for non-US visitors (middleware sets this cookie)
    const needsConsent = getCookie("needs-cookie-consent");
    if (needsConsent === "1") {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-aura-border bg-aura-bg2/95 backdrop-blur-md px-4 md:px-8 lg:px-[120px] py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-[13px] leading-relaxed text-aura-muted2 max-w-2xl">
          This site uses cookies to improve your experience.{" "}
          <Link
            href="/privacy-policy"
            className="text-aura-orange hover:brightness-110 transition-all"
          >
            Learn more
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="rounded-lg px-4 py-2 font-body text-[13px] font-bold text-aura-muted2 transition-colors hover:text-white"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-aura-orange px-4 py-2 font-body text-[13px] font-bold text-white transition-colors hover:brightness-110"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
