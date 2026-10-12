export type Role = "student" | "super_admin";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  dob: string | null;
  student_id: string | null;
  department: string | null;
  academic_year: string | null;
  role: Role;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}