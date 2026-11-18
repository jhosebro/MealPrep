import { Platform } from "react-native";

export interface BarcodeProduct {
  name: string;
  category: string;
  /** Ej. "500 g", "12 und" — tal como viene de Open Food Facts. */
  quantityLabel: string | null;
}

// Orden importa: la primera coincidencia gana (p. ej. "breakfast-cereals" antes que "cereal").
const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["lacteos", ["dair", "milk", "chees", "yogurt", "lacte", "leche", "queso"]],
  ["pescados", ["fish", "seafood", "tuna", "sardin", "pescad", "atun"]],
  ["carnes", ["meat", "sausage", "chicken", "beef", "pork", "carne", "pollo", "embutido"]],
  ["frutas", ["fruit", "fruta"]],
  ["verduras", ["vegetable", "verdura", "hortaliza"]],
  ["granos", ["rice", "pasta", "legume", "bean", "lentil", "flour", "arroz", "frijol", "harina"]],
  ["cereales", ["breakfast-cereal", "rolled-oat", "oat-flake", "oatmeal", "granola", "muesli", "avena"]],
  ["condimentos", ["condiment", "sauce", "spice", "salt", "oil", "salsa", "aceite"]],
];

export function categoryFromTags(tags: string[]): string {
  const joined = tags.join(" ").toLowerCase();
  return CATEGORY_KEYWORDS.find(([, kws]) => kws.some((k) => joined.includes(k)))?.[0] ?? "otros";
}

/** Busca un código EAN/UPC en Open Food Facts. null si no existe. Lanza en error de red. */
export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_es,brands,quantity,categories_tags`,
    // OFF pide un User-Agent propio; los navegadores no permiten fijarlo.
    Platform.OS === "web" ? undefined : { headers: { "User-Agent": "MealPrep/1.0" } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`);
  const json = await res.json();
  const p = json.product;
  if (json.status !== 1 || !p) return null;
  const base = (p.product_name_es || p.product_name || "").trim();
  const brand = (p.brands || "").split(",")[0].trim();
  const name = [base, brand && !base.toLowerCase().includes(brand.toLowerCase()) ? brand : ""]
    .filter(Boolean)
    .join(" ");
  if (!name) return null;
  return {
    name,
    category: categoryFromTags(p.categories_tags ?? []),
    quantityLabel: p.quantity?.trim() || null,
  };
}
