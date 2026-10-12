import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  premium: number;
  free: number;
}

export default function PremiumDoughnut({ premium, free }: Props) {
  const total = premium + free;
  const data = [
    { name: "Premium", value: premium, color: "#2ECC71" },
    { name: "Free", value: free, color: "#95A5A6" },
  ];

  if (total === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">
        No students yet
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-text-primary">
          {total > 0 ? Math.round((premium / total) * 100) : 0}%
        </span>
        <span className="text-xs text-text-muted">Premium</span>
      </div>

      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" />
          <span className="text-xs text-text-secondary">Premium ({premium})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#95A5A6]" />
          <span className="text-xs text-text-secondary">Free ({free})</span>
        </div>
      </div>
    </div>
  );
}