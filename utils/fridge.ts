import { CATEGORIES, FridgeItem, Status } from "@/types";
import { formatLocalDate, parseLocalDate } from "@/utils/date";

export function isValidQuantity(quantity: string): boolean {
  const n = Number(quantity);
  return quantity.trim() !== "" && Number.isInteger(n) && n >= 0;
}

/** Error del formulario de alimento, o null si es válido. */
export function itemFormError(name: string, quantity: string): string | null {
  if (!name.trim()) return "El nombre es requerido";
  if (!isValidQuantity(quantity)) return "La cantidad debe ser un número entero (0 o más)";
  return null;
}

/**
 * Recalcula el consumo al pasar a agotado: las unidades consumidas son las que
 * había antes de editar.
 */
export function applyConsumption(
  item: Pick<FridgeItem, "quantity" | "status" | "avg_days_per_unit" | "total_consumed" | "created_at"> | null | undefined,
  finalStatus: Status,
  purchaseDate: string | null,
  now: Date = new Date(),
): { avg_days_per_unit: number | null; total_consumed: number } {
  let avgDays = item?.avg_days_per_unit ?? null;
  let totalConsumed = item?.total_consumed ?? 0;
  const consumed = item?.quantity ?? 0;
  if (finalStatus === "empty" && item?.status !== "empty" && consumed > 0) {
    const start = parseLocalDate(purchaseDate) ?? (item?.created_at ? new Date(item.created_at) : null);
    if (start) {
      const today = parseLocalDate(formatLocalDate(now))!;
      const days = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        avgDays = totalConsumed > 0 && avgDays != null
          ? (avgDays * totalConsumed + days) / (totalConsumed + consumed)
          : days / consumed;
        totalConsumed += consumed;
      }
    }
  }
  return { avg_days_per_unit: avgDays, total_consumed: totalConsumed };
}

/** Días estimados que quedan, o null si no hay promedio. */
export function daysLeft(item: FridgeItem): number | null {
  return item.avg_days_per_unit != null ? Math.round(item.avg_days_per_unit * item.quantity) : null;
}

export function isNearDepletion(item: FridgeItem): boolean {
  if (item.status === "empty") return false;
  if (item.status === "low") return true;
  return item.avg_days_per_unit != null && item.avg_days_per_unit * item.quantity < 3;
}

export function depletionLabel(item: FridgeItem): string {
  return item.status === "low" ? "Próximo a agotarse" : `~${daysLeft(item) ?? 0} días`;
}

export function fridgeSections(items: FridgeItem[], selectedCat: string | null, query: string) {
  const q = query.trim().toLowerCase();
  return CATEGORIES.map((cat) => ({
    title: cat as string,
    data: items.filter(
      (i) => i.category === cat && (!q || i.name.toLowerCase().includes(q)),
    ),
  })).filter((s) => s.data.length > 0 && (!selectedCat || s.title === selectedCat));
}

/** JSON que se comparte al exportar la nevera (sin los agotados). */
export function buildFridgeExport(items: FridgeItem[]): string {
  const summary = items
    .filter((item) => item.status !== "empty")
    .map((item) => ({ nombre: item.name, fecha_compra: item.purchase_date }));
  return JSON.stringify(summary, null, 2);
}
