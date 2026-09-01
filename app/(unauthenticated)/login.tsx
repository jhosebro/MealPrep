import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { biometricService } from '@/services/biometricService';
import { useAuthStore } from '@/stores/authStore';
import { BREAKPOINTS, RESPONSIVE_DEFAULTS } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { ClayButton } from '@/components/clay';
import { neuSurface, neuInset } from '@/lib/neumorphic';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const { user, initialize, signIn, signUp, loading } = useAuthStore();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > BREAKPOINTS.tablet;

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

  const formContent = (
    <>
      <Text style={[styles.title, { color: colors.text }]}>MealPrep</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isSignUp ? 'Crea una cuenta' : 'Inicia sesión'}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={[neuInset(scheme), { padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[neuInset(scheme), { padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, color: colors.text }]}
          placeholder="Contraseña"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {bioAvailable && (
          <TouchableOpacity
            style={[neuSurface(scheme, 'raised'), { borderWidth: 1.5, borderColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }]}
            onPress={handleBiometricLogin}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
              Iniciar sesión con huella
            </Text>
          </TouchableOpacity>
        )}

        <ClayButton onPress={handleSubmit} disabled={loading}>
          {isSignUp ? 'Registrarse' : 'Iniciar sesión'}
        </ClayButton>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isDesktop) {
    return (
      <View style={[styles.container, styles.desktopContainer, { backgroundColor: colors.background }]}>
        <View style={[neuSurface(scheme, 'raised'), { maxWidth: RESPONSIVE_DEFAULTS.loginCardMaxWidth, width: '100%', padding: 32 }]}>
          {formContent}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {formContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  desktopContainer: {
    alignItems: 'center',
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
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
  },
});
