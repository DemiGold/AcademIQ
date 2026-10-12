import { Outlet, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="w-full border-b border-bg-border bg-bg-secondary/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="AcademIQ home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-sm">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold text-text-primary">
              AcademIQ
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition px-2 sm:px-3 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition"
            >
              Get started
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-bg-border bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-text-muted">
          <div>© {new Date().getFullYear()} AcademIQ. Built for UNILAG students.</div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-text-secondary transition">
              Log in
            </Link>
            <Link to="/register" className="hover:text-text-secondary transition">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
