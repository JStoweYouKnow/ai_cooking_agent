/**
 * Theme Context
 * Provides dark mode support across the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useColorScheme, Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@sous_theme_preference";

export type ThemeMode = "light" | "dark" | "system";

// Light theme colors
const lightColors = {
  // Primary brand colors
  olive: "#606C38",
  fern: "#6B8E23",
  russet: "#8B4513",
  terracotta: "#BC6C25",

  // Background colors
  background: {
    primary: "#FEFAE0",
    secondary: "#FFFFFF",
    tertiary: "#F5F1E3",
    card: "#FFFFFF",
    modal: "#FFFFFF",
  },

  // Text colors
  text: {
    primary: "#283618",
    secondary: "#606C38",
    tertiary: "#8B8B8B",
    inverse: "#FFFFFF",
    muted: "#999999",
  },

  // Border colors
  border: {
    light: "#E5E1D3",
    medium: "#D4D0C4",
    dark: "#C4C0B4",
  },

  // Status colors
  status: {
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3",
  },

  // Utility
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
  transparent: "transparent",
};

// Dark theme colors
const darkColors = {
  // Primary brand colors (slightly adjusted for dark mode)
  olive: "#7A8B4A",
  fern: "#8AAD42",
  russet: "#A65D2A",
  terracotta: "#D48A4C",

  // Background colors
  background: {
    primary: "#1A1A1A",
    secondary: "#252525",
    tertiary: "#2F2F2F",
    card: "#2A2A2A",
    modal: "#2A2A2A",
  },

  // Text colors
  text: {
    primary: "#F5F5F5",
    secondary: "#BBBBBB",
    tertiary: "#888888",
    inverse: "#1A1A1A",
    muted: "#666666",
  },

  // Border colors
  border: {
    light: "#3A3A3A",
    medium: "#4A4A4A",
    dark: "#5A5A5A",
  },

  // Status colors
  status: {
    success: "#66BB6A",
    warning: "#FFB74D",
    error: "#EF5350",
    info: "#42A5F5",
  },

  // Utility
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  transparent: "transparent",
};

export type ThemeColors = typeof lightColors;

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
          setMode(saved as ThemeMode);
        }
      } catch (error) {
        console.error("[ThemeContext] Error loading theme:", error);
      }
      setIsLoaded(true);
    }
    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Force re-render when system theme changes and we're in system mode
      if (mode === "system") {
        // This will trigger re-render due to state change
        setMode("system");
      }
    });

    return () => subscription.remove();
  }, [mode]);

  // Determine if dark mode is active
  const isDark = useMemo(() => {
    if (mode === "system") {
      return systemColorScheme === "dark";
    }
    return mode === "dark";
  }, [mode, systemColorScheme]);

  // Get the appropriate colors
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  // Set theme and persist
  const setTheme = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error("[ThemeContext] Error saving theme:", error);
    }
  }, []);

  // Toggle between light and dark (not system)
  const toggleTheme = useCallback(() => {
    const newMode = isDark ? "light" : "dark";
    setTheme(newMode);
  }, [isDark, setTheme]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      setTheme,
      toggleTheme,
    }),
    [mode, isDark, colors, setTheme, toggleTheme]
  );

  // Provide default theme while loading to prevent app crash
  // Use system theme as default during load
  const loadingValue = useMemo(
    () => ({
      mode: "system" as ThemeMode,
      isDark: systemColorScheme === "dark",
      colors: systemColorScheme === "dark" ? darkColors : lightColors,
      setTheme,
      toggleTheme: () => {},
    }),
    [systemColorScheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={isLoaded ? value : loadingValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Export colors for static usage where context isn't available
export { lightColors, darkColors };

export default ThemeContext;
