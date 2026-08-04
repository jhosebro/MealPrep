import { supabase } from "@/services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SESSION_KEY = "app_session";

interface AuthState {
  user: { id: string; email?: string } | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: { id: string; email?: string } | null) => void;
  clearSession: () => Promise<void>;
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
    if (data.session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
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
    if (data.session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
    }
    set({ user: data.user, loading: false });
    return { error: null };
  },

  initialize: async () => {
    const TIMEOUT_MS = 10000;

    const restore = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({
          user: { id: session.user.id, email: session.user.email },
          initialized: true,
        });
        return;
      }

      const stored = await AsyncStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const { data } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (data.session) {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
        }
        if (data.user) {
          set({
            user: { id: data.user.id, email: data.user.email },
            initialized: true,
          });
          return;
        }
      }

      set({ user: null, initialized: true });
    };

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Session restoration timed out")), TIMEOUT_MS)
    );

    try {
      await Promise.race([restore(), timeout]);
    } catch {
      await AsyncStorage.removeItem(SESSION_KEY);
      set({ user: null, initialized: true });
    }
  },

  signOut: async () => {
    set({ user: null });
  },

  setUser: (user) => {
    set({ user });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null });
  },
}));
