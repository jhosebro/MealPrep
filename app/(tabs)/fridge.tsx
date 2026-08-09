import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, FridgeItem, Status } from "@/types";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const statusColor: Record<Status, string> = {
  available: "#4CAF50",
  low: "#FFA500",
  empty: "#FF4444",
};

export default function FridgeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuthStore();
  const { items, fetchItems, deleteItem } = useFridgeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const sections = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      title: cat,
      data: items.filter((i) => i.category === cat),
    })).filter((s) => s.data.length > 0);
  }, [items]);

  const filteredSections = useMemo(() => {
    let result = sections;
    if (selectedCat) {
      result = result.filter((s) => s.title === selectedCat);
    }
    if (normalizedQuery) {
      result = result
        .map((s) => ({
          ...s,
          data: s.data.filter((i) => i.name.toLowerCase().includes(normalizedQuery)),
        }))
        .filter((s) => s.data.length > 0);
    }
    return result;
  }, [sections, selectedCat, normalizedQuery]);

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
    Alert.alert("Eliminar item", `¿Estás seguro de eliminar "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteItem(id) },
    ]);
  };

  const renderItem = ({ item }: { item: FridgeItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/fridge/${item.id}` as any)}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] }]} />
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
          {item.quantity} {item.unit}
        </Text>
        {item.avg_days_per_unit != null && item.status !== "empty" && (
          <Text style={[styles.itemEstimate, { color: colors.textSecondary }]}>
            ~{Math.round(item.avg_days_per_unit * item.quantity)} días
          </Text>
        )}
      </View>
      <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Tu fridge está vacío
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
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/fridge/add" as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
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
          >
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
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
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.card },
              !selectedCat && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCat(null)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
                !selectedCat && { color: "#fff" },
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const count = catTabItems.get(cat);
            if (!count) return null;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tab,
                  { backgroundColor: colors.card },
                  selectedCat === cat && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.text },
                    selectedCat === cat && { color: "#fff" },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
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
        </View>
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
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
              {section.data.length}
            </Text>
          </View>
        )}
        ListHeaderComponent={items.length > 0 ? headerComponent : null}
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
    paddingTop: 8,
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
  addButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
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
    borderRadius: 10,
    fontSize: 16,
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
  },
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
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    textTransform: "capitalize",
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
