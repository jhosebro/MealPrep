import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useFridgeStore } from '@/stores/fridgeStore';
import { useRecipesStore } from '@/stores/recipesStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { items, fetchItems } = useFridgeStore();
  const { generateRecipes, generatedRecipes } = useRecipesStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchItems(user.id);
    }
  }, [user]);

  const ingredientNames = items.map((item) => item.name);

  const handleGenerate = async () => {
    if (!user || ingredientNames.length === 0) return;
    setLoading(true);
    try {
      await generateRecipes(user.id, ingredientNames);
      if (generatedRecipes.length > 0) {
        router.push('/(tabs)/recipes');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Hola!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {items.length} ingredientes en tu fridge
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/fridge')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>🥗 Mi Nevera</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            {items.length === 0
              ? 'Agrega tus ingredientes'
              : `${items.length} items`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/recipes')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>📖 Recetas</Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Ver recetas guardadas
          </Text>
        </TouchableOpacity>

        {items.length > 0 && (
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={handleGenerate}
            disabled={loading}
          >
            <Text style={styles.generateButtonText}>
              {loading ? 'Generando...' : '✨ Generar Recetas'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length > 0 && (
        <View style={styles.ingredientsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Ingredientes disponibles
          </Text>
          <FlatList
            data={items.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.ingredientChip, { backgroundColor: colors.card }]}>
                <Text style={[styles.ingredientText, { color: colors.text }]}>
                  {item.name}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              items.length > 5 ? (
                <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                  +{items.length - 5} más
                </Text>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
  },
  generateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ingredientsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 14,
    alignSelf: 'center',
  },
});