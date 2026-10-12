import { supabase } from "./supabase";
import type { Course } from "../lib/types";

export interface CourseWithStats extends Course {
  total_questions: number;
  available_questions: number;
}

export async function fetchCoursesWithStats(): Promise<CourseWithStats[]> {
  const [coursesRes, statsRes] = await Promise.all([
    supabase.from("courses").select("*").eq("is_active", true).order("code"),
    supabase.rpc("student_course_stats"),
  ]);

  if (coursesRes.error) throw new Error(coursesRes.error.message);
  if (statsRes.error) throw new Error(statsRes.error.message);

  type StatRow = {
    course_id: string;
    total_questions: number;
    available_questions: number;
  };

  const statsMap: Record<string, StatRow> = {};
  for (const s of (statsRes.data as StatRow[]) ?? []) {
    statsMap[s.course_id] = s;
  }

  return ((coursesRes.data ?? []) as Course[]).map((c) => ({
    ...c,
    total_questions: statsMap[c.id]?.total_questions ?? 0,
    available_questions: statsMap[c.id]?.available_questions ?? 0,
  }));
}