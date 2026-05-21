import { create } from 'zustand';
import { Recipe, SavedRecipe } from '@/types';
import { recipesService } from '@/services/recipesService';

interface RecipesState {
  generatedRecipes: Recipe[];
  savedRecipes: SavedRecipe[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  selectedRecipe: Recipe | null;
  selectedRecipeSavedId: string | null;
  selectRecipe: (recipe: Recipe, savedId?: string | null) => void;
  generateRecipes: (userId: string, ingredients: string[]) => void;
  fetchSavedRecipes: (userId: string) => Promise<void>;
  saveRecipe: (userId: string, recipe: Recipe) => Promise<void>;
  deleteSavedRecipe: (id: string) => Promise<void>;
  clearGenerated: () => void;
}

export const useRecipesStore = create<RecipesState>((set) => ({
  generatedRecipes: [],
  savedRecipes: [],
  loading: false,
  generating: false,
  error: null,
  selectedRecipe: null,
  selectedRecipeSavedId: null,

  selectRecipe: (recipe, savedId = null) => {
    set({ selectedRecipe: recipe, selectedRecipeSavedId: savedId });
  },

  generateRecipes: (userId: string, ingredients: string[]) => {
    if (ingredients.length === 0) {
      set({ error: 'Agrega algunos ingredientes a tu fridge primero' });
      return;
    }

    set({ generating: true, error: null });
    try {
      const recipes = recipesService.generateRecipes(userId, { ingredients });
      set({ generatedRecipes: recipes, generating: false });
    } catch (error: any) {
      console.error('generateRecipes error:', error);
      const errorMessage = error?.message || 'Error al generar recetas';
      set({ error: errorMessage, generating: false });
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

  clearGenerated: () => {
    set({ generatedRecipes: [] });
  },
}));