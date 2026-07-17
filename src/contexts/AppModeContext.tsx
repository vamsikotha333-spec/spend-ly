import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type AppMode = "fintracker" | "wealth";

const STORAGE_KEY = "app_mode";

interface AppModeContextValue {
  mode: AppMode;
  setMode: (m: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

const WEALTH_ROUTES = [
  "/wealth",
  "/wealth/investments",
  "/wealth/net-worth",
  "/wealth/allocation",
  "/wealth/goals",
  "/wealth/insurance",
];

function initialMode(pathname: string): AppMode {
  if (WEALTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return "wealth";
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "wealth" || stored === "fintracker") return stored;
  } catch {}
  return "fintracker";
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [mode, setModeState] = useState<AppMode>(() => initialMode(pathname));

  // Sync mode when navigating directly to a wealth route
  useEffect(() => {
    const isWealth = WEALTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
    if (isWealth && mode !== "wealth") setModeState("wealth");
  }, [pathname, mode]);

  const setMode = (m: AppMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
