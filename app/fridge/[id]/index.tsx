import { DateField } from "@/components/date-field";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fridgeService } from "@/services/fridgeService";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, FridgeItem, Status, STORES, UNITS } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
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
      setPrice(item.price?.toString() || "");
      setPurchaseDate(parseDate(item.purchase_date));
      setExpiryDate(parseDate(item.expiry_date));

      setStatus(item.status || "available");

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    const qty = parseInt(quantity) || 1;
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
        price: price ? parseFloat(price) : null,
        purchase_date: savedPurchaseDate,
        store_name: showCustomStore
          ? storeName.trim() || null
          : storeName || null,
        expiry_date: formatDate(expiryDate) || null,
        status: finalStatus,
        avg_days_per_unit: avgDays,
        total_consumed: totalConsumed,
      });
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo actualizar el item");
    }
  };

  const handleDelete = () => {
    Alert.alert("Eliminar item", `¿Estás seguro de eliminar "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteItem(id);
          router.back();
        },
      },
    ]);
  };

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Item no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={{ color: "red", fontSize: 16 }}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Cantidad</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text },
              ]}
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
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitChip,
                    { backgroundColor: colors.card },
                    unit === u && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      { color: colors.text },
                      unit === u && { color: "#fff" },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card },
                  category === cat && { backgroundColor: colors.primary },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.text },
                    category === cat && { color: "#fff" },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Estado</Text>
          <View style={styles.categoryGrid}>
            {(["available", "low", "empty"] as Status[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card },
                  status === s && {
                    backgroundColor:
                      s === "available"
                        ? colors.primary
                        : s === "low"
                          ? "#FFA500"
                          : "#FF4444",
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.text },
                    status === s && { color: "#fff" },
                  ]}
                >
                  {s === "available"
                    ? "Disponible"
                    : s === "low"
                      ? "Próximo a agotarse"
                      : "Agotado"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor={colors.textSecondary}
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
            {STORES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card },
                  (s === "Otro" ? showCustomStore : storeName === s) && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  if (s === "Otro") {
                    setShowCustomStore(true);
                    setStoreName("");
                  } else {
                    setShowCustomStore(false);
                    setStoreName(s);
                  }
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: colors.text },
                    (s === "Otro" ? showCustomStore : storeName === s) && {
                      color: "#fff",
                    },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {showCustomStore && (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  marginTop: 8,
                },
              ]}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Escribe el nombre del establecimiento"
              placeholderTextColor={colors.textSecondary}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingTop: 60,
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
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  unitChip: {
    width: 65,
    height: 44,
    borderRadius: 22,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  unitChipText: {
    fontSize: 14,
    textAlign: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
