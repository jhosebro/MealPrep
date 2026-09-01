import { ClayButton, ClayCard } from '@/components/clay';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { neuSurface } from '@/lib/neumorphic';
import { biometricService } from '@/services/biometricService';
import { useAuthStore } from '@/stores/authStore';
import { useFridgeStore } from '@/stores/fridgeStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Status = 'available' | 'low' | 'empty';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[(colorScheme ?? 'light') as keyof typeof Colors];
  const scheme = (colorScheme ?? 'light') as 'light' | 'dark';
  const { user, signOut } = useAuthStore();
  const { items, fetchItems } = useFridgeStore();
  const { suggestRecipes, fetchSavedRecipes } = useRecipesStore();
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetchItems(user.id);
    }
  }, [user]);

  useEffect(() => {
    biometricService.isEnabled().then(setBiometricEnabled);
  }, []);

  const ingredientNames = items.map((item) => item.name);

  const nearDepletion = useMemo(() => {
    return items.filter((item) => {
      if (item.status === "empty") return false;
      if (item.status === "low") return true;
      if (item.avg_days_per_unit != null && item.avg_days_per_unit * item.quantity < 3) return true;
      return false;
    });
  }, [items]);

  const handleGenerate = async () => {
    if (!user || ingredientNames.length === 0) return;
    setLoading(true);
    try {
      await fetchSavedRecipes(user.id);
      suggestRecipes(ingredientNames);
      router.push('/(tabs)/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const available = await biometricService.isAvailable();
      if (!available) {
        Alert.alert('No disponible', 'Tu dispositivo no tiene huella configurada.');
        return;
      }
    }
    await biometricService.setEnabled(value);
    setBiometricEnabled(value);
  };

  const handleSignOut = () => {
    const doSignOut = async () => {
      await signOut();
      router.replace('/login' as any);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás seguro de cerrar sesión?');
      if (confirmed) {
        doSignOut();
      }
    } else {
      Alert.alert('Cerrar sesión', '¿Estás seguro de cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: doSignOut,
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Hola!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {items.length} ingredientes en tu fridge
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={{ fontSize: 28 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSettings} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Configuración</Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Desbloqueo con huella
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={[styles.signOutButton, neuSurface(scheme, 'raised'), { borderColor: colors.danger }]}
              onPress={handleSignOut}
            >
              <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600' }}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>

            <Pressable
              onPress={() => setShowSettings(false)}
              style={[styles.closeButton, neuSurface(scheme, 'raised')]}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <Pressable onPress={() => router.push('/(tabs)/fridge')}>
          <ClayCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🥗 Mi Nevera</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              {items.length === 0
                ? 'Agrega tus ingredientes'
                : `${items.length} items`}
            </Text>
          </ClayCard>
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/recipes')}>
          <ClayCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📖 Recetas</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Ver recetas guardadas
            </Text>
          </ClayCard>
        </Pressable>

        {items.length > 0 && (
          <ClayButton onPress={handleGenerate} disabled={loading}>
            {loading ? 'Generando...' : '✨ Generar Recetas'}
          </ClayButton>
        )}
      </View>

      {nearDepletion.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⏳ Próximos a agotarse
          </Text>
          {nearDepletion.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.depletionItem, neuSurface(scheme, 'flat')]}
              onPress={() => router.push(`/fridge/${item.id}` as any)}
            >
              <View style={styles.depletionContent}>
                <Text style={[styles.depletionName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.depletionDetail, { color: colors.textSecondary }]}>
                  {item.status === "low" ? "Próximo a agotarse" : `~${Math.round((item.avg_days_per_unit ?? 0) * item.quantity)} días`}
                </Text>
              </View>
              <Text style={[styles.depletionQty, { color: colors.textSecondary }]}>
                {item.quantity} {item.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredientes disponibles
          </Text>
          <FlatList
            data={items.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.ingredientChip, neuSurface(scheme, 'raised')]}>
                <Text style={[styles.ingredientText, { color: colors.text }]}>
                  {item.name}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              items.length > 5 ? (
                <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                  +{items.length - 5} más
                </Text>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  depletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  depletionContent: {
    flex: 1,
  },
  depletionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  depletionDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  depletionQty: {
    fontSize: 14,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 14,
    alignSelf: 'center',
  },
});
