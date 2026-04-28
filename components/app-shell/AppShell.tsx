"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { TabBar } from "@/components/TabBar/TabBar";
import styles from "./AppShell.module.css";

type DisplayMode = "browser" | "standalone";

interface AppShellContextValue {
  displayMode: DisplayMode;
  scrollTop: number;
  isScrollLocked: boolean;
  lockScroll: (locked: boolean) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

const PRIMARY_ROUTES = new Set(["/", "/tools", "/profile"]);
const AUTH_ROUTES = new Set(["/login", "/register"]);

function resolveDisplayMode(): DisplayMode {
  if (typeof window === "undefined") {
    return "browser";
  }

  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  const isStandalone =
    standaloneQuery.matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone ? "standalone" : "browser";
}

function getRouteKind(pathname: string): "primary" | "auth" | "secondary" {
  if (PRIMARY_ROUTES.has(pathname)) {
    return "primary";
  }

  if (AUTH_ROUTES.has(pathname)) {
    return "auth";
  }

  return "secondary";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lockCountRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("browser");
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const routeKind = getRouteKind(pathname);
  const showTabBar = routeKind === "primary";

  useEffect(() => {
    const nextMode = resolveDisplayMode();
    setDisplayMode(nextMode);
    document.documentElement.dataset.displayMode = nextMode;
    document.body.dataset.displayMode = nextMode;

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = () => {
      const updatedMode = resolveDisplayMode();
      setDisplayMode(updatedMode);
      document.documentElement.dataset.displayMode = updatedMode;
      document.body.dataset.displayMode = updatedMode;
    };

    standaloneQuery.addEventListener("change", handleChange);
    return () => {
      standaloneQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const lockScroll = useCallback((locked: boolean) => {
    lockCountRef.current += locked ? 1 : -1;
    lockCountRef.current = Math.max(lockCountRef.current, 0);
    setIsScrollLocked(lockCountRef.current > 0);
  }, []);

  useEffect(() => {
    const node = scrollAreaRef.current;
    if (!node) {
      return;
    }

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(node.scrollTop);
      });
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      node.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [pathname]);

  useEffect(() => {
    const node = scrollAreaRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setScrollTop(0);
  }, [pathname]);

  useEffect(() => {
    if (!frameRef.current) {
      return;
    }

    frameRef.current.dataset.routeKind = routeKind;
  }, [routeKind]);

  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      displayMode,
      scrollTop,
      isScrollLocked,
      lockScroll,
    }),
    [displayMode, scrollTop, isScrollLocked, lockScroll],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className={styles.root}>
        <div ref={frameRef} className={styles.frame} data-display-mode={displayMode}>
          <div
            ref={scrollAreaRef}
            className={`${styles.scrollArea} ${
              showTabBar ? styles.scrollAreaWithTabBar : ""
            } ${routeKind === "auth" ? styles.scrollAreaAuth : ""} ${
              isScrollLocked ? styles.scrollAreaLocked : ""
            }`}
          >
            <div key={pathname} className={styles.routeStage}>
              {children}
            </div>
          </div>

          {showTabBar && <TabBar />}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShell");
  }
  return context;
}
