import { FridgeItem, STORES } from "@/types";

// Tiendas personalizadas (escritas a mano) cuentan como "Otro" para el filtro
export const storeKey = (s: string | null | undefined) =>
  s && (STORES as readonly string[]).includes(s) ? s : "Otro";

export const shoppingList = (items: FridgeItem[]) =>
  items.filter((i) => !i.archived && (i.status === "low" || i.status === "empty"));

/** "200.000" en es-CO son 200000, no 200. Devuelve null si no es un monto válido. */
export function parseBudgetAmount(text: string): number | null {
  const amount = parseInt(text.replace(/\D/g, ""), 10);
  return amount > 0 ? amount : null;
}
