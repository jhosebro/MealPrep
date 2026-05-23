import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { biometricService } from '@/services/biometricService';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, initialize, signIn, signUp, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    biometricService.isAvailable().then(setBioAvailable);
  }, []);

  useEffect(() => {
    if (user) {
      // @ts-ignore
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    const available = await biometricService.isAvailable();
    if (available) {
      const enabled = await biometricService.isEnabled();
      if (!enabled) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            '¿Quieres usar tu huella?',
            'Podés abrir la app más rápido con tu huella digital.',
            [
              { text: 'Ahora no', style: 'cancel', onPress: () => resolve() },
              { text: 'Sí', onPress: () => biometricService.setEnabled(true).then(resolve) },
            ]
          );
        });
      }
    }
  };

  const handleBiometricLogin = async () => {
    const ok = await biometricService.authenticate();
    if (!ok) return;

    const enabled = await biometricService.isEnabled();
    if (!enabled) await biometricService.setEnabled(true);

    await initialize();

    if (!useAuthStore.getState().user) {
      Alert.alert(
        'No se pudo restaurar la sesión',
        'Iniciá sesión con tu correo para guardar tu sesión de nuevo.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>MealPrep</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isSignUp ? 'Crea una cuenta' : 'Inicia sesión'}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Contraseña"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {bioAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, { borderColor: colors.primary }]}
            onPress={handleBiometricLogin}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
              Iniciar sesión con huella
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Registrarse' : 'Iniciar sesión'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  biometricButton: {
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
  },
});