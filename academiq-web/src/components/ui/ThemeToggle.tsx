import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 flex items-center justify-center rounded-full border border-bg-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-brand-primary/40 transition"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}