import { localRecipes, LocalRecipe } from '@/data/recipes';

const COMMON_INGREDIENTS = ['sal', 'pimienta', 'aceite', 'mantequilla', 'ajo', 'cebolla', 'limón', 'canela'];

interface MatchResult {
  recipe: LocalRecipe;
  matchedIngredients: string[];
  essentialIngredients: string[];
  missingEssential: string[];
  matchPercentage: number;
}

export const recipesLocalService = {
  generateRecipes(ingredients: string[]): LocalRecipe[] {
    const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim());
    
    const results: MatchResult[] = localRecipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
      
      const matched = recipeIngredients.filter(ing => 
        normalizedIngredients.some(userIng => 
          userIng.includes(ing) || ing.includes(userIng)
        )
      );

      const essential = recipeIngredients.filter(ing => 
        !COMMON_INGREDIENTS.includes(ing)
      );

      const missingEssential = essential.filter(ing => 
        !matched.includes(ing)
      );

      const matchPercentage = (matched.length / recipeIngredients.length) * 100;
      const essentialMatchPercentage = essential.length > 0 
        ? ((essential.length - missingEssential.length) / essential.length) * 100 
        : 0;
      
      return {
        recipe,
        matchedIngredients: matched,
        essentialIngredients: essential,
        missingEssential,
        matchPercentage: essentialMatchPercentage
      };
    });

    const filtered = results
      .filter(r => r.missingEssential.length === 0)
      .filter(r => r.matchedIngredients.length >= 3)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    const suggested: LocalRecipe[] = [];
    const seen = new Set<string>();

    for (const r of filtered) {
      if (!seen.has(r.recipe.meal_type)) {
        seen.add(r.recipe.meal_type);
        suggested.push({
          ...r.recipe,
          missing_ingredients: r.recipe.ingredients
            .filter(ing => !r.matchedIngredients.includes(ing.toLowerCase()))
        });
        
        if (suggested.length === 3) break;
      }
    }

    if (suggested.length < 3) {
      const mealTypes: LocalRecipe['meal_type'][] = ['desayuno', 'almuerzo', 'cena'];
      const currentTypes = new Set(suggested.map(r => r.meal_type));
      
      for (const type of mealTypes) {
        if (!currentTypes.has(type)) {
          const fallbacks = results
            .filter(r => r.recipe.meal_type === type)
            .filter(r => r.matchedIngredients.length >= 2)
            .sort((a, b) => b.matchPercentage - a.matchPercentage);
          
          if (fallbacks.length > 0) {
            const fallback = fallbacks[0];
            suggested.push({
              ...fallback.recipe,
              missing_ingredients: fallback.recipe.ingredients
                .filter(ing => !fallback.matchedIngredients.includes(ing.toLowerCase()))
            });
            if (suggested.length === 3) break;
          }
        }
      }
    }

    return suggested;
  },

  getAllRecipes(): LocalRecipe[] {
    return localRecipes;
  }
};