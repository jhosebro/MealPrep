import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebLayoutShell } from '@/components/web-layout-shell';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { neuShadow } from '@/lib/neumorphic';
import { useAuthStore } from '@/stores/authStore';
import { BREAKPOINTS } from '@/types';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = (colorScheme ?? 'light') as 'light' | 'dark';
  const colors = Colors[scheme];
  const { user, initialized, initialize } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hideTabBar = Platform.OS === 'web' && width > BREAKPOINTS.desktop;

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized]);

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

  const tabShadow = Platform.OS === 'android'
    ? { elevation: 8 }
    : neuShadow(scheme, 'raised');

  return (
    <WebLayoutShell>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: hideTabBar
            ? { display: 'none' }
            : {
                backgroundColor: colors.surface,
                borderTopWidth: 0,
                paddingTop: 6,
                ...tabShadow,
              },
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
