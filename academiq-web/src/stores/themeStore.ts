import { create } from "zustand";

type Theme = "dark" | "light";

const STORAGE_KEY = "academiq-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (t) => {
      localStorage.setItem(STORAGE_KEY, t);
      applyTheme(t);
      set({ theme: t });
    },
    toggle: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      get().setTheme(next);
    },
  };
});