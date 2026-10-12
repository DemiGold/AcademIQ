import { useQuery } from "@tanstack/react-query";
import { fetchCoursesWithStats } from "../services/courseService";

export function useCourses() {
  return useQuery({
    queryKey: ["student-courses"],
    queryFn: fetchCoursesWithStats,
    staleTime: 60_000,
  });
}