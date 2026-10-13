import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerStep1Schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15, "Phone number too long"),
  dob: z.string().min(1, "Date of birth is required"),
});
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

export const registerStep2Schema = z.object({
  student_id: z.string().regex(/^(2026\d{8}[A-Za-z]{2}|\d{9})$/, "Must be a 9-digit Matric No. or a 2026 JAMB Reg No. (e.g., 202612345678AB)"),
  faculty: z.enum(["Science", "Management Sciences", "Engineering"], {
    message: "Choose your faculty",
  }),
  department: z.string().min(1, "Choose your department"),
  academic_year: z.string().min(1, "Choose your year"),
});
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;

export const registerStep3Schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });
export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;