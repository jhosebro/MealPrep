export type PriceMode = "unit" | "total";

/** Total de la línea: lo que se guarda en fridge_items.price. */
export function lineTotal(price: string, mode: PriceMode, qty: number | null): number | null {
  if (!price) return null;
  return mode === "unit" ? Number(price) * (qty ?? 0) : Number(price);
}
