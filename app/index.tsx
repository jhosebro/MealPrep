import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const { user, initialize } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    
    if (user) {
      // @ts-ignore
      router.replace("/(tabs)/home");
    } else {
      // @ts-ignore
      router.replace("/login");
    }
  }, [ready, user]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}