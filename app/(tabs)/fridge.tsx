import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ClayButton, ClayChip } from "@/components/clay";
import { SkeletonList } from "@/components/skeleton";
import { showAlert, showConfirm } from "@/lib/confirm";
import { neuInset, neuSurface } from "@/lib/neumorphic";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, FridgeItem, Status } from "@/types";
import { buildFridgeExport, daysLeft, fridgeSections } from "@/utils/fridge";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_LABEL: Record<Status, string> = {
  available: "disponible",
  low: "por agotarse",
  empty: "agotado",
};

export default function FridgeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = (colorScheme ?? "light") as "light" | "dark";
  const colors = Colors[scheme];
  const { user } = useAuthStore();
  const { items, fetchItems, deleteItem, loading, error } = useFridgeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const statusColor: Record<Status, string> = {
    available: colors.success,
    low: colors.warning,
    empty: colors.danger,
  };

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery],
  );

  const filteredSections = useMemo(
    () => fridgeSections(items, selectedCat, searchQuery),
    [items, selectedCat, searchQuery],
  );

  const catTabItems = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => {
      counts.set(i.category, (counts.get(i.category) || 0) + 1);
    });
    return counts;
  }, [items]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchItems(user.id);
      }
    }, [user]),
  );

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchItems(user.id);
    setRefreshing(false);
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm(
      "Eliminar alimento",
      `¿Estás seguro de eliminar "${name}"?`,
      () => {
        deleteItem(id).catch(() =>
          showAlert("Error", "No se pudo eliminar. Intenta de nuevo."),
        );
      },
      "Eliminar",
    );
  };

  const handleExportJSON = async () => {
    if (items.length === 0) {
      showAlert("Sin datos", "No hay alimentos para exportar");
      return;
    }

    const json = buildFridgeExport(items);

    if (Platform.OS === "web") {
      await Clipboard.setStringAsync(json);
      showAlert("Copiado", "El JSON fue copiado al portapapeles");
    } else {
      try {
        await Share.share({
          message: json,
          title: "Mi Despensa - Inventario",
        });
      } catch (error) {
        await Clipboard.setStringAsync(json);
        showAlert("Copiado", "El JSON fue copiado al portapapeles");
      }
    }
  };

  const renderItem = ({ item }: { item: FridgeItem }) => (
    // Hermanos (no anidados): en web un <button> no puede contener otro.
    <View style={[styles.itemCard, neuSurface(scheme, "raised")]}>
      <TouchableOpacity
        style={styles.itemMain}
        onPress={() => router.push(`/fridge/${item.id}` as any)}
        onLongPress={() => handleDelete(item.id, item.name)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}, ${STATUS_LABEL[item.status]}`}
        accessibilityHint="Abre el detalle para editar"
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColor[item.status] },
          ]}
        />
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
            {item.quantity} {item.unit}
            {item.archived ? " · Archivado" : ""}
          </Text>
          {daysLeft(item) != null && item.status !== "empty" && (
            <Text
              style={[styles.itemEstimate, { color: colors.textSecondary }]}
            >
              ~{daysLeft(item)} días
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDelete(item.id, item.name)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${item.name}`}
        style={{ padding: 4 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () =>
    loading ? (
      <SkeletonList />
    ) : error ? (
      <View style={styles.emptyContainer}>
        <Text
          accessibilityRole="alert"
          style={[styles.emptyText, { color: colors.danger }]}
        >
          No se pudo cargar tu nevera
        </Text>
        <ClayButton
          onPress={() => user && fetchItems(user.id)}
          style={{ marginTop: 12 }}
        >
          Reintentar
        </ClayButton>
      </View>
    ) : (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Tu nevera está vacía
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Toca + para agregar ingredientes
        </Text>
      </View>
    );

  const headerComponent = (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mi Despensa</Text>
        <View style={styles.headerActions}>
          <View style={[styles.exportButton, neuSurface(scheme, "raised")]}>
            <TouchableOpacity
              onPress={handleExportJSON}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Exportar nevera"
            >
              <Text
                style={[styles.exportButtonText, { color: colors.primaryDark }]}
              >
                <Ionicons name="share-outline" size={16} /> Exportar
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.addButton,
              neuSurface(scheme, "raised"),
              { backgroundColor: colors.primary },
            ]}
          >
            <TouchableOpacity
              style={styles.addButtonTouchable}
              onPress={() => router.push("/fridge/add" as any)}
              accessibilityRole="button"
              accessibilityLabel="Agregar ingrediente"
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, neuInset(scheme) as any]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar alimento..."
          placeholderTextColor={colors.textSecondary}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          <ClayChip
            label="Todas"
            active={!selectedCat}
            onPress={() => setSelectedCat(null)}
          />
          {CATEGORIES.map((cat) => {
            const count = catTabItems.get(cat);
            if (!count) return null;
            return (
              <ClayChip
                key={cat}
                label={cat}
                active={selectedCat === cat}
                onPress={() => setSelectedCat(cat)}
              />
            );
          })}
        </ScrollView>
      )}

      {items.length > 0 && filteredSections.length === 0 && (
        <View style={styles.emptyCategory}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {normalizedQuery
              ? `No se encontró "${searchQuery.trim()}"`
              : "No hay items en esta categoría"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setSelectedCat(null);
            }}
            accessibilityRole="button"
            style={{ padding: 12 }}
          >
            <Text style={{ color: colors.primaryDark, fontWeight: "600" }}>
              Limpiar filtros
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error && items.length > 0 && (
        <TouchableOpacity
          onPress={() => user && fetchItems(user.id)}
          accessibilityRole="button"
          style={{ paddingVertical: 10, alignItems: "center" }}
        >
          <Text style={{ color: colors.danger }}>
            No se pudo actualizar: mostrando datos guardados. Toca para
            reintentar.
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title.toUpperCase()}
            </Text>
            <Text
              style={[styles.sectionCount, { color: colors.textSecondary }]}
            >
              {section.data.length}
            </Text>
          </View>
        )}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={items.length === 0 ? renderEmpty : undefined}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  exportButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    position: "relative",
    justifyContent: "center",
  },
  searchInput: {
    padding: 14,
    paddingRight: 40,
  },
  clearButton: {
    position: "absolute",
    right: 28,
    padding: 6,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  itemMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  tabBar: {
    marginBottom: 4,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
  },
  itemDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  itemEstimate: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCategory: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
