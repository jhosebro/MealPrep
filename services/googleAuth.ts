import { Platform } from "react-native";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (Platform.OS === "web") {
    return signInWithGoogleWeb();
  }
  return signInWithGoogleNative();
}

async function signInWithGoogleWeb(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Error al iniciar sesión con Google",
    };
  }
}

async function signInWithGoogleNative(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { GoogleSignin } = await import(
      "@react-native-google-signin/google-signin"
    );

    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });

    await GoogleSignin.hasPlayServices();

    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if not signed in
    }

    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      return { success: false, error: "No se pudo obtener el token de Google" };
    }

    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.data.idToken,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session && data.user) {
      useAuthStore.getState().setUser({
        id: data.user.id,
        email: data.user.email,
      });
    }

    return { success: true };
  } catch (err: any) {
    if (err.code === "SIGN_IN_CANCELLED") {
      return { success: false, error: undefined };
    }
    return {
      success: false,
      error: err.message || "Error al iniciar sesión con Google",
    };
  }
}