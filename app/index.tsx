import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { biometricService } from "@/services/biometricService";

export default function Index() {
  const { user, initialize } = useAuthStore();
  const router = useRouter();
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
      router.replace("/login" as any);
    }
  }, [ready, user]);

  if (biometricFailed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: "center" }}>
          No pudimos autenticarte con tu huella
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#4CAF50",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={async () => {
            const ok = await biometricService.authenticate();
            if (ok) {
              router.replace("/(tabs)/home" as any);
            }
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Intentar de nuevo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/login" as any)}>
          <Text style={{ color: "#4CAF50", fontSize: 16 }}>
            Usar contraseña
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}
