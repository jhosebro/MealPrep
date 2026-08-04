import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BREAKPOINTS, ResponsiveContainerProps } from '@/types';

export function ResponsiveContainer({ children, maxWidth = 480 }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const isConstrained = width > BREAKPOINTS.tablet;

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={[
        styles.inner,
        isConstrained && { maxWidth, alignSelf: 'center' as const, width: '100%' },
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
