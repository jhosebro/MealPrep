import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { selectedRecipe, selectedRecipeSavedId, saveRecipe, deleteSavedRecipe, loading } = useRecipesStore();

  const handleSave = async () => {
    if (!user || !selectedRecipe) return;
    await saveRecipe(user.id, selectedRecipe);
    Alert.alert('Éxito', 'Receta guardada');
  };

  const handleDelete = () => {
    if (!selectedRecipeSavedId) return;
    Alert.alert(
      'Eliminar receta',
      '¿Estás seguro de eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedRecipe(selectedRecipeSavedId);
            router.back();
          },
        },
      ]
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
            <Text style={{ color: 'red' }}>Eliminar</Text>
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

        {!isSaved && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Guardar Receta</Text>
          </TouchableOpacity>
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
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 18,
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
    marginBottom: 20,
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
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});