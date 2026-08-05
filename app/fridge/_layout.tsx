import { useAuthStore } from '@/stores/authStore';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function FridgeLayout() {
  const { user, initialized, initialize } = useAuthStore();
  const router = useRouter();

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

  if (!initialized || !user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
