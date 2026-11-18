import { ClayChip } from "@/components/clay";
import { Colors } from "@/constants/theme";
import { neuInset } from "@/lib/neumorphic";
import { StyleSheet, Text, View } from "react-native";
import CurrencyInput from "react-native-currency-input";

export type PriceMode = "unit" | "total";

/** Total de la línea: lo que se guarda en fridge_items.price. */
export function lineTotal(price: string, mode: PriceMode, qty: number | null): number | null {
  if (!price) return null;
  return mode === "unit" ? Number(price) * (qty ?? 0) : Number(price);
}

interface Props {
  price: string;
  onChangePrice: (price: string) => void;
  mode: PriceMode;
  onChangeMode: (mode: PriceMode) => void;
  /** Cantidad válida, o null si el campo es inválido. */
  qty: number | null;
  unit: string;
  scheme: "light" | "dark";
}

export function PriceField({ price, onChangePrice, mode, onChangeMode, qty, unit, scheme }: Props) {
  const colors = Colors[scheme];
  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  // Al cambiar de modo se convierte el valor para no perder lo ya escrito.
  const switchMode = (next: PriceMode) => {
    if (next === mode) return;
    if (price && qty) {
      const n = Number(price);
      onChangePrice(String(next === "unit" ? Math.round(n / qty) : n * qty));
    }
    onChangeMode(next);
  };

  return (
    <View>
      <View style={styles.modes}>
        <ClayChip label="Total" active={mode === "total"} onPress={() => switchMode("total")} />
        <ClayChip label="Por unidad" active={mode === "unit"} onPress={() => switchMode("unit")} />
      </View>
      <CurrencyInput
        value={price ? Number(price) : null}
        onChangeValue={(v) => onChangePrice(v ? v.toString() : "")}
        placeholder={mode === "unit" ? `Precio de 1 ${unit}` : "Precio total"}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={mode === "unit" ? "Precio por unidad" : "Precio total"}
        prefix="$ "
        delimiter="."
        separator=","
        precision={0}
        style={[styles.input, neuInset(scheme), { color: colors.text }]}
      />
      {mode === "unit" && price !== "" && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {qty ?? "?"} × {fmt(Number(price))} ={" "}
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {fmt(lineTotal(price, mode, qty) ?? 0)}
          </Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },
  hint: { fontSize: 14, marginTop: 8 },
});
