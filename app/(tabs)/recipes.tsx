import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { recipesService } from '@/services/recipesService';
import { useAuthStore } from '@/stores/authStore';
import { useFridgeStore } from '@/stores/fridgeStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { MEAL_TYPES, MealType, Recipe, RECIPE_JSON_TEMPLATE } from '@/types';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

export default function RecipesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[(colorScheme ?? 'light') as keyof typeof Colors];
  const { user } = useAuthStore();
  const { items: fridgeItems, fetchItems: fetchFridgeItems, getIngredientNames } = useFridgeStore();
  const {
    suggestedRecipes,
    savedRecipes,
    suggesting,
    loading,
    mealTypeFilter,
    setMealTypeFilter,
    suggestRecipes,
    fetchSavedRecipes,
    selectRecipe,
    error,
  } = useRecipesStore();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'all'>('suggestions');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMealType, setAiMealType] = useState<MealType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSavedRecipes(user.id);
        fetchFridgeItems(user.id);
      }
    }, [user])
  );

  useEffect(() => {
    if (fridgeItems.length > 0) {
      const available = fridgeItems
        .filter(i => i.status === 'available' || i.status === 'low')
        .map(i => i.name);
      setSelectedIngredients(available);
    }
  }, [fridgeItems]);

  useEffect(() => {
    if (error) {
      showAlert('Error', error);
    }
  }, [error]);

  const handleSuggest = () => {
    if (!user) {
      showAlert('Error', 'Debes iniciar sesión');
      return;
    }
    if (savedRecipes.length === 0) {
      showAlert(
        'Sin recetas',
        'Primero necesitas guardar algunas recetas. Toca el botón + para crear una.'
      );
      return;
    }
    if (selectedIngredients.length === 0) {
      showAlert('Error', 'Selecciona al menos un ingrediente');
      return;
    }
    suggestRecipes(selectedIngredients);
    setShowFilterModal(false);
  };

  const handleOpenPersonalize = () => {
    if (!user) {
      showAlert('Error', 'Debes iniciar sesión');
      return;
    }
    if (savedRecipes.length === 0) {
      showAlert(
        'Sin recetas',
        'Primero necesitas guardar algunas recetas. Toca el botón + para crear una.'
      );
      return;
    }
    if (fridgeItems.length === 0) {
      showAlert('Error', 'Agrega algunos ingredientes a tu nevera primero');
      return;
    }
    setShowFilterModal(true);
  };

  const handleOpenAI = () => {
    setShowAIModal(true);
  };

  const handleCopyTemplateAndGo = async () => {
    await Clipboard.setStringAsync(RECIPE_JSON_TEMPLATE);
    setShowAIModal(false);
    const ingredients = selectedIngredients.length > 0
      ? selectedIngredients
      : fridgeItems.filter(i => i.status !== 'empty').map(i => i.name);
    const url = recipesService.buildAIPromptUrl(ingredients, aiMealType);
    Linking.openURL(url);
  };

  const handleGoWithoutCopy = () => {
    setShowAIModal(false);
    const ingredients = selectedIngredients.length > 0
      ? selectedIngredients
      : fridgeItems.filter(i => i.status !== 'empty').map(i => i.name);
    const url = recipesService.buildAIPromptUrl(ingredients, aiMealType);
    Linking.openURL(url);
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name)
        ? prev.filter(i => i !== name)
        : [...prev, name]
    );
  };

  const navigateToDetail = (recipe: Recipe, savedId?: string) => {
    selectRecipe(recipe, savedId);
    router.push('/recipes/detail' as any);
  };

  const navigateToCreate = () => {
    router.push('/recipes/create' as any);
  };

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

  const getMealTypeLabel = (type: MealType) => {
    switch (type) {
      case 'desayuno': return 'Desayuno';
      case 'almuerzo': return 'Almuerzo';
      case 'cena': return 'Cena';
      case 'merienda': return 'Merienda';
      case 'snack': return 'Snack';
    }
  };

  const filteredSavedRecipes = mealTypeFilter
    ? savedRecipes.filter(s => s.recipe_data.meal_type === mealTypeFilter)
    : savedRecipes;

  const renderMealTypeFilters = () => (
    <View style={styles.filtersWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { borderColor: colors.textSecondary },
            !mealTypeFilter && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setMealTypeFilter(null)}
        >
          <Text style={[styles.filterChipText, !mealTypeFilter && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              { borderColor: colors.textSecondary },
              mealTypeFilter === type && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setMealTypeFilter(mealTypeFilter === type ? null : type)}
          >
            <Text style={[styles.filterChipText, mealTypeFilter === type && styles.filterChipTextActive]}>
              {getMealTypeLabel(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSuggestionCard = ({ item }: { item: typeof suggestedRecipes[0] }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToDetail(item.recipe, item.savedRecipe.id)}
    >
      <View style={styles.recipeHeader}>
        <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
          {item.recipe.title}
        </Text>
        <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(item.recipe.meal_type) }]}>
          <Text style={styles.mealTypeText}>{item.recipe.meal_type}</Text>
        </View>
      </View>

      <View style={styles.matchRow}>
        <View style={[styles.matchBadge, { backgroundColor: item.missingIngredients.length === 0 ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.matchBadgeText}>
            {item.missingIngredients.length === 0
              ? '✓ Tienes todo'
              : `${item.missingIngredients.length} faltante${item.missingIngredients.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <Text style={[styles.matchPercent, { color: colors.textSecondary }]}>
          {Math.round(item.matchPercentage)}% match
        </Text>
      </View>

      <View style={styles.recipeMetaRow}>
        {item.recipe.servings && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            🍽 {item.recipe.servings} {item.recipe.servings === 1 ? 'porción' : 'porciones'}
          </Text>
        )}
        {item.recipe.prep_time_minutes && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            ⏱ {item.recipe.prep_time_minutes} min
          </Text>
        )}
        {item.recipe.difficulty && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            📊 {item.recipe.difficulty}
          </Text>
        )}
      </View>

      {item.missingIngredients.length > 0 && (
        <Text style={[styles.missingText, { color: '#FF9800' }]}>
          Falta: {item.missingIngredients.join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSavedCard = ({ item }: { item: typeof savedRecipes[0] }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToDetail(item.recipe_data, item.id)}
    >
      <View style={styles.recipeHeader}>
        <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
          {item.recipe_data.title}
        </Text>
        <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(item.recipe_data.meal_type) }]}>
          <Text style={styles.mealTypeText}>{item.recipe_data.meal_type}</Text>
        </View>
      </View>
      <View style={styles.recipeMetaRow}>
        {item.recipe_data.servings && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            🍽 {item.recipe_data.servings} {item.recipe_data.servings === 1 ? 'porción' : 'porciones'}
          </Text>
        )}
        {item.recipe_data.prep_time_minutes && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            ⏱ {item.recipe_data.prep_time_minutes} min
          </Text>
        )}
        {item.recipe_data.difficulty && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            📊 {item.recipe_data.difficulty}
          </Text>
        )}
      </View>
      {item.last_cooked_at && (
        <Text style={[styles.cookedLabel, { color: colors.textSecondary }]}>
          ✅ Preparada recientemente
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderAIModal = () => (
    <Modal
      visible={showAIModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAIModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAIModal(false)}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Generar con IA</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <Text style={[styles.modalSectionTitle, { color: colors.text }]}>¿Qué tipo de comida?</Text>
          <View style={styles.modalChipRow}>
            <TouchableOpacity
              style={[
                styles.modalChip,
                { borderColor: colors.textSecondary },
                !aiMealType && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setAiMealType(null)}
            >
              <Text style={[styles.modalChipText, !aiMealType && styles.modalChipTextActive]}>
                Cualquiera
              </Text>
            </TouchableOpacity>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalChip,
                  { borderColor: colors.textSecondary },
                  aiMealType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setAiMealType(aiMealType === type ? null : type)}
              >
                <Text style={[styles.modalChipText, aiMealType === type && styles.modalChipTextActive]}>
                  {getMealTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalSectionTitle, { color: colors.text, marginTop: 20 }]}>Formato JSON</Text>
          <Text style={[styles.modalSectionHint, { color: colors.textSecondary }]}>
            Copia esta plantilla y pídele a la IA que te responda en este formato. Luego podrás guardar la receta desde &quot;Crear Receta &gt; Importar JSON&quot;.
          </Text>
          <View style={[styles.jsonPreview, { backgroundColor: colors.card }]}>
            <Text style={[styles.jsonPreviewText, { color: colors.text }]}>
              {RECIPE_JSON_TEMPLATE}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.suggestButton, { backgroundColor: colors.primary }]}
            onPress={handleCopyTemplateAndGo}
          >
            <Text style={styles.suggestButtonText}>📋 Copiar formato y abrir ChatGPT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aiSecondaryButton, { borderColor: colors.textSecondary }]}
            onPress={handleGoWithoutCopy}
          >
            <Text style={[styles.aiSecondaryButtonText, { color: colors.text }]}>
              Abrir sin copiar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Personalizar búsqueda</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Tipo de comida</Text>
          <View style={styles.modalChipRow}>
            <TouchableOpacity
              style={[
                styles.modalChip,
                { borderColor: colors.textSecondary },
                !mealTypeFilter && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setMealTypeFilter(null)}
            >
              <Text style={[styles.modalChipText, !mealTypeFilter && styles.modalChipTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalChip,
                  { borderColor: colors.textSecondary },
                  mealTypeFilter === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setMealTypeFilter(mealTypeFilter === type ? null : type)}
              >
                <Text style={[styles.modalChipText, mealTypeFilter === type && styles.modalChipTextActive]}>
                  {getMealTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
            Ingredientes disponibles ({selectedIngredients.length}/{fridgeItems.filter(i => i.status !== 'empty').length})
          </Text>
          <Text style={[styles.modalSectionHint, { color: colors.textSecondary }]}>
            Deselecciona los que no quieras usar
          </Text>
          <View style={styles.modalChipRow}>
            {fridgeItems.filter(i => i.status !== 'empty').map((item) => {
              const isSelected = selectedIngredients.includes(item.name);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.ingredientChip,
                    { borderColor: colors.textSecondary },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => toggleIngredient(item.name)}
                >
                  <Text style={[styles.ingredientChipText, isSelected && styles.ingredientChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.suggestButton, { backgroundColor: colors.primary }]}
            onPress={handleSuggest}
          >
            <Text style={styles.suggestButtonText}>Buscar sugerencias</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEmptySuggestions = () => (
    <View style={styles.emptyContainer}>
      {savedRecipes.length === 0 ? (
        <>
          <Text style={[styles.emptyIcon]}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aún no tienes recetas guardadas
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Crea tu primera receta para que el sistema pueda sugerirte qué cocinar con lo que tienes en la nevera.
          </Text>
          <TouchableOpacity
            style={[styles.emptyAction, { backgroundColor: colors.primary }]}
            onPress={navigateToCreate}
          >
            <Text style={styles.emptyActionText}>Crear mi primera receta</Text>
          </TouchableOpacity>
        </>
      ) : suggestedRecipes.length === 0 ? (
        <>
          <Text style={[styles.emptyIcon]}>🍳</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Descubre qué puedes cocinar
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Toca &quot;Sugerir recetas&quot; para encontrar qué preparar con los ingredientes de tu nevera.
          </Text>
        </>
      ) : null}
    </View>
  );

  const renderSuggestionsTab = () => (
    <View style={styles.content}>
      <View style={styles.suggestRow}>
        <TouchableOpacity
          style={[styles.suggestMainButton, { backgroundColor: colors.primary }, suggesting && styles.buttonDisabled]}
          onPress={handleSuggest}
          disabled={suggesting}
        >
          {suggesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.suggestMainButtonText}>🔍 Sugerir recetas</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.personalizeButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={handleOpenPersonalize}
        >
          <Text style={[styles.personalizeButtonText, { color: colors.primary }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.aiButton, { backgroundColor: colors.card, borderColor: colors.textSecondary }]}
        onPress={handleOpenAI}
      >
        <Text style={[styles.aiButtonText, { color: colors.text }]}>
          🤖 Generar con IA (ChatGPT)
        </Text>
      </TouchableOpacity>

      {suggestedRecipes.length > 0 ? (
        <FlatList
          data={suggestedRecipes}
          keyExtractor={(item) => item.savedRecipe.id}
          renderItem={renderSuggestionCard}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {suggestedRecipes.length} receta{suggestedRecipes.length !== 1 ? 's' : ''} que puedes preparar
            </Text>
          }
        />
      ) : (
        renderEmptySuggestions()
      )}
    </View>
  );

  const renderAllTab = () => (
    <FlatList
      data={filteredSavedRecipes}
      keyExtractor={(item) => item.id}
      renderItem={renderSavedCard}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon]}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin recetas guardadas
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {mealTypeFilter
              ? `No tienes recetas de tipo "${mealTypeFilter}" guardadas.`
              : 'Crea tu primera receta tocando el botón +.'}
          </Text>
        </View>
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recetas</Text>
      </View>

      {renderMealTypeFilters()}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'suggestions' && styles.tabTextActive]}>
            Sugerencias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'all' && styles.tabTextActive]}>
            Guardadas ({savedRecipes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && savedRecipes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'suggestions' ? (
        renderSuggestionsTab()
      ) : (
        renderAllTab()
      )}

      {/* FAB para crear receta */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={navigateToCreate}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {renderFilterModal()}
      {renderAIModal()}
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  filtersWrapper: {
    height: 36,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  suggestRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  suggestMainButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestMainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personalizeButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  personalizeButtonText: {
    fontSize: 22,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  aiButton: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  recipeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  mealTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'capitalize',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matchPercent: {
    fontSize: 13,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  recipeMeta: {
    fontSize: 13,
  },
  missingText: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  cookedLabel: {
    fontSize: 13,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  modalSectionHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  modalChipText: {
    fontSize: 14,
    color: '#666',
  },
  modalChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  ingredientChipText: {
    fontSize: 14,
    color: '#666',
  },
  ingredientChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  suggestButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  suggestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiIngredientsPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  jsonPreview: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  jsonPreviewText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  aiSecondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  aiSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
