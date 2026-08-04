import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { validatePriceInput } from '@/utils/validate-price-input';

interface PriceEditorProps {
  currentPrice: number | null;
  saving: boolean;
  onConfirm: (newPrice: number | null) => void;
  onCancel: () => void;
  colors: typeof Colors.light;
}

export function PriceEditor({
  currentPrice,
  saving,
  onConfirm,
  onCancel,
  colors,
}: PriceEditorProps) {
  const [inputValue, setInputValue] = useState<string>(
    currentPrice != null ? String(currentPrice) : ''
  );

  const handleConfirm = () => {
    const result = validatePriceInput(inputValue);
    if (!result.valid) {
      return;
    }
    onConfirm(result.value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.currencyLabel, { color: colors.text }]}>$</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.primary },
        ]}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="number-pad"
        autoFocus
        editable={!saving}
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        onSubmitEditing={handleConfirm}
        returnKeyType="done"
      />
      {saving ? (
        <ActivityIndicator
          style={styles.actionButton}
          color={colors.primary}
          size="small"
        />
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
          accessibilityLabel="Confirmar precio"
          accessibilityRole="button"
        >
          <Text style={styles.confirmIcon}>✓</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        accessibilityLabel="Cancelar edición"
        accessibilityRole="button"
      >
        <Text style={[styles.cancelIcon, { color: colors.textSecondary }]}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
});
