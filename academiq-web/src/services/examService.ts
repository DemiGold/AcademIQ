import { supabase } from "./supabase";
import type { ExamAnswer } from "../lib/types";

export async function submitExamAttempt(
  clientUuid: string,
  courseId: string,
  answers: ExamAnswer[]
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_attempt", {
    p_client_uuid: clientUuid,
    p_course_id: courseId,
    p_answers: answers,
  });
  if (error) throw new Error(error.message);
  return data as string;
}