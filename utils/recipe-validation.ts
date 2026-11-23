import { DIFFICULTIES, Difficulty, MEAL_TYPES, MealType, Recipe } from '@/types';

type Result = { recipe: Recipe; error?: undefined } | { recipe?: undefined; error: string };

export function validateRecipe(recipe: any): Result {
  if (!recipe || !recipe.title || typeof recipe.title !== 'string') {
    return { error: 'El campo "title" es requerido y debe ser texto' };
  }
  if (!MEAL_TYPES.includes(recipe.meal_type)) {
    return { error: `"meal_type" debe ser: ${MEAL_TYPES.join(', ')}` };
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return { error: '"ingredients" debe ser un array con al menos 1 elemento' };
  }
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return { error: '"steps" debe ser un array con al menos 1 paso' };
  }
  return {
    recipe: {
      title: recipe.title.trim(),
      meal_type: recipe.meal_type,
      servings: Number(recipe.servings) || 1,
      prep_time_minutes: Number(recipe.prep_time_minutes) || undefined,
      difficulty: recipe.difficulty && DIFFICULTIES.includes(recipe.difficulty) ? recipe.difficulty : undefined,
      ingredients: recipe.ingredients.map((i: any) => String(i).trim()).filter(Boolean),
      steps: recipe.steps.map((s: any) => String(s).trim()).filter(Boolean),
      notes: recipe.notes ? String(recipe.notes).trim() : undefined,
    },
  };
}

export function parseRecipeJson(text: string): Result {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Pega el JSON de la receta' };
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: 'El JSON no es válido. Revisa el formato.' };
  }
  return validateRecipe(parsed);
}

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export function buildManualRecipe(f: {
  title: string;
  mealType: MealType;
  servings: string;
  prepTime: string;
  difficulty?: Difficulty;
  ingredientsText: string;
  stepsText: string;
  notes: string;
}): Result {
  if (!f.title.trim()) return { error: 'El nombre de la receta es requerido' };
  const ingredients = lines(f.ingredientsText);
  if (ingredients.length === 0) return { error: 'Agrega al menos un ingrediente' };
  const steps = lines(f.stepsText);
  if (steps.length === 0) return { error: 'Agrega al menos un paso' };
  return {
    recipe: {
      title: f.title.trim(),
      meal_type: f.mealType,
      servings: Number(f.servings) || 1,
      prep_time_minutes: Number(f.prepTime) || undefined,
      difficulty: f.difficulty,
      ingredients,
      steps,
      notes: f.notes.trim() || undefined,
    },
  };
}
