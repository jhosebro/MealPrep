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
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};
