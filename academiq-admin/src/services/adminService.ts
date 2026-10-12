import { supabase } from "./supabase";

export interface AdminStats {
  total_students: number;
  premium_students: number;
  free_students: number;
  admin_accounts: number;
  tokens_total: number;
  tokens_claimed: number;
  tokens_unused: number;
  revenue_naira: number;
  attempts_total: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw new Error(error.message);
  return data as AdminStats;
}

export interface ActivityItem {
  email: string | null;
  username?: string | null;
  at: string;
  token_code?: string;
}

export interface RecentActivity {
  recent_activations: ActivityItem[];
  recent_signups: ActivityItem[];
}

export interface SeriesPoint {
  day: string;
  count: number;
}

export async function fetchRecentActivity(): Promise<RecentActivity> {
  const { data, error } = await supabase.rpc("admin_recent_activity");
  if (error) throw new Error(error.message);
  return data as RecentActivity;
}

export async function fetchSignupsSeries(days = 30): Promise<SeriesPoint[]> {
  const { data, error } = await supabase.rpc("admin_signups_series", { p_days: days });
  if (error) throw new Error(error.message);
  return data as SeriesPoint[];
}

export interface TokenRow {
  id: string;
  token_code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  price_naira: number;
  used_by_email: string | null;
}

export interface TokenListResult {
  total: number;
  rows: TokenRow[];
}

export async function fetchTokens(
  status: "all" | "used" | "unused" = "all",
  limit = 100,
  offset = 0
): Promise<TokenListResult> {
  const { data, error } = await supabase.rpc("admin_list_tokens", {
    p_status: status,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return data as TokenListResult;
}

export async function generateTokens(count: number, price = 2000): Promise<string[]> {
  const { data, error } = await supabase.rpc("admin_generate_tokens", {
    p_count: count,
    p_price: price,
  });
  if (error) throw new Error(error.message);
  return data as string[];
}

export async function deleteToken(tokenId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("admin_delete_token", {
    p_token_id: tokenId,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export interface CourseOption {
  id: string;
  code: string;
  name: string;
}

export interface TopicOption {
  id: string;
  name: string;
  course_id: string;
}

export interface QuestionRow {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  is_free: boolean;
  status: "draft" | "published";
  created_at: string;
  topic_id: string | null;
  course_id: string;
  academic_session: string | null;
  semester: string | null;
  institution: string | null;
  topics: { name: string } | null;
  courses: { code: string } | null;
}

export interface QuestionFilters {
  courseId: string;
  topicId?: string | null;
  status?: "all" | "draft" | "published";
  page?: number;
  pageSize?: number;
}

export interface QuestionListResult {
  rows: QuestionRow[];
  total: number;
}

export async function fetchCourses(): Promise<CourseOption[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, name")
    .order("code");
  if (error) throw new Error(error.message);
  return data as CourseOption[];
}

export async function fetchTopics(courseId: string): Promise<TopicOption[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, course_id")
    .eq("course_id", courseId)
    .order("name");
  if (error) throw new Error(error.message);
  return data as TopicOption[];
}

export async function fetchQuestions(
  filters: QuestionFilters
): Promise<QuestionListResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("questions")
    .select(
      "id, question_text, options, correct_index, explanation, is_free, status, created_at, topic_id, course_id, academic_session, semester, institution, topics(name), courses(code)",
      { count: "exact" }
    )
    .eq("course_id", filters.courseId);

  if (filters.topicId) {
    query = query.eq("topic_id", filters.topicId);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as QuestionRow[], total: count ?? 0 };
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "This question has already been answered by students and can't be deleted. Set it to 'Draft' instead to hide it from future exams."
      );
    }
    throw new Error(error.message);
  }
}

export interface QuestionPayload {
  course_id: string;
  topic_id: string | null;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  academic_session: string | null;
  semester: string | null;
  institution: string | null;
  is_free: boolean;
  status: "draft" | "published";
}

export async function createQuestion(payload: QuestionPayload): Promise<void> {
  const { error } = await supabase.from("questions").insert([payload]);
  if (error) throw new Error(error.message);
}

export async function updateQuestion(
  id: string,
  payload: Partial<QuestionPayload>
): Promise<void> {
  const { error } = await supabase.from("questions").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export interface CourseRow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  target_faculties: string[];
  created_at: string;
  question_count?: number;
}

export async function fetchAllCourses(): Promise<CourseRow[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, name, is_active, target_faculties, created_at")
    .order("code");
  if (error) throw new Error(error.message);
  return data as CourseRow[];
}

export async function createCourse(
  code: string,
  name: string,
  target_faculties: string[] = []
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .insert([
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        target_faculties,
      },
    ]);
  if (error) throw new Error(error.message);
}

export async function updateCourse(
  id: string,
  patch: { code?: string; name?: string; target_faculties?: string[] }
): Promise<void> {
  const normalized: {
    code?: string;
    name?: string;
    target_faculties?: string[];
  } = {};
  if (patch.code !== undefined) normalized.code = patch.code.trim().toUpperCase();
  if (patch.name !== undefined) normalized.name = patch.name.trim();
  if (patch.target_faculties !== undefined)
    normalized.target_faculties = patch.target_faculties;
  const { error } = await supabase.from("courses").update(normalized).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleCourseActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({ is_active: !isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "This course has questions that students have already answered. Use 'Hide' instead to remove it from the app, or delete the questions first."
      );
    }
    throw new Error(error.message);
  }
}

export async function fetchQuestionCountsByCourse(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.rpc("admin_question_counts");
    if (error) throw error;
    const payload = data as { by_course: Record<string, number> };
    return payload.by_course ?? {};
  } catch (err) {
    console.warn("admin_question_counts failed, falling back:", err);
    const { data, error } = await supabase.from("questions").select("course_id");
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const cid = (row as { course_id: string }).course_id;
      counts[cid] = (counts[cid] ?? 0) + 1;
    }
    return counts;
  }
}

export async function fetchQuestionCountsByTopic(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.rpc("admin_question_counts");
    if (error) throw error;
    const payload = data as { by_topic: Record<string, number> };
    return payload.by_topic ?? {};
  } catch (err) {
    console.warn("admin_question_counts failed, falling back:", err);
    const { data, error } = await supabase
      .from("questions")
      .select("topic_id")
      .not("topic_id", "is", null);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const tid = (row as { topic_id: string | null }).topic_id;
      if (tid) counts[tid] = (counts[tid] ?? 0) + 1;
    }
    return counts;
  }
}

// ============================================
// TOPIC CRUD
// ============================================
export async function createTopic(courseId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("topics")
    .insert([{ course_id: courseId, name: name.trim() }]);
  if (error) throw new Error(error.message);
}

export async function renameTopic(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("topics")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================
// ADMIN USERS
// ============================================
export interface AdminUserRow {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  student_id: string | null;
  department: string | null;
  academic_year: string | null;
  faculty: string | null;
  role: "student" | "super_admin";
  premium_expires_at: string | null;
  created_at: string;
}

export interface AdminUserListResult {
  total: number;
  rows: AdminUserRow[];
}

export async function fetchAdminUsers(
  search: string = "",
  limit = 50,
  offset = 0
): Promise<AdminUserListResult> {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: search || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return data as AdminUserListResult;
}

export async function adminSetPremium(
  userId: string,
  expiresAt: string | null
): Promise<string | null> {
  const { data, error } = await supabase.rpc("admin_set_premium", {
    p_user_id: userId,
    p_expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return data as string | null;
}

export async function adminUpdateUsername(userId: string, username: string): Promise<void> {
  const { error } = await supabase.rpc("admin_update_username", {
    p_user_id: userId,
    p_username: username,
  });
  if (error) throw new Error(error.message);
}

// ============================================
// ATTEMPTS
// ============================================
export interface AttemptRow {
  id: string;
  score_percent: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
  course_id: string;
  course_code: string;
  course_name: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
}

export interface AttemptListResult {
  total: number;
  rows: AttemptRow[];
}

export interface AttemptStats {
  total_attempts: number;
  average_score: number;
  pass_count: number;
  pass_rate: number;
  unique_students: number;
}

export interface AttemptAnswer {
  id: string;
  selected_index: number | null;
  is_correct: boolean;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export interface AttemptDetail {
  attempt: AttemptRow;
  answers: AttemptAnswer[];
}

export async function fetchAttempts(params: {
  search?: string;
  courseId?: string | null;
  minScore?: number | null;
  maxScore?: number | null;
  page?: number;
  pageSize?: number;
}): Promise<AttemptListResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const { data, error } = await supabase.rpc("admin_list_attempts", {
    p_search: params.search || null,
    p_course_id: params.courseId || null,
    p_min_score: params.minScore ?? null,
    p_max_score: params.maxScore ?? null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw new Error(error.message);
  return data as AttemptListResult;
}

export async function fetchAttemptStats(): Promise<AttemptStats> {
  const { data, error } = await supabase.rpc("admin_attempt_stats");
  if (error) throw new Error(error.message);
  return data as AttemptStats;
}

export async function fetchAttemptDetail(attemptId: string): Promise<AttemptDetail> {
  const { data, error } = await supabase.rpc("admin_attempt_detail", {
    p_attempt_id: attemptId,
  });
  if (error) throw new Error(error.message);
  return data as AttemptDetail;
}