import { ClayButton } from "@/components/clay";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { neuInset } from "@/lib/neumorphic";
import { lookupBarcode } from "@/services/barcodeService";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const router = useRouter();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[scheme];
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // onBarcodeScanned dispara muchas veces por segundo; el ref evita búsquedas duplicadas.
  const lastCode = useRef<string | null>(null);

  const handleCode = async (code: string) => {
    if (busy || code === lastCode.current) return;
    lastCode.current = code;
    setBusy(true);
    setMessage("");
    try {
      const product = await lookupBarcode(code);
      if (!product) {
        setMessage(`No encontramos el código ${code}. Puedes agregarlo a mano.`);
        return;
      }
      router.replace({
        pathname: "/fridge/add",
        params: { name: product.name, category: product.category, note: product.quantityLabel ?? "" },
      });
    } catch {
      lastCode.current = null; // permitir reintento
      setMessage("No se pudo consultar el producto. Revisa tu conexión.");
    } finally {
      setBusy(false);
    }
  };

  const onScanned = ({ data }: BarcodeScanningResult) => handleCode(data);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.tint }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Escanear código</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={[styles.cameraBox, { backgroundColor: permission?.granted ? "#000" : colors.surface }]}>
        {!permission ? (
          <ActivityIndicator />
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={[styles.text, { color: colors.text }]}>
              Necesitamos la cámara para leer el código de barras.
            </Text>
            {permission.canAskAgain ? (
              <ClayButton onPress={requestPermission}>Permitir cámara</ClayButton>
            ) : (
              <Text style={[styles.text, { color: colors.textSecondary }]}>
                Activa el permiso de cámara en los ajustes del dispositivo.
              </Text>
            )}
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
            onBarcodeScanned={busy ? undefined : onScanned}
          />
        )}
        {busy && (
          <View style={[StyleSheet.absoluteFill, styles.center, styles.overlay]}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.overlayText}>Buscando producto…</Text>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        {message ? (
          <Text accessibilityRole="alert" style={[styles.text, { color: colors.danger }]}>
            {message}
          </Text>
        ) : (
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Apunta al código de barras del empaque.
          </Text>
        )}
        <Text style={[styles.label, { color: colors.text }]}>¿No funciona la cámara? Escribe el código</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={[styles.input, neuInset(scheme), { color: colors.text }]}
            value={manualCode}
            onChangeText={(t) => setManualCode(t.replace(/\D/g, ""))}
            placeholder="7702001..."
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            accessibilityLabel="Código de barras"
            maxLength={14}
          />
          <ClayButton
            onPress={() => { lastCode.current = null; handleCode(manualCode); }}
            disabled={busy || manualCode.length < 8}
          >
            Buscar
          </ClayButton>
        </View>
        <TouchableOpacity onPress={() => router.replace("/fridge/add")} accessibilityRole="button">
          <Text style={[styles.link, { color: colors.primary }]}>Agregar sin código</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  back: { fontSize: 18 },
  title: { fontSize: 20, fontWeight: "bold" },
  cameraBox: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  center: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  overlay: { backgroundColor: "rgba(0,0,0,0.55)" },
  overlayText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  bottom: { padding: 16, gap: 12 },
  text: { fontSize: 15, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "600" },
  manualRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, padding: 14, borderRadius: 12, fontSize: 16 },
  link: { textAlign: "center", fontSize: 15, fontWeight: "600" },
});
