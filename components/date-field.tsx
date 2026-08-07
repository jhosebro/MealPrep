import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DateFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  colors: {
    card: string;
    text: string;
    textSecondary: string;
    tint: string;
  };
  showClear?: boolean;
  clearLabel?: string;
}

export function DateField({
  value,
  onChange,
  placeholder,
  colors,
  showClear,
  clearLabel = "Eliminar fecha",
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formatDisplay = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "dismissed") return;
    }
    if (date) {
      onChange(date);
      if (Platform.OS !== "ios") setShowPicker(false);
    }
  };

  const handleWebChange = (e: unknown) => {
    const event = e as { target: { value: string } };
    const val = event.target.value;
    if (!val) {
      onChange(null);
      return;
    }
    const [year, month, day] = val.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    onChange(newDate);
  };

  if (Platform.OS === "web") {
    return (
      <View>
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <input
            type="date"
            value={value ? formatDisplay(value) : ""}
            onChange={handleWebChange}
            placeholder={placeholder}
            style={{
              padding: 14,
              fontSize: 16,
              border: "none",
              outline: "none",
              width: "100%",
              boxSizing: "border-box" as const,
              background: "transparent",
              color: value ? colors.text : colors.textSecondary,
              minHeight: 48,
              touchAction: "manipulation" as const,
            }}
          />
        </View>
        {showClear && value && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Text style={{ color: colors.tint, fontSize: 14, marginTop: 4 }}>
              {clearLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.card }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={{ color: value ? colors.text : colors.textSecondary }}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <View>
          {Platform.OS === "ios" && (
            <View style={styles.pickerButtons}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={{ color: colors.tint, fontSize: 16 }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
              >
                <Text
                  style={{ color: colors.tint, fontSize: 16, fontWeight: "600" }}
                >
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleNativeChange}
          />
        </View>
      )}
      {showClear && value && (
        <TouchableOpacity onPress={() => onChange(null)}>
          <Text style={{ color: colors.tint, fontSize: 14, marginTop: 4 }}>
            {clearLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 14,
    borderRadius: 10,
    justifyContent: "center",
  },
  inputContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  pickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
