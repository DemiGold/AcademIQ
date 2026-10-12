import { supabase } from "./supabase";
import type { Question } from "../lib/types";

interface RawQuestion {
  id: string;
  course_id: string;
  topic_id: string | null;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topics: { name: string } | null;
}

export interface FetchQuestionsParams {
  courseId: string;
  topicId?: string | null;
}

export async function fetchQuestions({
  courseId,
  topicId = null,
}: FetchQuestionsParams): Promise<Question[]> {
  const { data, error } = await supabase.rpc("get_questions_for_course", {
    p_course_id: courseId,
    p_topic_id: topicId,
  });

  if (error) throw new Error(error.message);

  return ((data ?? []) as RawQuestion[]).map((q) => ({
    id: q.id,
    course_id: q.course_id,
    topic_id: q.topic_id,
    question_text: q.question_text,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    topic_name: q.topics?.name ?? null,
  }));
}