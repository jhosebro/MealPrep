export interface FridgeItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price: number | null;
  purchase_date: string | null;
  store_name: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
}

export interface Recipe {
  id?: string;
  title: string;
  meal_type: "desayuno" | "almuerzo" | "cena";
  ingredients: string[];
  missing_ingredients?: string[];
  steps: string[];
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_data: Recipe;
  created_at: string;
}

export interface GeneratedRecipesResponse {
  recipes: Recipe[];
}

export const CATEGORIES = [
  "frutas",
  "verduras",
  "carnes",
  "pescados",
  "lacteos",
  "granos",
  "condimentos",
  "otros",
] as const;

export const UNITS = [
  "und",
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "cup",
  "tbsp",
  "tsp",
] as const;

export const STORES = ["Exito", "D1", "Ara", "Surtifamiliar", "Otro"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
export type Store = (typeof STORES)[number];
