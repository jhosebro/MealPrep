import { supabase } from './supabase';
import { Recipe, SavedRecipe } from '@/types';
import { recipesLocalService } from './recipesLocalService';

interface GenerateRecipesParams {
  ingredients: string[];
}

export const recipesService = {
  generateRecipes(userId: string, params: GenerateRecipesParams): Recipe[] {
    const recipes = recipesLocalService.generateRecipes(params.ingredients);
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

  async saveRecipe(userId: string, recipe: Recipe): Promise<SavedRecipe> {
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: userId,
        recipe_data: recipe,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSavedRecipe(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};