import { showAlert, showConfirm } from '@/lib/confirm';
import { ClayButton } from '@/components/clay';
import { Colors, MealTypeColors, MealTypeDefault } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { neuSurface } from '@/lib/neumorphic';
import { useAuthStore } from '@/stores/authStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


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
  const scheme = (colorScheme ?? 'light') as 'light' | 'dark';
  const colors = Colors[scheme];
  const { user } = useAuthStore();
  const { selectedRecipe, selectedRecipeSavedId, savedRecipes, saveRecipe, markAsCooked, deleteSavedRecipe, loading } = useRecipesStore();

  const savedEntry = savedRecipes.find((r) => r.id === selectedRecipeSavedId);
  const lastCookedAt = savedEntry?.last_cooked_at;

  const handleSave = async () => {
    if (!user || !selectedRecipe) return;
    await saveRecipe(user.id, selectedRecipe);
    const err = useRecipesStore.getState().error;
    showAlert(err ? 'Error' : 'Éxito', err ?? 'Receta guardada');
  };

  const handleMarkCooked = () => {
    if (!selectedRecipeSavedId) return;
    showConfirm(
      '¿Ya la preparaste?',
      'Se marcará como preparada y no se sugerirá en los próximos 7 días.',
      async () => {
        await markAsCooked(selectedRecipeSavedId);
        const err = useRecipesStore.getState().error;
        showAlert(err ? 'Error' : 'Listo', err ?? '¡Buen provecho!');
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
        const err = useRecipesStore.getState().error;
        if (err) return showAlert('Error', err);
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

  const getMealTypeColor = (type: string) => MealTypeColors[type] ?? MealTypeDefault;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>‹ Volver</Text>
        </TouchableOpacity>
        {isSaved && selectedRecipeSavedId && (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.deleteText, { color: colors.danger }]}>Eliminar</Text>
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
            <View style={[styles.metaChip, { backgroundColor: colors.surfacePressed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                <Ionicons name="people-outline" size={14} />{' '}{selectedRecipe.servings} {selectedRecipe.servings === 1 ? 'porción' : 'porciones'}
              </Text>
            </View>
          )}
          {selectedRecipe.prep_time_minutes && (
            <View style={[styles.metaChip, { backgroundColor: colors.surfacePressed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                <Ionicons name="time-outline" size={14} />{' '}{selectedRecipe.prep_time_minutes} min
              </Text>
            </View>
          )}
          {selectedRecipe.difficulty && (
            <View style={[styles.metaChip, { backgroundColor: colors.surfacePressed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }]}>
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                <Ionicons name="bar-chart-outline" size={14} />{' '}{selectedRecipe.difficulty}
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
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
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
            <View style={[styles.cookedInfoBanner, neuSurface(scheme, 'flat'), { alignItems: 'center' }]}>
              <Text style={[styles.cookedInfoText, { color: colors.text }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />{' '}Última preparación: {formatDate(lastCookedAt)}
              </Text>
            </View>
          )}

          {isSaved && (
            <ClayButton
              variant={lastCookedAt ? 'secondary' : 'primary'}
              onPress={handleMarkCooked}
              disabled={loading}
            >
              {lastCookedAt ? 'Preparar de nuevo' : 'Ya la preparé'}
            </ClayButton>
          )}

          {!isSaved && (
            <ClayButton variant="primary" onPress={handleSave} disabled={loading}>
              Guardar Receta
            </ClayButton>
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
  metaChip: {},
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
  cookedInfoBanner: {
    padding: 14,
  },
  cookedInfoText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
