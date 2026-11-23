import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_KEY } from "@/lib/cache";
import { useAuthStore } from "@/stores/authStore";
import { biometricService } from "@/services/biometricService";
import { BrandMark } from "@/components/brand-logo";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function Index() {
  const { user, initialize, signOut } = useAuthStore();
  const router = useRouter();
  const colors = Colors[useColorScheme() === "dark" ? "dark" : "light"];
  const [ready, setReady] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (user) {
      const checkBiometric = async () => {
        const enabled = await biometricService.isEnabled();
        if (enabled) {
          const available = await biometricService.isAvailable();
          if (available) {
            const ok = await biometricService.authenticate();
            if (ok) {
              router.replace("/(tabs)/home" as any);
            } else {
              setBiometricFailed(true);
            }
          } else {
            router.replace("/(tabs)/home" as any);
          }
        } else {
          router.replace("/(tabs)/home" as any);
        }
      };
      checkBiometric();
    } else {
      // El flag se lee antes de decidir la ruta, para no mostrar el login un instante en el primer arranque.
      AsyncStorage.getItem(ONBOARDING_KEY).then((done) =>
        router.replace((done ? "/login" : "/onboarding") as any)
      );
    }
  }, [ready, user]);

  if (biometricFailed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 8, backgroundColor: colors.background }}>
        <BrandMark size={72} />
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: "center", color: colors.text }}>
          No pudimos autenticarte con tu huella
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}
          accessibilityRole="button"
          onPress={async () => {
            const ok = await biometricService.authenticate();
            if (ok) {
              router.replace("/(tabs)/home" as any);
            }
          }}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: "600" }}>
            Intentar de nuevo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          // Cerrar sesión antes de ir al login: si no, la sesión activa saltaría el bloqueo biométrico.
          onPress={async () => {
            await signOut();
            router.replace("/login" as any);
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 16 }}>
            Usar contraseña
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24, backgroundColor: colors.background }}>
      <BrandMark size={96} />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
