import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebLayoutShell } from '@/components/web-layout-shell';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { BREAKPOINTS } from '@/types';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hideTabBar = Platform.OS === 'web' && width > BREAKPOINTS.desktop;

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/(unauthenticated)/login');
    }
  }, [initialized, user]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebLayoutShell>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[(colorScheme ?? 'light') as 'light' | 'dark'].primary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="fridge"
          options={{
            title: 'Nevera',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="refrigerator" color={color} />,
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recetas',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: 'Compras',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          }}
        />
      </Tabs>
    </WebLayoutShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
