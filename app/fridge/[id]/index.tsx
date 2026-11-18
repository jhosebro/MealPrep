import { ClayButton, ClayChip } from "@/components/clay";
import { showConfirm } from "@/lib/confirm";
import { DateField } from "@/components/date-field";
import { lineTotal, PriceField, PriceMode } from "@/components/price-field";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { neuInset } from "@/lib/neumorphic";
import { fridgeService } from "@/services/fridgeService";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, FridgeItem, Status, STORES, UNITS } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme ?? "light") as "light" | "dark";
  const colors = Colors[scheme];
  const { updateItem, deleteItem, loading } = useFridgeStore();
  const [dbItem, setDbItem] = useState<FridgeItem | null>(null);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("und");
  const [category, setCategory] = useState("otros");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [storeName, setStoreName] = useState("");
  const [showCustomStore, setShowCustomStore] = useState(false);
  const [status, setStatus] = useState<Status>("available");
  const [archived, setArchived] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>("total");
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fridgeService.getById(id).then(setDbItem);
    }
  }, [id]);

  const item = dbItem;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (str: string | null | undefined): Date | null => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setCategory(item.category);
      // Si el total se divide exacto por la cantidad, se edita por unidad:
      // así al cambiar la cantidad el total se recalcula solo.
      const perUnit = item.price != null && item.quantity > 0 ? item.price / item.quantity : null;
      if (perUnit != null && Number.isInteger(perUnit)) {
        setPriceMode("unit");
        setPrice(perUnit.toString());
      } else {
        setPriceMode("total");
        setPrice(item.price?.toString() || "");
      }
      setPurchaseDate(parseDate(item.purchase_date));
      setExpiryDate(parseDate(item.expiry_date));

      setStatus(item.status || "available");
      setArchived(item.archived ?? false);

      const savedStore = item.store_name || "";
      if (savedStore && !STORES.includes(savedStore as any)) {
        setShowCustomStore(true);
        setStoreName(savedStore);
      } else {
        setShowCustomStore(false);
        setStoreName(savedStore);
      }
    }
  }, [item]);

  const qty = Number(quantity);
  const qtyValid = quantity.trim() !== "" && Number.isInteger(qty) && qty >= 0;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("El nombre es requerido");
    if (!qtyValid) return setError("La cantidad debe ser un número entero (0 o más)");
    const finalStatus = qty === 0 ? "empty" : status;
    const savedPurchaseDate = formatDate(purchaseDate) || null;

    let avgDays = item?.avg_days_per_unit ?? null;
    let totalConsumed = item?.total_consumed ?? 0;

    if (finalStatus === "empty") {
      const startDate = savedPurchaseDate || item?.created_at;
      if (startDate) {
        const todayStr = new Date().toISOString().split("T")[0];
        const days = Math.round(
          (new Date(todayStr).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days > 0) {
          if (totalConsumed > 0 && avgDays != null) {
            avgDays = ((avgDays * totalConsumed) + (days * qty)) / (totalConsumed + qty);
          } else {
            avgDays = days / qty;
          }
          totalConsumed += qty;
        }
      }
    }

    try {
      await updateItem(id, {
        name: name.trim(),
        quantity: qty,
        unit,
        category,
        price: lineTotal(price, priceMode, qty),
        purchase_date: savedPurchaseDate,
        store_name: showCustomStore
          ? storeName.trim() || null
          : storeName || null,
        expiry_date: formatDate(expiryDate) || null,
        status: finalStatus,
        avg_days_per_unit: avgDays,
        total_consumed: totalConsumed,
        archived,
      });
      router.back();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    }
  };

  const handleDelete = () => {
    showConfirm("Eliminar alimento", `¿Estás seguro de eliminar "${name}"?`, async () => {
      await deleteItem(id);
      router.back();
    }, "Eliminar");
  };

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Item no encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>
            ‹ Volver
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Editar alimento
        </Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={{ color: colors.danger, fontSize: 16 }}>Eliminar</Text>
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
            placeholderTextColor={colors.textSecondary}
          />
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
          <Text style={[styles.label, { color: colors.text }]}>Presupuesto</Text>
          <View style={styles.categoryGrid}>
            <ClayChip
              label="Incluir"
              active={!archived}
              onPress={() => setArchived(false)}
            />
            <ClayChip
              label="Archivar"
              active={archived}
              onPress={() => setArchived(true)}
            />
          </View>
          <Text style={[styles.helper, { color: colors.textSecondary }]}>
            Las comidas archivadas no aparecen en la lista de compras ni se
            incluyen en el presupuesto.
          </Text>
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
          <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 14, marginBottom: 8 }}>
            {error}
          </Text>
        ) : null}

        <ClayButton
          onPress={handleSave}
          disabled={loading}
          loading={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
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
  helper: {
    fontSize: 13,
    marginTop: 8,
  },
});
