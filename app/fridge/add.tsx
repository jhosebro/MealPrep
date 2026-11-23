import { ClayButton, ClayChip } from "@/components/clay";
import { DateField } from "@/components/date-field";
import { lineTotal, PriceField, PriceMode } from "@/components/price-field";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { neuInset } from "@/lib/neumorphic";
import { CATEGORIES, Status, STORES, UNITS } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatLocalDate } from "@/utils/date";
import { isValidQuantity, itemFormError } from "@/utils/fridge";

export default function AddItemScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme ?? "light") as "light" | "dark";
  const colors = Colors[scheme];
  const { user } = useAuthStore();
  const { addItem, loading } = useFridgeStore();

  // Prellenado desde el escáner (app/fridge/scan.tsx)
  const scanned = useLocalSearchParams<{ name?: string; category?: string; note?: string }>();
  const [name, setName] = useState(scanned.name ?? "");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("und");
  const [category, setCategory] = useState(
    CATEGORIES.includes(scanned.category as any) ? scanned.category! : "otros",
  );
  const [price, setPrice] = useState("");
  const [priceMode, setPriceMode] = useState<PriceMode>("total");
  const [error, setError] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [storeName, setStoreName] = useState("");
  const [showCustomStore, setShowCustomStore] = useState(false);
  const [status, setStatus] = useState<Status>("available");

  const qty = Number(quantity);
  const qtyValid = isValidQuantity(quantity);
  // price en BD es el total de la línea (lo suma computeShoppingTotal)
  const totalPrice = lineTotal(price, priceMode, qtyValid ? qty : null);

  const handleSave = async () => {
    setError("");
    const formError = itemFormError(name, quantity);
    if (formError) return setError(formError);
    if (!user) return setError("Debes iniciar sesión");

    const finalStatus = qty === 0 ? "empty" : status;

    try {
      await addItem(user.id, {
        name: name.trim(),
        quantity: qty,
        unit,
        category,
        price: totalPrice,
        purchase_date: formatLocalDate(purchaseDate) || null,
        store_name: showCustomStore
          ? storeName.trim() || null
          : storeName || null,
        expiry_date: formatLocalDate(expiryDate) || null,
        status: finalStatus,
        avg_days_per_unit: null,
        total_consumed: 0,
        archived: false,
      });
      router.push("/(tabs)/fridge");
    } catch (e) {
      setError("No se pudo agregar el alimento. Intenta de nuevo.");
      console.error("Add item error:", e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>
            ‹ Volver
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Agregar alimento
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/fridge/scan")}
          accessibilityRole="button"
          accessibilityLabel="Escanear código de barras"
          style={styles.scanButton}
        >
          <Ionicons name="barcode-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
          <TextInput
            style={[styles.input, neuInset(scheme), { color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Huevos, Leche, Tomate..."
            placeholderTextColor={colors.textSecondary}
          />
          {scanned.note ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Escaneado · empaque de {scanned.note}
            </Text>
          ) : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Cantidad</Text>
            <TextInput
              style={[styles.input, neuInset(scheme), { color: colors.text }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Unidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {UNITS.map((u) => (
                <ClayChip
                  key={u}
                  label={u}
                  active={unit === u}
                  onPress={() => setUnit(u)}
                  style={styles.unitChip}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <ClayChip
                key={cat}
                label={cat}
                active={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Estado</Text>
          <View style={styles.categoryGrid}>
            {(["available", "low", "empty"] as Status[]).map((s) => (
              <ClayChip
                key={s}
                label={s === "available"
                    ? "Disponible"
                    : s === "low"
                      ? "Próximo a agotarse"
                      : "Agotado"}
                active={status === s}
                onPress={() => setStatus(s)}
                style={s === "low" || s === "empty" ? {
                  backgroundColor: status === s
                    ? (s === "low" ? colors.warning : colors.danger)
                    : colors.surface,
                } : undefined}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
          <PriceField
            price={price}
            onChangePrice={setPrice}
            mode={priceMode}
            onChangeMode={setPriceMode}
            qty={qtyValid ? qty : null}
            unit={unit}
            scheme={scheme}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Fecha de compra
          </Text>
          <DateField
            value={purchaseDate}
            onChange={setPurchaseDate}
            placeholder="Seleccionar fecha"
            colors={colors}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Fecha de vencimiento
          </Text>
          <DateField
            value={expiryDate}
            onChange={setExpiryDate}
            placeholder="No vence"
            colors={colors}
            showClear
            clearLabel="Eliminar fecha"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Establecimiento
          </Text>
          <View style={styles.categoryGrid}>
            {STORES.map((s) => {
              const isActive = s === "Otro" ? showCustomStore : storeName === s;
              return (
                <ClayChip
                  key={s}
                  label={s}
                  active={isActive}
                  onPress={() => {
                    if (s === "Otro") {
                      setShowCustomStore(true);
                      setStoreName("");
                    } else {
                      setShowCustomStore(false);
                      setStoreName(s);
                    }
                  }}
                />
              );
            })}
          </View>
          {showCustomStore && (
            <TextInput
              style={[styles.input, neuInset(scheme), { color: colors.text, marginTop: 8 }]}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Escribe el nombre del establecimiento"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={[styles.hint, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}

        <ClayButton
          onPress={handleSave}
          disabled={loading}
          loading={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </ClayButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  scanButton: {
    width: 60,
    alignItems: "flex-end",
  },
  backButton: {
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 100,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
  },
  unitChip: {
    width: 65,
    height: 44,
    marginRight: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
