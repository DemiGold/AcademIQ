import { Outlet, Link, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Home, BookOpen, Calculator, User, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import ThemeToggle from "../ui/ThemeToggle";
import { isPremium } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/cgpa", label: "CGPA", icon: Calculator },
  { to: "/profile", label: "Profile", icon: User },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  const profileLoading = useAuthStore((s) => s.profileLoading);
  const signOut = useAuthStore((s) => s.signOut);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading…</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading profile…</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  const premium = isPremium(profile);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="sticky top-0 z-30 border-b border-bg-border bg-bg-secondary/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-sm">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold text-text-primary">
              AcademIQ
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {premium && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-success/10 text-brand-success text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                Premium
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-bg-border bg-bg-secondary text-text-secondary hover:text-brand-danger hover:border-brand-danger/40 transition"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-bg-border bg-bg-secondary/95 backdrop-blur-md pb-safe">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium transition ${
                  isActive ? "text-brand-primary" : "text-text-muted"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
