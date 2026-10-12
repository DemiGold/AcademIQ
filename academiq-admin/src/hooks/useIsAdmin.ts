import { useAuthStore } from "../stores/authStore";

export function useIsAdmin(): boolean {
  const profile = useAuthStore((s) => s.profile);
  return profile?.role === "super_admin";
}