import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrandMark } from "@/components/brand-logo";
import { ClayButton, ClayCard } from "@/components/clay";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ONBOARDING_KEY } from "@/lib/cache";

const SLIDES = [
  { title: "Tu nevera, siempre al día", body: "Registra lo que compras y marca lo que se agota. Escanea el código de barras para ir más rápido." },
  { title: "Recetas con lo que tienes", body: "Guarda tus recetas y te sugerimos cuáles cocinar con los ingredientes disponibles." },
  { title: "Compras dentro del presupuesto", body: "La lista de compras se arma sola con lo agotado y te muestra cuánto llevas gastado." },
];

export default function Onboarding() {
  const router = useRouter();
  const colors = Colors[useColorScheme() === "dark" ? "dark" : "light"];
  const [step, setStep] = useState(0);
  const last = step === SLIDES.length - 1;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/login" as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 24, gap: 24, justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" }}>
        <View style={{ alignItems: "flex-end" }}>
          {!last && (
            <ClayButton variant="ghost" onPress={finish}>
              Saltar
            </ClayButton>
          )}
        </View>
        <View style={{ alignItems: "center" }}>
          <BrandMark size={88} />
        </View>
        <ClayCard style={{ gap: 12, padding: 24 }} accessibilityLiveRegion="polite">
          <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
            {SLIDES[step].title}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: colors.textSecondary }}>{SLIDES[step].body}</Text>
        </ClayCard>
        <View
          accessible
          accessibilityLabel={`Paso ${step + 1} de ${SLIDES.length}`}
          style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? colors.primary : colors.border }}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {step > 0 && (
            <ClayButton variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }}>
              Atrás
            </ClayButton>
          )}
          <ClayButton onPress={last ? finish : () => setStep(step + 1)} style={{ flex: 1 }}>
            {last ? "Empezar" : "Siguiente"}
          </ClayButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
