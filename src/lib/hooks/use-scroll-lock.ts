"use client";

import { useEffect } from "react";
import { useAppShell } from "@/components/app-shell/AppShell";

export function useScrollLock(active: boolean) {
  const { lockScroll } = useAppShell();

  useEffect(() => {
    if (!active) {
      return;
    }

    lockScroll(true);

    return () => {
      lockScroll(false);
    };
  }, [active, lockScroll]);
}
