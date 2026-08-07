import { StyleSheet, View } from "react-native";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onDismiss: () => void;
  colors: {
    tint: string;
  };
}

export function DatePicker({ value, onChange, onDismiss }: DatePickerProps) {
  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month, day] = val.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    onChange(newDate);
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <input
        type="date"
        value={formatForInput(value)}
        onChange={handleChange}
        style={{
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
});
