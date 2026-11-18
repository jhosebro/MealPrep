import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "";

// SecureStore admite ~2 KB por valor; la sesión de Supabase puede superarlo, así que se trocea.
const CHUNK = 1800;

async function removeChunks(key: string) {
  const n = Number(await SecureStore.getItemAsync(`${key}.n`)) || 0;
  for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  await SecureStore.deleteItemAsync(`${key}.n`);
}

/** Guarda la sesión cifrada (Keychain / Android Keystore) en vez de en AsyncStorage en texto plano. */
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const n = Number(await SecureStore.getItemAsync(`${key}.n`)) || 0;
    if (n > 0) {
      const parts: string[] = [];
      for (let i = 0; i < n; i++) parts.push((await SecureStore.getItemAsync(`${key}.${i}`)) ?? "");
      return parts.join("");
    }
    // Migración única: sesiones antiguas guardadas en AsyncStorage pasan a SecureStore y se borran de allí.
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      await secureSessionStorage.setItem(key, legacy);
      await AsyncStorage.removeItem(key);
    }
    return legacy;
  },
  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
});
