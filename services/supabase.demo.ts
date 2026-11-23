// Modo demo (solo dev): metro.config.js redirige services/supabase.ts aquí con EXPO_PUBLIC_DEMO=1.
// Todo vive en memoria: no toca el Supabase real ni guarda credenciales. Se reinicia al recargar.
import { db, supabase as fake, secureSessionStorage } from "@/features/support/fake-supabase";

if (!__DEV__) throw new Error("El modo demo no puede usarse en producción");

const user = { id: "demo", email: "demo@local", created_at: new Date().toISOString() };
let session: { user: typeof user } | null = { user };

const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const item = (name: string, quantity: number, unit: string, category: string, status: string, price: number, expiry: number | null) => ({
  id: `demo-${name}`, user_id: user.id, name, quantity, unit, category, price, status,
  purchase_date: day(-3), store_name: "Mercado", expiry_date: expiry === null ? null : day(expiry),
  avg_days_per_unit: null, total_consumed: 0, archived: false, created_at: new Date().toISOString(),
});
const recipe = (title: string, meal_type: string, ingredients: string[], steps: string[]) => ({
  id: `demo-${title}`, user_id: user.id, created_at: new Date().toISOString(), last_cooked_at: null,
  recipe_data: { title, meal_type, servings: 2, prep_time_minutes: 20, difficulty: "fácil", ingredients, steps },
});

db.tables = {
  fridge_items: [
    item("Leche", 1, "L", "lacteos", "available", 4500, 4),
    item("Huevos", 12, "und", "otros", "available", 14000, 12),
    item("Arroz", 1, "kg", "granos", "low", 5200, null),
    item("Tomate", 0, "und", "verduras", "empty", 3000, null),
    item("Pollo", 2, "kg", "carnes", "available", 22000, 1),
  ],
  budget_sessions: [{ id: "demo-budget", user_id: user.id, amount: 150000, spent: 0, status: "active", created_at: new Date().toISOString(), completed_at: null }],
  budget_purchases: [],
  saved_recipes: [
    recipe("Arroz con pollo", "almuerzo", ["1 taza de arroz", "500 g de pollo", "1 tomate"], ["Dorar el pollo", "Añadir arroz y agua", "Cocinar 20 min"]),
    recipe("Huevos pericos", "desayuno", ["3 huevos", "1 tomate"], ["Picar el tomate", "Revolver con los huevos"]),
  ],
};

const listeners = new Set<(event: string, s: typeof session) => void>();
const emit = (event: string) => listeners.forEach((cb) => cb(event, session));
const signIn = async () => { session = { user }; emit("SIGNED_IN"); return { data: { session, user }, error: null }; };

export const supabase = {
  ...fake,
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user: session?.user ?? null }, error: null }),
    onAuthStateChange: (cb: (event: string, s: typeof session) => void) => {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    signInWithPassword: signIn,
    signUp: signIn,
    signInWithIdToken: signIn,
    signInWithOAuth: async () => { await signIn(); return { data: {}, error: null }; },
    exchangeCodeForSession: async () => ({ data: { session }, error: null }),
    signOut: async () => { session = null; emit("SIGNED_OUT"); return { error: null }; },
  },
} as any;

export { secureSessionStorage };
