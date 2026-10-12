import { supabase } from "./supabase";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  dob: string;
  student_id: string;
  faculty: string;
  department: string;
  academic_year: string;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signUp(payload: RegisterPayload) {
  const { email, password, ...metadata } = payload;
  return supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}