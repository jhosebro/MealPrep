import { recipesService, SuggestedRecipe } from '@/services/recipesService';
import { MealType, Recipe, SavedRecipe } from '@/types';
import { create } from 'zustand';

interface RecipesState {
  suggestedRecipes: SuggestedRecipe[];
  savedRecipes: SavedRecipe[];
  loading: boolean;
  suggesting: boolean;
  error: string | null;
  selectedRecipe: Recipe | null;
  selectedRecipeSavedId: string | null;
  mealTypeFilter: MealType | null;
  selectRecipe: (recipe: Recipe, savedId?: string | null) => void;
  setMealTypeFilter: (filter: MealType | null) => void;
  suggestRecipes: (ingredients: string[]) => void;
  fetchSavedRecipes: (userId: string) => Promise<void>;
  saveRecipe: (userId: string, recipe: Recipe) => Promise<void>;
  markAsCooked: (id: string) => Promise<void>;
  deleteSavedRecipe: (id: string) => Promise<void>;
  clearSuggestions: () => void;
  getAIPromptUrl: (ingredients: string[]) => string;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  suggestedRecipes: [],
  savedRecipes: [],
  loading: false,
  suggesting: false,
  error: null,
  selectedRecipe: null,
  selectedRecipeSavedId: null,
  mealTypeFilter: null,

  selectRecipe: (recipe, savedId = null) => {
    set({ selectedRecipe: recipe, selectedRecipeSavedId: savedId ?? null });
  },

  setMealTypeFilter: (filter: MealType | null) => {
    set({ mealTypeFilter: filter });
    const { savedRecipes } = get();
    if (savedRecipes.length > 0) {
      // Re-run suggestions with new filter if we have ingredients context
      // This will be triggered from the component
    }
  },

  suggestRecipes: (ingredients: string[]) => {
    const { savedRecipes, mealTypeFilter } = get();

    if (savedRecipes.length === 0) {
      set({ suggestedRecipes: [], error: null });
      return;
    }

    if (ingredients.length === 0) {
      set({ error: 'Agrega algunos ingredientes a tu nevera primero' });
      return;
    }

    set({ suggesting: true, error: null });
    try {
      const suggestions = recipesService.suggestRecipes(savedRecipes, {
        ingredients,
        mealTypeFilter,
      });
      set({ suggestedRecipes: suggestions, suggesting: false });
    } catch (error: any) {
      console.error('suggestRecipes error:', error);
      const errorMessage = error?.message || 'Error al buscar sugerencias';
      set({ error: errorMessage, suggesting: false });
    }
  },

  fetchSavedRecipes: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const recipes = await recipesService.getSavedByUser(userId);
      set({ savedRecipes: recipes, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  saveRecipe: async (userId: string, recipe: Recipe) => {
    set({ loading: true, error: null });
    try {
      const saved = await recipesService.saveRecipe(userId, recipe);
      set((state) => ({
        savedRecipes: [saved, ...state.savedRecipes],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  markAsCooked: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await recipesService.markAsCooked(id);
      set((state) => ({
        savedRecipes: state.savedRecipes.map((r) =>
          r.id === id ? { ...r, last_cooked_at: new Date().toISOString() } : r
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteSavedRecipe: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await recipesService.deleteSavedRecipe(id);
      set((state) => ({
        savedRecipes: state.savedRecipes.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  clearSuggestions: () => {
    set({ suggestedRecipes: [] });
  },

  getAIPromptUrl: (ingredients: string[]) => {
    const { mealTypeFilter } = get();
    return recipesService.buildAIPromptUrl(ingredients, mealTypeFilter);
  },
}));
