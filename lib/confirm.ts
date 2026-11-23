import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

/** Confirmación que funciona en web (Alert.alert no hace nada en react-native-web). */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmar',
) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};

/** Aviso simple que funciona en web. */
export const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};
