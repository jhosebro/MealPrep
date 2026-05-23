import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = 'biometric_enabled';

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch {
      return false;
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await AsyncStorage.setItem(BIOMETRIC_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_KEY);
    }
  },

  async authenticate(): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) return false;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicia sesión con tu huella',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
      });
      return result.success;
    } catch {
      return false;
    }
  },
};
