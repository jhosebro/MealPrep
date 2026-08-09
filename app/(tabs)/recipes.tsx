import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { useRecipesStore } from "@/stores/recipesStore";
import { Recipe } from "@/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RecipesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[(colorScheme ?? "light") as keyof typeof Colors];
  const { user } = useAuthStore();
  const { getIngredientNames } = useFridgeStore();
  const {
    generatedRecipes,
    savedRecipes,
    generating,
    generateRecipes,
    fetchSavedRecipes,
    saveRecipe,
    selectRecipe,
    error,
  } = useRecipesStore();
  const [activeTab, setActiveTab] = useState<"suggested" | "saved">(
    "suggested",
  );

  useEffect(() => {
    if (user) {
      fetchSavedRecipes(user.id);
    }
  }, [user, fetchSavedRecipes]);

  const handleGenerate = () => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }
    const ingredients = getIngredientNames();
    if (ingredients.length === 0) {
      Alert.alert("Error", "Agrega algunos ingredientes a tu fridge primero");
      return;
    }
    generateRecipes(user.id, ingredients);
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }
    await saveRecipe(user.id, recipe);
    Alert.alert("Éxito", "Receta guardada");
  };

  const navigateToDetail = (
    recipe: Recipe,
    isSaved: boolean,
    savedId?: string,
  ) => {
    selectRecipe(recipe, savedId);
    router.push("/recipes/detail" as any);
  };

  const navigateToCreate = () => {
    router.push("/recipes/create" as any);
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "desayuno":
        return "#FFB347";
      case "almuerzo":
        return "#77DD77";
      case "cena":
        return "#CB99C9";
      case "merienda":
        return "#87CEEB";
      case "snack":
        return "#F0E68C";
      default:
        return "#999";
    }
  };

  const renderRecipeCard = (recipe: Recipe, isSaved: boolean = false, savedId?: string) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToDetail(recipe, isSaved, savedId)}
    >
      <View style={styles.recipeHeader}>
        <Text style={[styles.recipeTitle, { color: colors.text }]}>
          {recipe.title}
        </Text>
        <View
          style={[
            styles.mealTypeBadge,
            { backgroundColor: getMealTypeColor(recipe.meal_type) },
          ]}
        >
          <Text style={styles.mealTypeText}>{recipe.meal_type}</Text>
        </View>
      </View>
      <View style={styles.recipeMetaRow}>
        {recipe.servings && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            🍽 {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
          </Text>
        )}
        {recipe.prep_time_minutes && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            ⏱ {recipe.prep_time_minutes} min
          </Text>
        )}
        {recipe.difficulty && (
          <Text style={[styles.recipeMeta, { color: colors.textSecondary }]}>
            📊 {recipe.difficulty}
          </Text>
        )}
      </View>
      <Text style={[styles.recipeIngredients, { color: colors.textSecondary }]}>
        {recipe.ingredients.slice(0, 3).join(", ")}
        {recipe.ingredients.length > 3 ? "..." : ""}
      </Text>
      {!isSaved && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSaveRecipe(recipe)}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const suggestedData = generatedRecipes.length > 0 ? generatedRecipes : [];
  const savedData = savedRecipes.map((s) => ({
    recipe: s.recipe_data,
    savedId: s.id,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recetas</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={navigateToCreate}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "suggested" && { borderBottomColor: colors.tint },
          ]}
          onPress={() => setActiveTab("suggested")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.text },
              activeTab === "suggested" && { fontWeight: "bold" },
            ]}
          >
            Sugeridas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "saved" && { borderBottomColor: colors.tint },
          ]}
          onPress={() => setActiveTab("saved")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.text },
              activeTab === "saved" && { fontWeight: "bold" },
            ]}
          >
            Guardadas ({savedRecipes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "suggested" ? (
        <View style={styles.content}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: colors.primary },
              generating && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generar Recetas</Text>
            )}
          </TouchableOpacity>

          {generatedRecipes.length > 0 ? (
            <FlatList
              data={suggestedData}
              keyExtractor={(item, index) => `suggested-${index}`}
              renderItem={({ item }) => renderRecipeCard(item, false)}
              contentContainerStyle={styles.list}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Toca &quot;Generar Recetas&quot; para obtener sugerencias
                basadas en tu fridge
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={savedData}
          keyExtractor={(item) => item.savedId}
          renderItem={({ item }) =>
            renderRecipeCard(item.recipe, true, item.savedId)
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tenés recetas guardadas
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -2,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  generateButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  mealTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 12,
    color: "#fff",
    textTransform: "capitalize",
  },
  recipeMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  recipeMeta: {
    fontSize: 13,
  },
  recipeIngredients: {
    fontSize: 14,
    marginBottom: 12,
  },
  saveButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
