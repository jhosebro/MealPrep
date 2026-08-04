import { PriceEditor } from "@/components/price-editor";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BudgetPurchase } from "@/services/budgetService";
import { useAuthStore } from "@/stores/authStore";
import { useBudgetStore } from "@/stores/budgetStore";
import { useFridgeStore } from "@/stores/fridgeStore";
import { CATEGORIES, FridgeItem, Status, STORES } from "@/types";
import { computeShoppingTotal } from "@/utils/compute-shopping-total";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const statusColor: Record<Status, string> = {
  available: "#4CAF50",
  low: "#FFA500",
  empty: "#FF4444",
};

const statusLabel: Record<Status, string> = {
  available: "Disponible",
  low: "Próximo a agotarse",
  empty: "Agotado",
};

export default function ShoppingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuthStore();
  const { items, fetchItems, updateItem } = useFridgeStore();
  const {
    session,
    purchases,
    fetchActive,
    startBudget,
    markBought,
    undoPurchase,
    finishShopping,
    loading,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [flashItemId, setFlashItemId] = useState<string | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (flashItemId) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setFlashItemId(null);
      });
    }
  }, [flashItemId]);

  useEffect(() => {
    if (user) {
      fetchActive(user.id);
    }
  }, [user]);

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
    await Promise.all([fetchItems(user.id), fetchActive(user.id)]);
    setRefreshing(false);
  };

  const shoppingItems = useMemo(() => {
    return items.filter((i) => i.status === "low" || i.status === "empty");
  }, [items]);

  const purchasedItems = useMemo(() => {
    if (!session) return [];
    const purchasedIds = new Set(purchases.map((p) => p.item_id));
    return items
      .filter((i) => purchasedIds.has(i.id))
      .map((item) => ({
        item,
        purchase: purchases.find((p) => p.item_id === item.id)!,
      }));
  }, [items, purchases, session]);

  const filteredItems = useMemo(() => {
    let result = shoppingItems;
    if (selectedCat) {
      result = result.filter((i) => i.category === selectedCat);
    }
    if (selectedStore) {
      result = result.filter(
        (i) => (i.store_name || "Otro") === selectedStore,
      );
    }
    return result.sort((a, b) => {
      if (a.status === "empty" && b.status !== "empty") return -1;
      if (a.status !== "empty" && b.status === "empty") return 1;
      return 0;
    });
  }, [shoppingItems, selectedCat, selectedStore]);

  const sections = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      title: cat,
      data: filteredItems.filter((i) => i.category === cat),
    })).filter((s) => s.data.length > 0);
  }, [filteredItems]);

  const total = useMemo(() => {
    return computeShoppingTotal(filteredItems);
  }, [filteredItems]);

  const catCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shoppingItems.forEach((i) => {
      counts.set(i.category, (counts.get(i.category) || 0) + 1);
    });
    return counts;
  }, [shoppingItems]);

  const storeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shoppingItems.forEach((i) => {
      const store = i.store_name || "Otro";
      counts.set(store, (counts.get(store) || 0) + 1);
    });
    return counts;
  }, [shoppingItems]);

  const handleMarkBought = async (item: FridgeItem) => {
    if (!user) return;
    if (!session) {
      try {
        const today = new Date().toISOString().split("T")[0];
        await updateItem(item.id, { status: "available", purchase_date: today });
      } catch {
        Alert.alert("Error", "No se pudo marcar como comprado");
      }
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      await markBought(
        session.id,
        item.id,
        item.price || 0,
        item.status,
      );
      await updateItem(item.id, { status: "available", purchase_date: today });
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleUndo = async (purchase: BudgetPurchase) => {
    if (!user) return;
    try {
      await undoPurchase(purchase);
      await fetchItems(user.id);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleStartBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    if (!user) return;
    try {
      await startBudget(user.id, amount);
      setShowBudgetModal(false);
      setBudgetAmount("");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleFinish = () => {
    if (!session) return;
    Alert.alert(
      "Finalizar compra",
      `Gastado: $${session.spent.toLocaleString()} de $${session.amount.toLocaleString()}\n¿Estás seguro de finalizar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: async () => {
            try {
              await finishShopping(session.id);
            } catch (e) {
              Alert.alert("Error", (e as Error).message);
            }
          },
        },
      ],
    );
  };

  const handlePriceConfirm = async (itemId: string, newPrice: number | null) => {
    setSavingPrice(true);
    try {
      await updateItem(itemId, { price: newPrice });
      setEditingItemId(null);
      setFlashItemId(itemId);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el precio. Intenta de nuevo.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handlePriceCancel = () => {
    setEditingItemId(null);
  };

  const renderItem = ({ item }: { item: FridgeItem }) => {
    const isEditing = editingItemId === item.id;
    const isFlashing = flashItemId === item.id;

    const animatedStyle = isFlashing
      ? {
          backgroundColor: flashAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["transparent", `${colors.primary}26`],
          }),
        }
      : undefined;

    return (
      <Animated.View style={[
        styles.itemCard,
        { backgroundColor: colors.card },
        isEditing && { borderWidth: 2, borderColor: colors.primary },
        animatedStyle,
      ]}>
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
            {item.quantity} {item.unit} · {item.store_name || "Otro"}
          </Text>
          {isEditing ? (
            <PriceEditor
              currentPrice={item.price}
              saving={savingPrice}
              onConfirm={(newPrice) => handlePriceConfirm(item.id, newPrice)}
              onCancel={handlePriceCancel}
              colors={colors}
            />
          ) : (
            <TouchableOpacity
              style={styles.priceArea}
              onPress={() => { if (editingItemId === null) setEditingItemId(item.id); }}
              accessibilityLabel="Editar precio"
              accessibilityRole="button"
            >
              {item.price != null ? (
                <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                  ${item.price.toLocaleString()}
                </Text>
              ) : (
                <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                  Sin precio
                </Text>
              )}
            </TouchableOpacity>
          )}
          <Text
            style={[styles.statusLabel, { color: statusColor[item.status] }]}
          >
            {statusLabel[item.status]}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: colors.primary }]}
          onPress={() => handleMarkBought(item)}
        >
          <Text style={styles.buyButtonText}>Comprado</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No hay items pendientes 🎉
      </Text>
    </View>
  );

  const budgetProgress = session
    ? Math.min(session.spent / session.amount, 1)
    : 0;

  const headerComponent = (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Lista de Compras
        </Text>
      </View>

      {shoppingItems.length > 0 && (
        <>
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
              const count = catCounts.get(cat);
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
                !selectedStore && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedStore(null)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.text },
                  !selectedStore && { color: "#fff" },
                ]}
              >
                Todas tiendas
              </Text>
            </TouchableOpacity>
            {STORES.map((store) => {
              const count = storeCounts.get(store);
              if (!count) return null;
              return (
                <TouchableOpacity
                  key={store}
                  style={[
                    styles.tab,
                    { backgroundColor: colors.card },
                    selectedStore === store && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedStore(store)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: colors.text },
                      selectedStore === store && { color: "#fff" },
                    ]}
                  >
                    {store}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {!session && shoppingItems.length > 0 && (
        <TouchableOpacity
          style={[styles.startBudgetBtn, { backgroundColor: colors.card }]}
          onPress={() => setShowBudgetModal(true)}
        >
          <Text style={[styles.startBudgetText, { color: colors.text }]}>
            🎯 Iniciar presupuesto
          </Text>
        </TouchableOpacity>
      )}

      {shoppingItems.length > 0 && sections.length === 0 && (
        <View style={styles.emptyCategory}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay items con esos filtros
          </Text>
        </View>
      )}
    </>
  );

  const footerComponent = (
    <>
      {filteredItems.length > 0 && (
        <View style={[styles.totalBar, { backgroundColor: colors.card }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            Total aproximado
          </Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>
            ${total.toLocaleString()}
          </Text>
        </View>
      )}

      {purchasedItems.length > 0 && (
        <View style={styles.undoSection}>
          <Text style={[styles.undoTitle, { color: colors.text }]}>
            Comprados en esta sesión
          </Text>
          {purchasedItems.map(({ item, purchase }) => (
            <View
              key={purchase.id}
              style={[styles.undoCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemDetails, { color: colors.textSecondary }]}
                >
                  {item.quantity} {item.unit} · ${(purchase.price || 0).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.undoButton, { borderColor: colors.primary }]}
                onPress={() => handleUndo(purchase)}
                disabled={loading}
              >
                <Text
                  style={[styles.undoButtonText, { color: colors.primary }]}
                >
                  Deshacer
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      {session && (
        <View style={[styles.budgetBar, { backgroundColor: colors.card }]}>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: colors.text }]}>
              🎯 ${session.amount.toLocaleString()}
            </Text>
            <TouchableOpacity onPress={handleFinish} disabled={loading}>
              <Text style={[styles.finishText, { color: colors.primary }]}>
                Finalizar
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.budgetProgressBg}>
            <View
              style={[
                styles.budgetProgressFill,
                {
                  width: `${(budgetProgress * 100).toFixed(0)}%` as `${number}%`,
                  backgroundColor:
                    budgetProgress > 0.9 ? "#FF4444" : colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetDetail, { color: colors.textSecondary }]}>
              Gastado: ${session.spent.toLocaleString()}
            </Text>
            <Text style={[styles.budgetDetail, { color: colors.textSecondary }]}>
              Restan: ${(session.amount - session.spent).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      <SectionList
        sections={sections}
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
        ListHeaderComponent={
          shoppingItems.length > 0 ? headerComponent : null
        }
        ListEmptyComponent={
          shoppingItems.length === 0 ? renderEmpty : undefined
        }
        ListFooterComponent={footerComponent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          if (editingItemId) setEditingItemId(null);
        }}
        keyboardShouldPersistTaps="handled"
      />

      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              🎯 Iniciar presupuesto
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
              placeholder="$ 0"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.card },
                ]}
                onPress={() => {
                  setShowBudgetModal(false);
                  setBudgetAmount("");
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleStartBudget}
                disabled={loading}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  {loading ? "Guardando..." : "Iniciar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Budget bar
  budgetBar: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  finishText: {
    fontSize: 14,
    fontWeight: "600",
  },
  budgetProgressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
    overflow: "hidden",
  },
  budgetProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  budgetDetail: {
    fontSize: 12,
  },

  // Start budget
  startBudgetBtn: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  startBudgetText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Tabs
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

  // Items
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
  itemPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  priceArea: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  buyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Undo
  undoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  undoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  undoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  undoButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginLeft: 12,
  },
  undoButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Total
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },

  // Empty
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  modalInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
