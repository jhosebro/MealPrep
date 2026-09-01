import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { neuShadow } from '@/lib/neumorphic';

interface ClayInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ClayInput({ label, error, style, ...props }: ClayInputProps) {
  const rawScheme = useColorScheme();
  const scheme = (rawScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const colors = Colors[scheme];
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderInset;
  const shadow = focused ? neuShadow(scheme, 'flat') : neuShadow(scheme, 'inset');

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surfacePressed,
            color: colors.text,
            borderColor,
            borderWidth: focused ? 1.5 : 1,
            ...shadow,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
