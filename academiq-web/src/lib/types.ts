export type Role = "student" | "super_admin";
export type Faculty = "Science" | "Management Sciences" | "Engineering";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  dob: string | null;
  student_id: string | null;
  faculty: Faculty | null;
  department: string | null;
  academic_year: string | null;
  role: Role;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  target_faculties: string[];
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  course_id: string;
}

export interface Question {
  id: string;
  course_id: string;
  topic_id: string | null;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topic_name: string | null;
}

export interface ExamAnswer {
  question_id: string;
  selected_index: number | null;
}

export interface ExamAttempt {
  id: string;
  client_uuid: string;
  course_id: string;
  course_code: string;
  score_percent: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
}