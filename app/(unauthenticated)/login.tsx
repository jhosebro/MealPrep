import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signInWithGoogle } from '@/services/googleAuth';
import { biometricService } from '@/services/biometricService';
import { useAuthStore } from '@/stores/authStore';
import { BREAKPOINTS, RESPONSIVE_DEFAULTS } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BrandLogo } from '@/components/brand-logo';
import { ClayButton } from '@/components/clay';
import { neuSurface, neuInset } from '@/lib/neumorphic';
import { loginFormError, translateAuthError } from '@/utils/auth-errors';
import { Ionicons } from '@expo/vector-icons';

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
  const [notice, setNotice] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    biometricService.isAvailable().then(setBioAvailable);
  }, []);

  useEffect(() => {
    if (user) {
      // @ts-ignore
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch {
      setError('Error de conexión con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    const formError = loginFormError(email, password);
    if (formError) {
      setError(formError);
      return;
    }

    setError('');
    setNotice('');
    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(translateAuthError(result.error.message));
      return;
    }

    if ('needsConfirmation' in result && result.needsConfirmation) {
      setNotice('Te enviamos un correo. Confirma tu cuenta y luego inicia sesión.');
      setIsSignUp(false);
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
      <View style={styles.brand}>
        <BrandLogo size={56} />
      </View>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        Cocina con lo que ya tienes en la nevera
      </Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        {isSignUp ? 'Crea una cuenta' : 'Inicia sesión'}
      </Text>

      <TouchableOpacity
        style={[neuSurface(scheme, 'raised'), styles.googleButton]}
        onPress={handleGoogleLogin}
        disabled={googleLoading}
        accessibilityLabel={isSignUp ? 'Registrarse con Google' : 'Continuar con Google'}
        accessibilityRole="button"
      >
        {googleLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              {isSignUp ? 'Registrarse con Google' : 'Continuar con Google'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.form}>
        <TextInput
          style={[neuInset(scheme), styles.input, { color: colors.text }]}
          placeholder="Correo electrónico"
          accessibilityLabel="Correo electrónico"
          autoComplete="email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[neuInset(scheme), styles.input, { color: colors.text }]}
          placeholder="Contraseña"
          accessibilityLabel="Contraseña"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        {notice ? (
          <Text accessibilityRole="alert" style={[styles.notice, { color: colors.primaryDark, backgroundColor: colors.primarySoft }]}>
            {notice}
          </Text>
        ) : null}

        {bioAvailable && (
          <TouchableOpacity
            style={[neuSurface(scheme, 'flat'), styles.bioButton, { borderColor: colors.primary }]}
            onPress={handleBiometricLogin}
            accessibilityRole="button"
          >
            <Ionicons name="finger-print" size={20} color={colors.primary} />
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
          onPress={() => { setIsSignUp(!isSignUp); setError(''); }}
          accessibilityRole="button"
        >
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </Text>
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
  brand: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  notice: {
    textAlign: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bioButton: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
});
