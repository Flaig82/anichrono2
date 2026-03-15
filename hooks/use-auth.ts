import { create } from "zustand";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/user";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  initialize: () => () => void;
  refreshProfile: () => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,

  initialize: () => {
    const supabase = createClient();

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) {
        set({ profile: data as UserProfile });
      }
    }

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      set({ user, isLoading: false });
      if (user) {
        fetchProfile(user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      set({ user: currentUser });

      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        set({ profile: null });
      }
    });

    return () => subscription.unsubscribe();
  },

  refreshProfile: () => {
    const supabase = createClient();
    const { user } = useAuth.getState();
    if (!user) return;
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) set({ profile: data as UserProfile });
      });
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, profile: null });
    window.location.href = "/";
  },
}));
