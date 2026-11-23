import { Recipe, SavedRecipe } from '@/types';

const COMMON_INGREDIENTS = ['sal', 'pimienta', 'aceite', 'mantequilla', 'ajo', 'cebolla', 'limón', 'canela', 'agua'];

const MAX_MISSING_ALLOWED = 2;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // la UI promete no sugerirla en 7 días

interface MatchResult {
  savedRecipe: SavedRecipe;
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
}

export interface SuggestRecipesParams {
  ingredients: string[];
  mealTypeFilter?: string | null;
  maxMissing?: number;
}

export const recipesLocalService = {
  /**
   * Suggests recipes from the user's saved recipes based on current fridge ingredients.
   * Allows up to `maxMissing` essential ingredients to be missing (default: 2).
   */
  suggestFromSaved(savedRecipes: SavedRecipe[], params: SuggestRecipesParams, now: Date = new Date()): MatchResult[] {
    const { ingredients, mealTypeFilter, maxMissing = MAX_MISSING_ALLOWED } = params;
    const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim());

    const fresh = savedRecipes.filter(
      s => !s.last_cooked_at || now.getTime() - new Date(s.last_cooked_at).getTime() >= COOLDOWN_MS,
    );

    const results: MatchResult[] = fresh.map(saved => {
      const recipe = saved.recipe_data;
      const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase().trim());

      const matched = recipeIngredients.filter(ing =>
        normalizedIngredients.some(userIng =>
          userIng.includes(ing) || ing.includes(userIng)
        ) || COMMON_INGREDIENTS.includes(ing)
      );

      const missing = recipeIngredients.filter(ing => !matched.includes(ing));

      const matchPercentage = recipeIngredients.length > 0
        ? (matched.length / recipeIngredients.length) * 100
        : 0;

      return {
        savedRecipe: saved,
        recipe: {
          ...recipe,
          missing_ingredients: missing,
        },
        matchedIngredients: matched,
        missingIngredients: missing,
        matchPercentage,
      };
    });

    let filtered = results
      .filter(r => r.missingIngredients.length <= maxMissing)
      .filter(r => r.matchedIngredients.length >= 1);

    if (mealTypeFilter) {
      filtered = filtered.filter(r => r.recipe.meal_type === mealTypeFilter);
    }

    filtered.sort((a, b) => {
      if (a.missingIngredients.length !== b.missingIngredients.length) {
        return a.missingIngredients.length - b.missingIngredients.length;
      }
      return b.matchPercentage - a.matchPercentage;
    });

    return filtered;
  },
};
