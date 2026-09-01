import { ClayButton, ClayChip } from "@/components/clay";
import { DateField } from "@/components/date-field";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { neuInset } from "@/lib/neumorphic";
import { CATEGORIES, Status, STORES, UNITS } from "@/types";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CurrencyInput from "react-native-currency-input";

export default function AddItemScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme ?? "light") as "light" | "dark";
  const colors = Colors[scheme];
  const { user } = useAuthStore();
  const { addItem, loading } = useFridgeStore();

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

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    const qty = parseInt(quantity) || 1;
    const finalStatus = qty === 0 ? "empty" : status;

    try {
      await addItem(user.id, {
        name: name.trim(),
        quantity: qty,
        unit,
        category,
        price: price ? parseFloat(price) : null,
        purchase_date: formatDate(purchaseDate) || null,
        store_name: showCustomStore
          ? storeName.trim() || null
          : storeName || null,
        expiry_date: formatDate(expiryDate) || null,
        status: finalStatus,
        avg_days_per_unit: null,
        total_consumed: 0,
      });
      router.push("/(tabs)/fridge");
    } catch (e) {
      Alert.alert("Error", "No se pudo agregar el item");
      console.error("Add item error:", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>
            ‹ Volver
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Agregar alimento
        </Text>
        <View style={{ width: 60 }} />
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
          <CurrencyInput
            value={parseFloat(price)}
            onChangeValue={(parse) => setPrice(parse ? parse.toString() : "")}
            prefix="$ "
            delimiter="."
            separator=","
            precision={0}
            style={[styles.input, neuInset(scheme), { color: colors.text }]}
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

        <ClayButton
          onPress={handleSave}
          disabled={loading}
          loading={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </ClayButton>
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
});
