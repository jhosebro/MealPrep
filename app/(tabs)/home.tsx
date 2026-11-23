import { BrandMark } from '@/components/brand-logo';
import { ClayButton, ClayCard } from '@/components/clay';
import { SkeletonList } from '@/components/skeleton';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { neuSurface } from '@/lib/neumorphic';
import { showAlert, showConfirm } from '@/lib/confirm';
import { accountService } from '@/services/accountService';
import { biometricService } from '@/services/biometricService';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/stores/authStore';
import { useFridgeStore } from '@/stores/fridgeStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useRouter } from 'expo-router';
import { depletionLabel, isNearDepletion } from '@/utils/fridge';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
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
  const { items, fetchItems, loading: fridgeLoading } = useFridgeStore();
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

  const availableItems = useMemo(() => {
    return items.filter((item) => item.status !== "empty");
  }, [items]);

  const ingredientNames = availableItems.map((item) => item.name);

  const nearDepletion = useMemo(() => {
    return items.filter(isNearDepletion);
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
        showAlert('No disponible', 'Tu dispositivo no tiene huella configurada.');
        return;
      }
    }
    await biometricService.setEnabled(value);
    setBiometricEnabled(value);
  };


  const handleExportData = async () => {
    try {
      await Clipboard.setStringAsync(await accountService.exportMyData());
      showAlert('Datos exportados', 'Copiamos todos tus datos (JSON) al portapapeles.');
    } catch {
      showAlert('Error', 'No se pudieron exportar tus datos. Inténtalo de nuevo.');
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Eliminar cuenta',
      'Se borrarán tu cuenta y todos tus datos de forma permanente. Esta acción no se puede deshacer.',
      async () => {
        try {
          await accountService.deleteMyAccount();
          await biometricService.setEnabled(false);
          await signOut();
          router.replace('/login' as any);
        } catch {
          showAlert('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
        }
      },
      'Eliminar',
    );
  };

  const handleSignOut = () => {
    showConfirm('Cerrar sesión', '¿Estás seguro de cerrar sesión?', async () => {
      await signOut();
      router.replace('/login' as any);
    }, 'Cerrar sesión');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <BrandMark size={44} />
          <View>
            <Text style={[styles.title, { color: colors.text }]}>¡Hola!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {items.length === 1 ? '1 ingrediente' : `${items.length} ingredientes`} en tu nevera
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowSettings(true)}
          accessibilityRole="button"
          accessibilityLabel="Configuración"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? colors.surfacePressed : colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Configuración</Text>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Desbloqueo con huella
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                accessibilityLabel="Desbloqueo con huella"
              />
            </View>

            <TouchableOpacity
              style={[styles.signOutButton, neuSurface(scheme, 'raised'), { borderColor: colors.border }]}
              onPress={handleExportData}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Exportar mis datos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signOutButton, neuSurface(scheme, 'raised'), { borderColor: colors.danger }]}
              onPress={handleDeleteAccount}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600' }}>Eliminar mi cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signOutButton, neuSurface(scheme, 'raised'), { borderColor: colors.danger }]}
              onPress={handleSignOut}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600' }}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>

            <Pressable
              onPress={() => setShowSettings(false)}
              accessibilityRole="button"
              style={[styles.closeButton, neuSurface(scheme, 'flat')]}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        <Pressable onPress={() => router.push('/(tabs)/fridge')} accessibilityRole="button">
          {({ pressed }) => (
          <ClayCard style={[styles.card, pressed && { opacity: 0.85 }]}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="nutrition-outline" size={24} color={colors.primaryDark} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mi nevera</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                {items.length === 0 ? 'Agrega tus ingredientes' : `${items.length} ingredientes guardados`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </ClayCard>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/recipes')} accessibilityRole="button">
          {({ pressed }) => (
          <ClayCard style={[styles.card, pressed && { opacity: 0.85 }]}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="book-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Recetas</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                Ver recetas guardadas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </ClayCard>
          )}
        </Pressable>

        {items.length > 0 && (
          <ClayButton onPress={handleGenerate} disabled={loading}>
            {loading ? 'Generando…' : 'Sugerir recetas con mi nevera'}
          </ClayButton>
        )}
      </View>

      {fridgeLoading && items.length === 0 && (
        <View style={styles.section}>
          <SkeletonList rows={3} rowHeight={56} />
        </View>
      )}

      {nearDepletion.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Próximos a agotarse</Text>
          </View>
          {nearDepletion.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.depletionItem, neuSurface(scheme, 'flat')]}
              onPress={() => router.push(`/fridge/${item.id}` as any)}
              accessibilityRole="button"
            >
              <View style={styles.depletionContent}>
                <Text style={[styles.depletionName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.depletionDetail, { color: colors.textSecondary }]}>
                  {depletionLabel(item)}
                </Text>
              </View>
              <Text style={[styles.depletionQty, { color: colors.textSecondary }]}>
                {item.quantity} {item.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {availableItems.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredientes disponibles
          </Text>
          <FlatList
            data={availableItems.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.ingredientChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.ingredientText, { color: colors.primaryDark }]}>
                  {item.name}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              availableItems.length > 5 ? (
                <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                  +{availableItems.length - 5} más
                </Text>
              ) : null
            }
          />
        </View>
      )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  ingredientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
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
