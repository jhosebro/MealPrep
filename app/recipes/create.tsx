import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useRecipesStore } from '@/stores/recipesStore';
import {
    DIFFICULTIES,
    Difficulty,
    MEAL_TYPES,
    MealType,
    Recipe,
    RECIPE_JSON_TEMPLATE,
} from '@/types';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

type CreateMode = 'manual' | 'json';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { saveRecipe, loading } = useRecipesStore();

  const [mode, setMode] = useState<CreateMode>('json');

  // JSON mode state
  const [jsonText, setJsonText] = useState('');

  // Manual mode state
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('almuerzo');
  const [servings, setServings] = useState('2');
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('media');
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [notes, setNotes] = useState('');

  const handleCopyTemplate = async () => {
    await Clipboard.setStringAsync(RECIPE_JSON_TEMPLATE);
    showAlert('Copiado', 'Plantilla JSON copiada al portapapeles');
  };

  const validateRecipe = (recipe: any): Recipe | null => {
    if (!recipe.title || typeof recipe.title !== 'string') {
      showAlert('Error', 'El campo "title" es requerido y debe ser texto');
      return null;
    }
    if (!MEAL_TYPES.includes(recipe.meal_type)) {
      showAlert('Error', `"meal_type" debe ser: ${MEAL_TYPES.join(', ')}`);
      return null;
    }
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      showAlert('Error', '"ingredients" debe ser un array con al menos 1 elemento');
      return null;
    }
    if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      showAlert('Error', '"steps" debe ser un array con al menos 1 paso');
      return null;
    }

    const validatedRecipe: Recipe = {
      title: recipe.title.trim(),
      meal_type: recipe.meal_type,
      servings: Number(recipe.servings) || 1,
      prep_time_minutes: recipe.prep_time_minutes ? Number(recipe.prep_time_minutes) : undefined,
      difficulty: recipe.difficulty && DIFFICULTIES.includes(recipe.difficulty) ? recipe.difficulty : undefined,
      ingredients: recipe.ingredients.map((i: any) => String(i).trim()).filter(Boolean),
      steps: recipe.steps.map((s: any) => String(s).trim()).filter(Boolean),
      notes: recipe.notes ? String(recipe.notes).trim() : undefined,
    };

    return validatedRecipe;
  };

  const handleSaveJson = async () => {
    if (!user) {
      showAlert('Error', 'Debes iniciar sesión');
      return;
    }

    const trimmed = jsonText.trim();
    if (!trimmed) {
      showAlert('Error', 'Pega el JSON de la receta');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      showAlert('Error', 'El JSON no es válido. Revisa el formato.');
      return;
    }

    const recipe = validateRecipe(parsed);
    if (!recipe) return;

    await saveRecipe(user.id, recipe);
    router.back();
    showAlert('Éxito', 'Receta guardada');
  };

  const handleSaveManual = async () => {
    if (!user) {
      showAlert('Error', 'Debes iniciar sesión');
      return;
    }

    if (!title.trim()) {
      showAlert('Error', 'El nombre de la receta es requerido');
      return;
    }

    const ingredients = ingredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (ingredients.length === 0) {
      showAlert('Error', 'Agrega al menos un ingrediente');
      return;
    }

    const steps = stepsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (steps.length === 0) {
      showAlert('Error', 'Agrega al menos un paso');
      return;
    }

    const recipe: Recipe = {
      title: title.trim(),
      meal_type: mealType,
      servings: Number(servings) || 1,
      prep_time_minutes: prepTime ? Number(prepTime) : undefined,
      difficulty,
      ingredients,
      steps,
      notes: notes.trim() || undefined,
    };

    await saveRecipe(user.id, recipe);
    router.back();
    showAlert('Éxito', 'Receta guardada');
  };

  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'json' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setMode('json')}
      >
        <Text style={[styles.modeButtonText, mode === 'json' && styles.modeButtonTextActive]}>
          Importar JSON
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modeButton,
          mode === 'manual' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setMode('manual')}
      >
        <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
          Manual
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderJsonMode = () => (
    <View style={styles.formSection}>
      <TouchableOpacity
        style={[styles.templateButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
        onPress={handleCopyTemplate}
      >
        <Text style={[styles.templateButtonText, { color: colors.primary }]}>
          📋 Copiar plantilla JSON
        </Text>
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.text }]}>Pega el JSON de la receta:</Text>
      <TextInput
        style={[
          styles.jsonInput,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary },
        ]}
        multiline
        placeholder={`{\n  "title": "Mi receta",\n  "meal_type": "almuerzo",\n  ...\n}`}
        placeholderTextColor={colors.textSecondary}
        value={jsonText}
        onChangeText={setJsonText}
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSaveJson}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Guardando...' : 'Validar y Guardar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderManualMode = () => (
    <View style={styles.formSection}>
      <Text style={[styles.label, { color: colors.text }]}>Nombre de la receta *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
        placeholder="Ej: Arroz con pollo"
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: colors.text }]}>Tipo de comida *</Text>
      <View style={styles.chipRow}>
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.chip,
              { borderColor: colors.textSecondary },
              mealType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setMealType(type)}
          >
            <Text style={[styles.chipText, mealType === type && styles.chipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>Porciones *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
            placeholder="2"
            placeholderTextColor={colors.textSecondary}
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>Tiempo (min)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
            placeholder="20"
            placeholderTextColor={colors.textSecondary}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Dificultad</Text>
      <View style={styles.chipRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.chip,
              { borderColor: colors.textSecondary },
              difficulty === d && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Ingredientes * (uno por línea)</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
        multiline
        placeholder={"2 huevos\n1 taza de arroz\nsal al gusto"}
        placeholderTextColor={colors.textSecondary}
        value={ingredientsText}
        onChangeText={setIngredientsText}
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: colors.text }]}>Pasos * (uno por línea)</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
        multiline
        placeholder={"Calentar el aceite en un sartén\nAgregar los ingredientes\nCocinar por 10 minutos"}
        placeholderTextColor={colors.textSecondary}
        value={stepsText}
        onChangeText={setStepsText}
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: colors.text }]}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.textSecondary }]}
        placeholder="Notas personales..."
        placeholderTextColor={colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSaveManual}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Guardando...' : 'Guardar Receta'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Crear Receta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderModeToggle()}
        {mode === 'json' ? renderJsonMode() : renderManualMode()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  formSection: {
    gap: 12,
  },
  templateButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  jsonInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
