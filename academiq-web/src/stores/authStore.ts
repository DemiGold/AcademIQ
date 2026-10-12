import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import type { Profile } from "../lib/types";

let authUnsubscribe: (() => void) | null = null;

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initialized: boolean;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,
  loading: false,
  profileLoading: false,

  refreshProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null, profileLoading: false });
      return;
    }
    set({ profileLoading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) {
      console.error("Profile fetch error:", error.message);
      set({ profile: null, profileLoading: false });
      return;
    }
    set({ profile: data as Profile, profileLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, profileLoading: false });
  },

  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });
      if (session?.user) await get().refreshProfile();
    } finally {
      set({ initialized: true, loading: false });
    }

    if (!authUnsubscribe) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          set({ session, user: session?.user ?? null });
          if (session?.user) {
            setTimeout(() => get().refreshProfile(), 0);
          } else {
            set({ profile: null, profileLoading: false });
          }
        }
      );
      authUnsubscribe = () => subscription.unsubscribe();
    }
  },
}));