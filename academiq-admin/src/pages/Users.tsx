import { useState, useMemo} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users as UsersIcon,
  Crown,
  UserX,
  Shield,
  MoreVertical,
  X,
  Check,
  UserCog,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  fetchAdminUsers,
  adminSetPremium,
  adminUpdateUsername,
  type AdminUserRow,
} from "../services/adminService";

const PAGE_SIZE = 50;

export default function Users() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "premium" | "free" | "admin">("all");
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState<AdminUserRow | null>(null);

  // Debounce search
  useMemo(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: () => fetchAdminUsers(debouncedSearch, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    placeholderData: (prev) => prev,
  });

  const rows = usersQuery.data?.rows ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "premium")
      return rows.filter(
        (u) => u.premium_expires_at && new Date(u.premium_expires_at) > new Date()
      );
    if (filter === "free")
      return rows.filter(
        (u) => !u.premium_expires_at || new Date(u.premium_expires_at) <= new Date()
      );
    if (filter === "admin") return rows.filter((u) => u.role === "super_admin");
    return rows;
  }, [rows, filter]);

  const stats = useMemo(() => {
    const admins = rows.filter((u) => u.role === "super_admin").length;
    const premium = rows.filter(
      (u) => u.premium_expires_at && new Date(u.premium_expires_at) > new Date()
    ).length;
    return {
      admins,
      premium,
      free: rows.length - premium - admins,
    };
  }, [rows]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Users</h2>
          <p className="text-sm text-text-secondary mt-1">
            View and manage every account on the platform.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={UsersIcon} label="Total" value={total} tone="brand" />
        <MiniStat icon={Crown} label="Premium" value={stats.premium} tone="success" />
        <MiniStat icon={UserX} label="Free" value={stats.free} tone="muted" />
        <MiniStat icon={Shield} label="Admins" value={stats.admins} tone="warning" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-bg-border p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by email, username, or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
          />
        </div>

        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg">
          {(["all", "premium", "free", "admin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-bg-border overflow-hidden">
        {usersQuery.isLoading ? (
          <div className="p-16 text-center text-text-muted text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!debouncedSearch} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-bg-border bg-bg-primary/40">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3 w-32">Student ID</th>
                <th className="px-5 py-3 w-40">Department</th>
                <th className="px-5 py-3 w-40">Status</th>
                <th className="px-5 py-3 w-32">Joined</th>
                <th className="px-5 py-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isPremium =
                  u.premium_expires_at && new Date(u.premium_expires_at) > new Date();
                const daysLeft = u.premium_expires_at
                  ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(u.premium_expires_at).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0;
                const isAdmin = u.role === "super_admin";

                return (
                  <tr
                    key={u.id}
                    className="border-b border-bg-border last:border-0 hover:bg-bg-primary/30 transition group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAdmin
                              ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                              : isPremium
                              ? "bg-gradient-to-br from-[#1A5276] to-[#2E86C1] text-white"
                              : "bg-bg-tertiary text-text-secondary"
                          }`}
                        >
                          {getInitials(u.username, u.full_name, u.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-text-primary truncate">
                            {u.username ?? "—"}
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            {u.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary font-mono">
                      {u.student_id ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">
                      <div>{u.department ?? "—"}</div>
                      {u.academic_year && (
                        <div className="text-text-muted mt-0.5">{u.academic_year}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <Shield size={11} />
                          Admin
                        </span>
                      ) : isPremium ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-bold">
                            <Crown size={11} />
                            Premium
                          </span>
                          <div className="text-[10px] text-text-muted mt-1">
                            {daysLeft}d remaining
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted text-xs font-semibold">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">
                      {new Date(u.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setActionUser(u)}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition opacity-0 group-hover:opacity-100"
                        title="Manage user"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing{" "}
            <span className="font-semibold text-text-secondary">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-semibold text-text-secondary">{total}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-text-secondary font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Action drawer */}
      <UserActionDrawer
        user={actionUser}
        onClose={() => setActionUser(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-users"] });
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        }}
      />
    </div>
  );
}

/* ============================================
   User Action Drawer
   ============================================ */
function UserActionDrawer({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [premiumDays, setPremiumDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when a new user opens
  useMemo(() => {
    if (user) {
      setUsername(user.username ?? "");
      setError(null);
    }
  }, [user?.id]);

  if (!user) return null;

  const isPremiumNow =
    user.premium_expires_at && new Date(user.premium_expires_at) > new Date();

  const handleUpdateUsername = async () => {
    if (username.trim() === (user.username ?? "")) return;
    setSaving(true);
    setError(null);
    try {
      await adminUpdateUsername(user.id, username.trim());
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPremium = async (days: number) => {
    setSaving(true);
    setError(null);
    try {
      const base = isPremiumNow
        ? new Date(user.premium_expires_at!)
        : new Date();
      const expiry = new Date(base.getTime() + days * 86400000);
      await adminSetPremium(user.id, expiry.toISOString());
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !confirm(
        `Revoke premium access for ${user.username ?? user.email}?\n\nThey'll revert to free tier immediately.`
      )
    )
      return;
    setSaving(true);
    setError(null);
    try {
      await adminSetPremium(user.id, null);
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-bg-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-bold text-text-primary">Manage User</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {user.username ?? user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User info card */}
          <div className="bg-bg-primary/40 rounded-xl p-4 space-y-3">
            <InfoRow label="Email" value={user.email ?? "—"} />
            <InfoRow label="Student ID" value={user.student_id ?? "—"} />
            <InfoRow label="Department" value={user.department ?? "—"} />
            <InfoRow label="Academic Year" value={user.academic_year ?? "—"} />
            <InfoRow label="Phone" value={user.phone ?? "—"} />
            <InfoRow
              label="Joined"
              value={new Date(user.created_at).toLocaleString("en-NG")}
            />
            <InfoRow
              label="Role"
              value={
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    user.role === "super_admin"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-bg-tertiary text-text-secondary"
                  }`}
                >
                  {user.role}
                </span>
              }
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="New username"
                className="flex-1 px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              />
              <button
                onClick={handleUpdateUsername}
                disabled={saving || username.trim() === (user.username ?? "")}
                className="px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={15} /> Save
              </button>
            </div>
          </div>

          {/* Premium section */}
          {user.role !== "super_admin" && (
            <div className="border-t border-bg-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown
                    size={16}
                    className={isPremiumNow ? "text-brand-success" : "text-text-muted"}
                  />
                  <span className="text-sm font-bold text-text-primary">
                    Premium Access
                  </span>
                </div>
                {isPremiumNow && (
                  <span className="text-xs text-text-muted">
                    Expires{" "}
                    {new Date(user.premium_expires_at!).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={premiumDays}
                    onChange={(e) => setPremiumDays(parseInt(e.target.value) || 30)}
                    className="w-24 px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => handleGrantPremium(premiumDays)}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-500/20"
                  >
                    <Calendar size={15} />
                    {isPremiumNow ? "Extend" : "Grant"} {premiumDays} days
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGrantPremium(30)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-lg border border-bg-border text-text-secondary text-xs font-semibold hover:bg-bg-tertiary transition disabled:opacity-50"
                  >
                    +30d
                  </button>
                  <button
                    onClick={() => handleGrantPremium(90)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-lg border border-bg-border text-text-secondary text-xs font-semibold hover:bg-bg-tertiary transition disabled:opacity-50"
                  >
                    +90d
                  </button>
                  <button
                    onClick={() => handleGrantPremium(365)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-lg border border-bg-border text-text-secondary text-xs font-semibold hover:bg-bg-tertiary transition disabled:opacity-50"
                  >
                    +1yr
                  </button>
                </div>

                {isPremiumNow && (
                  <button
                    onClick={handleRevoke}
                    disabled={saving}
                    className="w-full px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={15} /> Revoke Premium
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-muted font-medium">{label}</span>
      <span className="text-text-primary font-semibold text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

function getInitials(
  username: string | null,
  fullName: string | null,
  email: string | null
): string {
  const source = fullName || username || email || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "muted";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-amber-100 text-amber-700",
    muted: "bg-bg-tertiary text-text-muted",
  };

  return (
    <div className="bg-white border border-bg-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {label}
        </div>
        <div className="text-xl font-bold text-text-primary leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
        <UsersIcon size={24} className="text-text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {hasSearch ? "No matching users" : "No users yet"}
      </h3>
      <p className="text-xs text-text-secondary max-w-xs mx-auto">
        {hasSearch
          ? "Try a different search term."
          : "Students will appear here after they sign up in the mobile app."}
      </p>
    </div>
  );
}