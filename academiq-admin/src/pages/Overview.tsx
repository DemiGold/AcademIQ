import { useQuery } from "@tanstack/react-query";
import { Users, Crown, UserX, Key, Ticket, Banknote } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/ui/ChartCard";
import ActivityList from "../components/ui/ActivityList";
import SignupsChart from "../features/overview/components/SignupsChart";
import PremiumDoughnut from "../features/overview/components/PremiumDoughnut";
import {
  fetchAdminStats,
  fetchRecentActivity,
  fetchSignupsSeries,
} from "../services/adminService";

export default function Overview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    refetchOnWindowFocus: true,
  });

  const activity = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: fetchRecentActivity,
    refetchOnWindowFocus: true,
  });

  const signups = useQuery({
    queryKey: ["admin-signups-series", 30],
    queryFn: () => fetchSignupsSeries(30),
    refetchOnWindowFocus: true,
  });

  if (stats.isLoading) {
    return <div className="text-text-secondary">Loading…</div>;
  }

  if (stats.error || !stats.data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        Failed to load stats: {(stats.error as Error)?.message ?? "Unknown"}
      </div>
    );
  }

  const s = stats.data;
  const revenueFormatted = `₦${s.revenue_naira.toLocaleString()}`;

  const activationItems = (activity.data?.recent_activations ?? []).map((a) => ({
    primary: a.email ?? "Unknown user",
    secondary: a.token_code ? `Redeemed ${a.token_code}` : "Premium activated",
    timestamp: a.at,
    accent: "success" as const,
  }));

  const signupItems = (activity.data?.recent_signups ?? []).map((a) => ({
    primary: a.username ?? a.email ?? "Unknown",
    secondary: a.email ?? "New student",
    timestamp: a.at,
    accent: "brand" as const,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Overview</h2>
        <p className="text-sm text-text-secondary">
          Platform metrics at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Students" value={s.total_students} icon={Users} accent="brand" />
        <StatCard label="Premium" value={s.premium_students} icon={Crown} accent="success" />
        <StatCard label="Free Trial" value={s.free_students} icon={UserX} accent="muted" />
        <StatCard label="Tokens Claimed" value={s.tokens_claimed} icon={Ticket} accent="warning" />
        <StatCard label="Tokens Available" value={s.tokens_unused} icon={Key} accent="brand" />
        <StatCard label="Est. Revenue" value={revenueFormatted} icon={Banknote} accent="success" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Signups" subtitle="Last 30 days">
          {signups.data ? <SignupsChart data={signups.data} /> : (
            <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">
              Loading…
            </div>
          )}
        </ChartCard>

        <ChartCard title="Premium vs Free" subtitle="Current distribution">
          <PremiumDoughnut premium={s.premium_students} free={s.free_students} />
        </ChartCard>
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Recent Activations" subtitle="Latest token redemptions">
          {activity.data ? (
            <ActivityList items={activationItems} emptyText="No premium activations yet" />
          ) : (
            <div className="text-sm text-text-muted py-8 text-center">Loading…</div>
          )}
        </ChartCard>

        <ChartCard title="Recent Signups" subtitle="Newest students">
          {activity.data ? (
            <ActivityList items={signupItems} emptyText="No students yet" />
          ) : (
            <div className="text-sm text-text-muted py-8 text-center">Loading…</div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}