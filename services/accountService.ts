import { supabase } from "./supabase";

// Tablas con datos personales del usuario. RLS limita cada consulta a sus propias filas.
const USER_TABLES = ["fridge_items", "saved_recipes", "budget_sessions", "budget_purchases"] as const;

export const accountService = {
  /** Derecho de acceso / portabilidad (ISO 27701 7.3.8): todos los datos del usuario en JSON. */
  async exportMyData(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      account: { id: user?.id, email: user?.email, created_at: user?.created_at },
    };
    for (const table of USER_TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      out[table] = data;
    }
    return JSON.stringify(out, null, 2);
  },

  /** Derecho de supresión (ISO 27701 7.3.6): borra la cuenta y sus datos en el servidor. */
  async deleteMyAccount(): Promise<void> {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;
  },
};
