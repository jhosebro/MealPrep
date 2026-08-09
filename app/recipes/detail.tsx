import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmar',
) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n${message}`);
    if (confirmed) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[(colorScheme ?? 'light') as keyof typeof Colors];
  const { user } = useAuthStore();
  const { selectedRecipe, selectedRecipeSavedId, savedRecipes, saveRecipe, markAsCooked, deleteSavedRecipe, loading } = useRecipesStore();

  const savedEntry = savedRecipes.find((r) => r.id === selectedRecipeSavedId);
  const lastCookedAt = savedEntry?.last_cooked_at;

  const handleSave = async () => {
    if (!user || !selectedRecipe) return;
    await saveRecipe(user.id, selectedRecipe);
    showAlert('Éxito', 'Receta guardada');
  };

  const handleMarkCooked = () => {
    if (!selectedRecipeSavedId) return;
    showConfirm(
      '¿Ya la preparaste?',
      'Se marcará como preparada y no se sugerirá en los próximos 7 días.',
      async () => {
        await markAsCooked(selectedRecipeSavedId);
        showAlert('Listo', '¡Buen provecho! 🍽');
      },
      'Sí, la preparé',
    );
  };

  const handleDelete = () => {
    if (!selectedRecipeSavedId) return;
    showConfirm(
      'Eliminar receta',
      '¿Estás seguro de eliminar esta receta?',
      async () => {
        await deleteSavedRecipe(selectedRecipeSavedId);
        router.back();
      },
      'Eliminar',
    );
  };

  if (!selectedRecipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No hay receta seleccionada</Text>
      </View>
    );
  }

  const isSaved = selectedRecipeSavedId !== null;

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'desayuno': return '#FFB347';
      case 'almuerzo': return '#77DD77';
      case 'cena': return '#CB99C9';
      case 'merienda': return '#87CEEB';
      case 'snack': return '#F0E68C';
      default: return '#999';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>‹ Volver</Text>
        </TouchableOpacity>
        {isSaved && selectedRecipeSavedId && (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{selectedRecipe.title}</Text>
          <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(selectedRecipe.meal_type) }]}>
            <Text style={styles.mealTypeText}>{selectedRecipe.meal_type}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {selectedRecipe.servings && (
            <View style={[styles.metaChip, { backgroundColor: colors.card }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                🍽 {selectedRecipe.servings} {selectedRecipe.servings === 1 ? 'porción' : 'porciones'}
              </Text>
            </View>
          )}
          {selectedRecipe.prep_time_minutes && (
            <View style={[styles.metaChip, { backgroundColor: colors.card }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                ⏱ {selectedRecipe.prep_time_minutes} min
              </Text>
            </View>
          )}
          {selectedRecipe.difficulty && (
            <View style={[styles.metaChip, { backgroundColor: colors.card }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                📊 {selectedRecipe.difficulty}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredientes</Text>
          {selectedRecipe.ingredients.map((ing, index) => (
            <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
              • {ing}
            </Text>
          ))}
        </View>

        {(selectedRecipe.missing_ingredients?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredientes que quizás necesites</Text>
            {selectedRecipe.missing_ingredients?.map((ing, index) => (
              <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                • {ing}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pasos</Text>
          {selectedRecipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
            </View>
          ))}
        </View>

        {selectedRecipe.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {selectedRecipe.notes}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {isSaved && lastCookedAt && (
            <View style={[styles.cookedInfoBanner, { backgroundColor: colors.card }]}>
              <Text style={[styles.cookedInfoText, { color: colors.text }]}>
                ✅ Última preparación: {formatDate(lastCookedAt)}
              </Text>
            </View>
          )}

          {isSaved && (
            <TouchableOpacity
              style={[styles.cookedButton, { backgroundColor: lastCookedAt ? '#8BC34A' : '#FF9800' }]}
              onPress={handleMarkCooked}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>
                {lastCookedAt ? '🍳 Preparar de nuevo' : '🍳 Ya la preparé'}
              </Text>
            </TouchableOpacity>
          )}

          {!isSaved && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>Guardar Receta</Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 18,
  },
  deleteText: {
    color: 'red',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  mealTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 14,
    color: '#fff',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metaChipText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cookedButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cookedInfoBanner: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cookedInfoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
