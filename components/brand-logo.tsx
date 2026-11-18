import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Mismo dibujo que assets/brand/mark.svg (fuente de verdad de la marca).
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <Circle cx={33} cy={37} r={10} fill="#F28C38" />
      <Path d="M50 46 C50 27 62 14 80 12 C80 30 68 44 50 46 Z" fill="#5BBE7E" />
      <Path d="M52 44 C58 34 66 24 76 16" stroke="#2F7A4A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M15 52 H85 A35 31 0 0 1 15 52 Z" fill="#3E9B5F" />
      <Rect x={10} y={46} width={80} height={9} rx={4.5} fill="#2F7A4A" />
      <Rect x={38} y={80} width={24} height={7} rx={3.5} fill="#2F7A4A" />
    </Svg>
  );
}

/** Marca + nombre "MealPrep". `size` es la altura de la marca. */
export function BrandLogo({ size = 40 }: { size?: number }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="MealPrep">
      <BrandMark size={size} />
      <Text style={[styles.word, { fontSize: size * 0.6, color: colors.text }]}>
        Meal<Text style={{ color: colors.primary }}>Prep</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  word: { fontWeight: '800', letterSpacing: -0.5 },
});
