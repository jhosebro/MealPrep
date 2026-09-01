import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';

export type Theme = 'light' | 'dark';
export type Elevation = 'flat' | 'raised' | 'pressed' | 'inset' | 'concave';

type AnyColorScheme = Theme | string | null | undefined;

export type ClayStyle = {
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  color?: string;
  fontSize?: number;
  height?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  elevation?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
};

function isDark(scheme: AnyColorScheme): boolean {
  return scheme === 'dark';
}

function getColors(theme: AnyColorScheme) {
  return isDark(theme) ? Colors.dark : Colors.light;
}

function iosShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number
): ClayStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
}

export function neuShadow(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  const c = getColors(theme);

  if (Platform.OS === 'android') {
    const androidElevation: Record<Elevation, number> = {
      flat: 0,
      raised: 4,
      pressed: 1,
      inset: 0,
      concave: 2,
    };
    return { elevation: androidElevation[elevation] };
  }

  switch (elevation) {
    case 'flat':
      return {
        ...iosShadow(c.shadowLight, -3, -3, 0.7, 6),
        ...iosShadow(c.shadowDark, 3, 3, 0.7, 6),
      };
    case 'raised':
      return {
        ...iosShadow(c.shadowLight, -6, -6, 0.7, 12),
        ...iosShadow(c.shadowDark, 6, 6, 0.7, 12),
      };
    case 'pressed':
      return {
        ...iosShadow(c.shadowDark, 2, 2, 0.5, 4),
        ...iosShadow(c.shadowLight, -2, -2, 0.5, 4),
      };
    case 'inset':
      return {
        ...iosShadow(c.shadowDark, 3, 3, 0.6, 6),
        ...iosShadow(c.shadowLight, -3, -3, 0.6, 6),
      };
    case 'concave':
      return {
        ...iosShadow(c.shadowLight, -4, -4, 0.5, 8),
        ...iosShadow(c.shadowDark, 4, 4, 0.6, 8),
      };
  }
}

export function neuSurface(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  const c = getColors(theme);
  const shadow = neuShadow(theme, elevation);

  return {
    backgroundColor: elevation === 'pressed' ? c.surfacePressed : c.surface,
    borderRadius: 16,
    ...shadow,
  };
}

export function neuInset(theme: AnyColorScheme): ClayStyle {
  const c = getColors(theme);
  return {
    backgroundColor: c.surfacePressed,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderInset,
    ...neuShadow(theme, 'inset'),
  };
}

export function neuCard(theme: AnyColorScheme, elevation: Elevation = 'raised'): ClayStyle {
  return {
    ...neuSurface(theme, elevation),
    padding: 16,
  };
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
  const base: ClayStyle = {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  };

  if (active) {
    return {
      ...base,
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
      ...neuShadow(theme, 'pressed'),
    };
  }

  return {
    ...base,
    backgroundColor: c.surface,
    borderColor: c.borderSubtle,
    ...neuShadow(theme, 'raised'),
  };
}

export function neuProgress(theme: AnyColorScheme): ClayStyle {
  return {
    ...neuInset(theme),
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  };
}
