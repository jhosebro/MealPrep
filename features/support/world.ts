// Mundo de los tests BDD: imita lo que hacen las pantallas, sobre los stores reales y un Supabase en memoria.
process.env.TZ = 'America/Bogota';
import { Before, setWorldConstructor } from '@cucumber/cucumber';
import { db } from './fake-supabase';
import { fridgeService } from '@/services/fridgeService';
import { useBudgetStore } from '@/stores/budgetStore';
import { useFridgeStore } from '@/stores/fridgeStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { FridgeItem, MealType, Recipe, Status, STORES } from '@/types';
import { formatLocalDate, parseLocalDate } from '@/utils/date';
import { applyConsumption, itemFormError } from '@/utils/fridge';
import { lineTotal, PriceMode } from '@/utils/line-total';
import { parseRecipeJson } from '@/utils/recipe-validation';

export const U = 'u1';
export const STATUS: Record<string, Status> = {
  Disponible: 'available',
  'Próximo a agotarse': 'low',
  Agotado: 'empty',
};
export const fridge = () => useFridgeStore.getState();
export const budget = () => useBudgetStore.getState();
export const recipes = () => useRecipesStore.getState();

const emptyForm = () => ({
  name: '', quantity: '1', unit: 'und', category: 'otros', price: '', priceMode: 'total' as PriceMode,
  storeName: '', showCustomStore: false, status: 'available' as Status,
  purchaseDate: new Date() as Date | null, expiryDate: null as Date | null, archived: false,
  jsonText: '', title: '', mealType: 'almuerzo' as MealType, servings: '2', prepTime: '',
  difficulty: 'media' as const, ingredientsText: '', stepsText: '', notes: '', budgetText: '',
});

export class World {
  screen = '';
  lastMessage = '';
  form = emptyForm();
  itemId = '';
  editItem: FridgeItem | null = null;
  recipeTitle = '';
  savedId = '';
  prevTotal = 0;
  prevSpent = 0;
  exported = '';
  selectedIngredients: string[] | null = null;
  query = '';
  filterCat: string | null = null;
  filterStore: string | null = null;

  resetForm() { this.form = emptyForm(); }

  async seedItem(p: Partial<FridgeItem> & { name: string }) {
    const row = {
      id: `id${++db.seq}`, user_id: U, quantity: 1, unit: 'und', category: 'otros', price: null,
      purchase_date: null, store_name: null, expiry_date: null, status: 'available', avg_days_per_unit: null,
      total_consumed: 0, archived: false, created_at: new Date().toISOString(), ...p,
    };
    (db.tables.fridge_items ??= []).push(row as any);
    await fridge().fetchItems(U);
    this.itemId = row.id;
    return row.id;
  }

  async seedRecipe(title: string, ingredients: string[], last_cooked_at: string | null = null) {
    const recipe: Recipe = { title, meal_type: 'almuerzo', servings: 2, ingredients, steps: ['x'] };
    const row = { id: `id${++db.seq}`, user_id: U, recipe_data: recipe, last_cooked_at, created_at: new Date().toISOString() };
    (db.tables.saved_recipes ??= []).push(row);
    await recipes().fetchSavedRecipes(U);
    this.recipeTitle = title;
    this.savedId = row.id;
  }

  findItem(name: string) {
    return fridge().items.find((i) => i.name === name);
  }

  /** Carga del formulario de Editar alimento. */
  async loadEdit(id: string) {
    const item = await fridgeService.getById(id);
    if (!item) throw new Error(`No existe el alimento ${id}`);
    this.editItem = item;
    this.itemId = id;
    this.screen = 'editar';
    const perUnit = item.price != null && item.quantity > 0 ? item.price / item.quantity : null;
    const unitMode = perUnit != null && Number.isInteger(perUnit);
    const store = item.store_name || '';
    this.form = {
      ...emptyForm(), name: item.name, quantity: String(item.quantity), unit: item.unit, category: item.category,
      priceMode: unitMode ? 'unit' : 'total', price: unitMode ? String(perUnit) : item.price?.toString() || '',
      purchaseDate: parseLocalDate(item.purchase_date), expiryDate: parseLocalDate(item.expiry_date),
      status: item.status || 'available', archived: item.archived ?? false,
      storeName: store, showCustomStore: !!store && !(STORES as readonly string[]).includes(store),
    };
  }

  private fields() {
    const f = this.form, qty = Number(f.quantity);
    return {
      name: f.name.trim(), quantity: qty, unit: f.unit, category: f.category,
      price: lineTotal(f.price, f.priceMode, qty),
      purchase_date: formatLocalDate(f.purchaseDate) || null,
      store_name: f.showCustomStore ? f.storeName.trim() || null : f.storeName || null,
      expiry_date: formatLocalDate(f.expiryDate) || null,
      status: (qty === 0 ? 'empty' : f.status) as Status,
    };
  }

  async saveEdit() {
    const err = itemFormError(this.form.name, this.form.quantity);
    if (err) return void (this.lastMessage = err);
    const v = this.fields();
    try {
      await fridge().updateItem(this.itemId, {
        ...v, ...applyConsumption(this.editItem, v.status, v.purchase_date), archived: this.form.archived,
      });
      this.screen = 'nevera';
    } catch {
      this.lastMessage = 'No se pudo guardar. Intenta de nuevo.';
    }
  }

  async saveAdd() {
    const err = itemFormError(this.form.name, this.form.quantity);
    if (err) return void (this.lastMessage = err);
    try {
      await fridge().addItem(U, { ...this.fields(), avg_days_per_unit: null, total_consumed: 0, archived: false });
      this.itemId = fridge().items.find((i) => i.name === this.form.name.trim())?.id ?? '';
      this.screen = 'nevera';
    } catch {
      this.lastMessage = 'No se pudo agregar el alimento. Intenta de nuevo.';
    }
  }

  /** Guardar de Crear receta. */
  async saveRecipe(result: ReturnType<typeof parseRecipeJson>) {
    if (!result.recipe) return void (this.lastMessage = result.error);
    await recipes().saveRecipe(U, result.recipe);
    const err = recipes().error;
    if (err) return void (this.lastMessage = err);
    this.screen = 'recetas';
    this.lastMessage = 'Receta guardada';
  }

  /** handleSuggest de la pestaña Recetas. */
  async suggest() {
    this.screen = 'recetas';
    await recipes().fetchSavedRecipes(U);
    if (recipes().savedRecipes.length === 0)
      return void (this.lastMessage = 'Primero necesitas guardar algunas recetas. Toca el botón + para crear una.');
    const sel = this.selectedIngredients ?? fridge().items.filter((i) => i.status !== 'empty').map((i) => i.name);
    if (sel.length === 0) return void (this.lastMessage = 'Selecciona al menos un ingrediente');
    recipes().suggestRecipes(sel);
  }
}

setWorldConstructor(World);

Before(function () {
  db.reset();
  for (const s of [useFridgeStore, useBudgetStore, useRecipesStore] as any[]) s.setState(s.getInitialState(), true);
});
