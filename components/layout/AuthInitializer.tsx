"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function AuthInitializer() {
  const initialize = useAuth((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return null;
}
