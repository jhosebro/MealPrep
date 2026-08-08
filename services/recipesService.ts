import { Recipe, SavedRecipe } from '@/types';
import { recipesLocalService } from './recipesLocalService';
import { supabase } from './supabase';

const EXCLUSION_DAYS = 7;

interface GenerateRecipesParams {
  ingredients: string[];
}

export const recipesService = {
  generateRecipes(userId: string, params: GenerateRecipesParams, recentTitles: string[]): Recipe[] {
    const recipes = recipesLocalService.generateRecipes(params.ingredients, recentTitles);
    return recipes;
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
