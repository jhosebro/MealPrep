import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onDismiss: () => void;
  colors: {
    tint: string;
  };
}

export function DatePicker({ value, onChange, onDismiss, colors }: DatePickerProps) {
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      onDismiss();
      if (event.type === "dismissed" || !selectedDate) return;
      onChange(selectedDate);
    } else {
      if (selectedDate) {
        onChange(selectedDate);
      }
    }
  };

  return (
    <View>
      {Platform.OS === "ios" && (
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={{ color: colors.tint, fontSize: 16 }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={{ color: colors.tint, fontSize: 16, fontWeight: "600" }}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <DateTimePicker
        value={value}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
