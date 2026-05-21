import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, STORES, UNITS } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { items, updateItem, deleteItem, loading } = useFridgeStore();

  const item = items.find((i) => i.id === id);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("und");
  const [category, setCategory] = useState("otros");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [storeName, setStoreName] = useState("");
  const [showCustomStore, setShowCustomStore] = useState(false);
  const [showPicker, setShowPicker] = useState<"purchase" | "expiry" | null>(null);

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

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date, target?: "purchase" | "expiry") => {
    if (Platform.OS === "android") {
      setShowPicker(null);
    }
    if (event.type === "set" && selectedDate && target) {
      if (target === "purchase") setPurchaseDate(selectedDate);
      else setExpiryDate(selectedDate);
    }
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

    try {
      await updateItem(id, {
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        unit,
        category,
        price: price ? parseFloat(price) : null,
        purchase_date: formatDate(purchaseDate) || null,
        store_name: showCustomStore ? storeName.trim() || null : storeName || null,
        expiry_date: formatDate(expiryDate) || null,
      });
      router.back();
    } catch (error) {
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
          <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Fecha de compra</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: colors.card, justifyContent: 'center' }]}
            onPress={() => setShowPicker("purchase")}
          >
            <Text style={{ color: purchaseDate ? colors.text : colors.textSecondary }}>
              {purchaseDate ? formatDate(purchaseDate) : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
          {showPicker === "purchase" && (
            <DateTimePicker
              value={purchaseDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => onDateChange(event, date, "purchase")}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: colors.card, justifyContent: 'center' }]}
            onPress={() => setShowPicker("expiry")}
          >
            <Text style={{ color: expiryDate ? colors.text : colors.textSecondary }}>
              {expiryDate ? formatDate(expiryDate) : "No vence"}
            </Text>
          </TouchableOpacity>
          {expiryDate && (
            <TouchableOpacity onPress={() => setExpiryDate(null)}>
              <Text style={{ color: colors.tint, fontSize: 14, marginTop: 4 }}>Eliminar fecha</Text>
            </TouchableOpacity>
          )}
          {showPicker === "expiry" && (
            <DateTimePicker
              value={expiryDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => onDateChange(event, date, "expiry")}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Establecimiento</Text>
          <View style={styles.categoryGrid}>
            {STORES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card },
                  (s === "Otro" ? showCustomStore : storeName === s) && { backgroundColor: colors.primary },
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
                    (s === "Otro" ? showCustomStore : storeName === s) && { color: "#fff" },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {showCustomStore && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, marginTop: 8 }]}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitChipText: {
    fontSize: 14,
    textAlign: 'center',
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
