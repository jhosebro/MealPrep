import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** Bloque gris que pulsa mientras llega la primera carga. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = Colors[useColorScheme() === "dark" ? "dark" : "light"];
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) opacity.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
  }, [reduceMotion, opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ backgroundColor: colors.border, borderRadius: 12, height: 16 }, style, animated]}
    />
  );
}

/** Lista de filas de relleno con la forma de una tarjeta de alimento/receta. */
export function SkeletonList({ rows = 5, rowHeight = 72 }: { rows?: number; rowHeight?: number }) {
  return (
    <View accessible accessibilityLabel="Cargando" accessibilityRole="progressbar" style={{ gap: 12, paddingVertical: 8 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} style={{ height: rowHeight, borderRadius: 16 }} />
      ))}
    </View>
  );
}
