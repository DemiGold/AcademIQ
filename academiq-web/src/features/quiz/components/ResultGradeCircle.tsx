interface Props {
  percentage: number;
  grade: string;
}

const COLORS = {
  a: "from-[#16A34A] to-[#22C55E]",
  b: "from-[#0EA5E9] to-[#38BDF8]",
  c: "from-[#D97706] to-[#F59E0B]",
  d: "from-[#EA580C] to-[#FB923C]",
  f: "from-[#DC2626] to-[#EF4444]",
} as const;

function colorFor(pct: number): keyof typeof COLORS {
  if (pct >= 70) return "a";
  if (pct >= 60) return "b";
  if (pct >= 50) return "c";
  if (pct >= 45) return "d";
  return "f";
}

export default function ResultGradeCircle({ percentage, grade }: Props) {
  const color = COLORS[colorFor(percentage)];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-2xl`}
      >
        {/* Inner ring */}
        <div className="absolute inset-2 rounded-full border-4 border-white/20" />

        <div className="flex flex-col items-center">
          <span className="text-5xl sm:text-6xl font-black text-white leading-none">
            {percentage}
            <span className="text-2xl sm:text-3xl">%</span>
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wider mt-1">
            Score
          </span>
        </div>
      </div>

      <div
        className={`inline-flex px-5 py-2 rounded-full bg-gradient-to-br ${color} shadow-lg`}
      >
        <span className="text-lg sm:text-xl font-bold text-white">
          {grade}
        </span>
      </div>
    </div>
  );
}