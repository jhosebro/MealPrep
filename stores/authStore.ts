import { create } from "zustand";
import { supabase } from "../services/supabase";
interface AuthState {
  user: { id: string; email?: string } | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ loading: false });
      return { error };
    }
    set({ user: data.user, loading: false });
    return { error: null };
  },
  signUp: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false });
      return { error };
    }
    set({ user: data.user, loading: false });
    return { error: null };
  },
  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) set({ user: session.user });
    set({ initialized: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
