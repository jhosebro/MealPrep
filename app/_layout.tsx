import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";

import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";

const SESSION_KEY = "app_session";

export default function RootLayout() {
  useEffect(() => {
    // On web, handle OAuth redirect code exchange
    if (Platform.OS === "web") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data.session) {
            window.history.replaceState({}, "", url.pathname);
          }
        });
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        await useAuthStore.getState().clearSession();
      } else if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        useAuthStore.getState().setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
