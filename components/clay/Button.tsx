import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { neuShadow } from '@/lib/neumorphic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ClayButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function ClayButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ClayButtonProps) {
  const rawScheme = useColorScheme();
  const scheme = (rawScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const colors = Colors[scheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantBg: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.primarySoft,
    ghost: 'transparent',
    danger: colors.danger,
  };

  const variantTextColor: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.primaryDark,
    ghost: colors.primary,
    danger: '#FFFFFF', // texto blanco sobre rojo en ambos modos
  };

  const bgColor = variantBg[variant];
  const textColor = variantTextColor[variant];

  const shadow = variant === 'primary' ? neuShadow(scheme, 'raised') : {};

  return (
    <AnimatedPressable
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          opacity: disabled ? 0.5 : 1,
          ...shadow,
        },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{children}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
