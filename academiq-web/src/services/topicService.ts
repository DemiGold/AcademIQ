import { supabase } from "./supabase";
import type { Topic } from "../lib/types";

export async function fetchTopics(courseId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, course_id, summary")
    .eq("course_id", courseId)
    .order("name");
  if (error) throw new Error(error.message);
  return data as Topic[];
}
