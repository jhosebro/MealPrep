import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NavigationItem, RESPONSIVE_DEFAULTS } from '@/types';

const NAVIGATION_ITEMS: NavigationItem[] = [
  { route: '/(tabs)/home', label: 'Inicio', icon: 'home' },
  { route: '/(tabs)/fridge', label: 'Nevera', icon: 'snow-outline' },
  { route: '/(tabs)/recipes', label: 'Recetas', icon: 'book' },
  { route: '/(tabs)/shopping', label: 'Compras', icon: 'cart' },
];

interface SidebarNavigationProps {
  activeRoute: string;
}

export function SidebarNavigation({ activeRoute }: SidebarNavigationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = activeRoute === item.route;
        const itemColor = isActive ? colors.primary : colors.icon;

        return (
          <Pressable
            key={item.route}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons
              name={item.icon as any}
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
    paddingTop: 48,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
});
