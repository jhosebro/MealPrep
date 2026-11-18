import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NavigationItem, RESPONSIVE_DEFAULTS } from '@/types';

const NAVIGATION_ITEMS: NavigationItem[] = [
  { route: '/(tabs)/home', label: 'Inicio', icon: 'home-outline' },
  { route: '/(tabs)/fridge', label: 'Nevera', icon: 'snow-outline' },
  { route: '/(tabs)/recipes', label: 'Recetas', icon: 'book-outline' },
  { route: '/(tabs)/shopping', label: 'Compras', icon: 'cart-outline' },
];

interface SidebarNavigationProps {
  activeRoute: string;
}

export function SidebarNavigation({ activeRoute }: SidebarNavigationProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.brand}>
        <BrandLogo size={36} />
      </View>
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = activeRoute.startsWith(item.route.replace('/(tabs)', ''));
        const itemColor = isActive ? colors.primaryDark : colors.icon;

        return (
          <Pressable
            key={item.route}
            style={({ pressed, hovered }: any) => [
              styles.navItem,
              { backgroundColor: isActive ? colors.primarySoft : pressed || hovered ? colors.surfacePressed : 'transparent' },
            ]}
            onPress={() => router.push(item.route as any)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={(isActive ? item.icon.replace('-outline', '') : item.icon) as any}
              size={24}
              color={itemColor}
            />
            <ThemedText style={[styles.navLabel, { color: itemColor }]}>
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RESPONSIVE_DEFAULTS.sidebarWidth,
    paddingTop: 24,
    paddingHorizontal: 12,
    gap: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
