import { supabase } from "@/services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SESSION_KEY = "app_session"; // legado: ya no se escribe

interface AuthState {
  user: { id: string; email?: string } | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
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
    set({ user: data.user, loading: false, initialized: true });
    return { error: null };
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ loading: false });
      return { error };
    }
    // Con confirmación de correo activa no hay sesión: no marcar al usuario como logueado.
    if (!data.session) {
      set({ loading: false });
      return { error: null, needsConfirmation: true };
    }
    set({ user: data.user, loading: false, initialized: true });
    return { error: null };
  },

  initialize: async () => {
    const TIMEOUT_MS = 10000;

    const restore = async () => {
      // Purga la copia legada en texto plano; Supabase ya persiste la sesión en almacenamiento seguro.
      await AsyncStorage.removeItem(SESSION_KEY);
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
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(SESSION_KEY);
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
