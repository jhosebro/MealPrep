import React from "react";

export type Status = "available" | "low" | "empty";

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
  status: Status;
  avg_days_per_unit: number | null;
  total_consumed: number;
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
  "cereales",
  "ocasionales",
  "otros",
] as const;

export const UNITS = [
  "und",
  "paq",
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

export const STORES = [
  "Exito",
  "D1",
  "Ara",
  "Surtifamiliar",
  "El hato",
  "Otro",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
export type Store = (typeof STORES)[number];

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export interface WebLayoutShellProps {
  children: React.ReactNode;
}

export interface NavigationItem {
  route: string;
  label: string;
  icon: string;
}

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export const RESPONSIVE_DEFAULTS = {
  contentMaxWidth: 480,
  loginCardMaxWidth: 400,
  sidebarWidth: 220,
} as const;

export interface PriceValidationResult {
  valid: boolean;
  value: number | null;
}

export interface PriceEditState {
  editingItemId: string | null;
  savingPrice: boolean;
  flashItemId: string | null;
}
