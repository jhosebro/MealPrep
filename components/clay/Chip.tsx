import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { neuShadow } from '@/lib/neumorphic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ClayChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function ClayChip({ label, active = false, onPress, style }: ClayChipProps) {
  const rawScheme = useColorScheme();
  const scheme = (rawScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const colors = Colors[scheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg = active ? colors.primary : colors.surface;
  const textColor = active ? '#ffffff' : colors.text;
  const borderColor = active ? colors.primaryDark : 'rgba(255,255,255,0.8)';
  const shadow = active ? neuShadow(scheme, 'pressed') : neuShadow(scheme, 'raised');

  return (
    <AnimatedPressable
      style={[
        styles.base,
        { backgroundColor: bg, borderColor, ...shadow },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
