import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Key,
  Users,
  BarChart3,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/overview", label: "Overview", icon: LayoutDashboard },
      { to: "/attempts", label: "Attempts", icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/courses", label: "Courses", icon: BookOpen },
      { to: "/questions", label: "Questions", icon: HelpCircle },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/tokens", label: "Tokens", icon: Key },
      { to: "/users", label: "Users", icon: Users },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const isAdmin = useIsAdmin();
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);

  // Auto-logout after 30 minutes of inactivity
  useIdleTimeout(30);

  // Show loading until auth state settles — prevents back-button flash
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading…</div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const displayName = profile?.username ?? "DemiG";

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-bg-border flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-bg-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1A5276] to-[#2E86C1] flex items-center justify-center shadow-sm">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-text-primary">AcademIQ</div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Admin Panel
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.label} className={idx > 0 ? "mt-5" : ""}>
              <div className="px-2 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-brand-primary/8 text-brand-primary"
                          : "text-text-secondary hover:bg-bg-primary/50 hover:text-text-primary"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-brand-primary" />
                        )}
                        <Icon
                          size={17}
                          className={
                            isActive
                              ? "text-brand-primary"
                              : "text-text-muted group-hover:text-text-secondary"
                          }
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-bg-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1A5276] to-[#2E86C1] flex items-center justify-center ring-2 ring-brand-primary/10 shrink-0">
              <GraduationCap size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text-primary truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-text-muted truncate">
                Super Admin
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-bg-border flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-text-primary">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
              Online
            </span>
            <div className="flex items-center gap-2.5 pl-3 border-l border-bg-border">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1A5276] to-[#2E86C1] flex items-center justify-center ring-2 ring-brand-primary/10">
                <GraduationCap size={14} className="text-white" />
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-text-primary">
                  {displayName}
                </div>
                <div className="text-[10px] text-text-muted">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}