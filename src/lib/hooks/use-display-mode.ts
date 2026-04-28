"use client";

import { useAppShell } from "@/components/app-shell/AppShell";

export function useDisplayMode() {
  return useAppShell().displayMode;
}
