import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import {
  computeAppTheme,
  getThemeDescription,
  type AppTheme,
} from "@/lib/theme";
import {
  detectUserLocation,
  getSavedUserLocation,
  saveUserLocation,
} from "@/lib/geolocation";

interface ThemeContextValue {
  state: string | null;
  themeMode: AppTheme;
  themeDescription: string;
  refreshLocation: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  state: null,
  themeMode: "dark",
  themeDescription: "Dark theme — default",
  refreshLocation: async () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

const ThemeController = ({
  state,
  children,
}: {
  state: string | null;
  children: React.ReactNode;
}) => {
  const { setTheme } = useTheme();
  const themeMode = computeAppTheme(state);

  useEffect(() => {
    setTheme(themeMode);
  }, [state, themeMode, setTheme]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTheme(computeAppTheme(state));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [state, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        state,
        themeMode,
        themeDescription: getThemeDescription(state),
        refreshLocation: async () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const refreshLocation = async () => {
    const saved = getSavedUserLocation();
    if (saved?.state) {
      setState(saved.state);
    }

    const detected = await detectUserLocation();
    if (detected?.state) {
      saveUserLocation(detected);
      setState(detected.state);
    }
  };

  useEffect(() => {
    setMounted(true);
    refreshLocation();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeController state={state}>{children}</ThemeController>
    </ThemeProvider>
  );
};
