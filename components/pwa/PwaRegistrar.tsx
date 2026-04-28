"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const syncDisplayMode = () => {
      const isStandalone =
        standaloneQuery.matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const displayMode = isStandalone ? "standalone" : "browser";

      document.documentElement.dataset.displayMode = displayMode;
      document.body.dataset.displayMode = displayMode;
    };

    syncDisplayMode();

    const handleDisplayModeChange = () => {
      syncDisplayMode();
    };

    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    if (process.env.NODE_ENV !== "production") {
      return () => {
        standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      };
    }

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return () => {
        standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      };
    }

    void navigator.serviceWorker.register("/sw.js");

    return () => {
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  return null;
}
