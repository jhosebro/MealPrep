import type { ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

// Nombres heredados del estilo neumórfico; ahora producen superficies planas
// (fondo + borde fino + sombra suave) para no tocar cada pantalla.

export type Theme = 'light' | 'dark';
export type Elevation = 'flat' | 'raised' | 'pressed' | 'inset' | 'concave';

type AnyColorScheme = Theme | string | null | undefined;

export type ClayStyle = Pick<
  ViewStyle,
  | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'borderCurve'
  | 'padding' | 'paddingVertical' | 'paddingHorizontal' | 'height' | 'overflow'
  | 'alignItems' | 'justifyContent'
> & { boxShadow?: string }; // string: también válido para TextInput (TextStyle)

function getColors(theme: AnyColorScheme) {
  return theme === 'dark' ? Colors.dark : Colors.light;
}

export function neuShadow(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  const c = getColors(theme);
  if (elevation === 'raised' || elevation === 'concave') {
    return { boxShadow: `0 1px 2px ${c.shadowDark}, 0 4px 12px ${c.shadowDark}` };
  }
  return {};
}

export function neuSurface(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  const c = getColors(theme);
  return {
    backgroundColor: elevation === 'pressed' ? c.primarySoft : c.surface,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: elevation === 'pressed' ? 'transparent' : c.border,
    ...neuShadow(theme, elevation),
  };
}

export function neuInset(theme: AnyColorScheme): ClayStyle {
  const c = getColors(theme);
  return {
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: c.border,
  };
}

export function neuCard(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  return { ...neuSurface(theme, elevation), padding: 16 };
}

export function neuButton(theme: AnyColorScheme, pressed: boolean = false): ClayStyle {
  return {
    ...neuSurface(theme, pressed ? 'pressed' : 'raised'),
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export function neuChip(theme: AnyColorScheme, active: boolean = false): ClayStyle {
  const c = getColors(theme);
  return {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: active ? c.primary : c.surface,
    borderColor: active ? c.primary : c.border,
  };
}

export function neuProgress(theme: AnyColorScheme): ClayStyle {
  const c = getColors(theme);
  return { backgroundColor: c.surfacePressed, height: 8, borderRadius: 4, overflow: 'hidden' };
}
