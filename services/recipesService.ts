import { Recipe, SavedRecipe } from '@/types';
import { recipesLocalService, SuggestRecipesParams } from './recipesLocalService';
import { supabase } from './supabase';

const EXCLUSION_DAYS = 7;

export interface SuggestedRecipe {
  savedRecipe: SavedRecipe;
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
}

export const recipesService = {
  /**
   * Suggests recipes from the user's saved collection based on fridge ingredients.
   * This is the local matching engine.
   */
  suggestRecipes(savedRecipes: SavedRecipe[], params: SuggestRecipesParams): SuggestedRecipe[] {
    return recipesLocalService.suggestFromSaved(savedRecipes, params);
  },

  /**
   * Builds a prompt for external AI recipe generation and returns the URL to open.
   * Asks for JSON format so the user can paste it back into the app.
   */
  buildAIPromptUrl(ingredients: string[], mealType?: string | null): string {
    const ingredientList = ingredients.join(', ');
    let prompt = `Sugiere una receta colombiana que pueda preparar con estos ingredientes: ${ingredientList}.`;
    if (mealType) {
      prompt += ` Debe ser para ${mealType}.`;
    }
    prompt += ` Descríbela de forma normal (título, ingredientes, pasos). Al final pregúntame si la quiero guardar. Si te digo que sí, dámela en este formato JSON exacto: {"title":"nombre","meal_type":"desayuno|almuerzo|cena","servings":2,"prep_time_minutes":20,"difficulty":"fácil|media|difícil","ingredients":["ingrediente 1","ingrediente 2"],"steps":["paso 1","paso 2"],"notes":"opcional"}`;
    const encoded = encodeURIComponent(prompt);
    return `https://chat.openai.com/?q=${encoded}`;
  },

  async getSavedByUser(userId: string): Promise<SavedRecipe[]> {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRecentCookedTitles(userId: string): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - EXCLUSION_DAYS);

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('recipe_data')
      .eq('user_id', userId)
      .or(`last_cooked_at.gte.${cutoffDate.toISOString()},created_at.gte.${cutoffDate.toISOString()}`);

    if (error) throw error;
    return (data || []).map((r: { recipe_data: Recipe }) => r.recipe_data.title.toLowerCase());
  },

  async saveRecipe(userId: string, recipe: Recipe): Promise<SavedRecipe> {
    const recipeWithDefaults: Recipe = {
      ...recipe,
      servings: recipe.servings || 1,
    };

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: userId,
        recipe_data: recipeWithDefaults,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsCooked(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_recipes')
      .update({ last_cooked_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteSavedRecipe(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
