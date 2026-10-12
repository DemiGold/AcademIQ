export const GRADE_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export const GRADE_OPTIONS = ["A", "B", "C", "D", "E", "F"] as const;
export type Grade = typeof GRADE_OPTIONS[number];

export interface CourseEntry {
  id: string;
  code: string;
  units: number;
  grade: Grade;
}

export function classifyDegree(cgpa: number): {
  label: string;
  tone: "success" | "brand" | "warning" | "danger";
} {
  if (cgpa >= 4.5) return { label: "First Class", tone: "success" };
  if (cgpa >= 3.5) return { label: "Second Class Upper", tone: "brand" };
  if (cgpa >= 2.4) return { label: "Second Class Lower", tone: "warning" };
  if (cgpa >= 1.5) return { label: "Third Class", tone: "warning" };
  return { label: "Pass / Fail", tone: "danger" };
}

export function calculateCGPA(courses: CourseEntry[]): {
  cgpa: number;
  totalUnits: number;
  totalPoints: number;
} {
  let totalUnits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    if (c.units > 0) {
      totalUnits += c.units;
      totalPoints += c.units * GRADE_POINTS[c.grade];
    }
  }
  const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
  return { cgpa, totalUnits, totalPoints };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}