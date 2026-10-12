import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "../services/questionService";

export function useQuestions(courseId: string | undefined, topicId: string | null = null) {
  return useQuery({
    queryKey: ["questions", courseId, topicId],
    queryFn: () => fetchQuestions({ courseId: courseId!, topicId }),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}