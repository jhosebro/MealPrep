import { Platform } from 'react-native';

// Paleta de marca MealPrep: verde hoja + naranja zanahoria sobre fondos crema.
export const Colors = {
  light: {
    text: '#1D2A22',
    textSecondary: '#5E6B63',
    background: '#F7F6F2',
    tint: '#3E9B5F',
    primary: '#3E9B5F',
    primaryDark: '#2F7A4A',
    primarySoft: '#E3F2E8',
    accent: '#F28C38',
    accentSoft: '#FDEBDC',
    onPrimary: '#FFFFFF',
    icon: '#5E6B63',
    tabIconDefault: '#8A958E',
    tabIconSelected: '#3E9B5F',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfacePressed: '#F0EEE8',
    border: '#E6E3DA',
    danger: '#D64545',
    dangerLight: '#FBE3E3',
    success: '#2E8B57',
    warning: '#D9822B',
    warningLight: '#FDEBDC',
    shadowLight: '#FFFFFF',
    shadowDark: 'rgba(29, 42, 34, 0.08)',
    borderSubtle: '#E6E3DA',
    borderInset: '#E6E3DA',
    overlay: 'rgba(18, 22, 20, 0.45)',
  },
  dark: {
    text: '#EDF2EE',
    textSecondary: '#9AA7A0',
    background: '#121614',
    tint: '#5BBE7E',
    primary: '#5BBE7E',
    primaryDark: '#7FD39C',
    primarySoft: '#1F3527',
    accent: '#F5A15A',
    accentSoft: '#3A2A1C',
    onPrimary: '#0E1A12',
    icon: '#9AA7A0',
    tabIconDefault: '#6F7C75',
    tabIconSelected: '#5BBE7E',
    card: '#1B201D',
    surface: '#1B201D',
    surfacePressed: '#232A26',
    border: '#2A322D',
    danger: '#F07171',
    dangerLight: '#3A1F1F',
    success: '#5BBE7E',
    warning: '#F5A15A',
    warningLight: '#3A2A1C',
    shadowLight: '#1B201D',
    shadowDark: 'rgba(0, 0, 0, 0.4)',
    borderSubtle: '#2A322D',
    borderInset: '#2A322D',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

/** Color por tipo de comida (insignias en recetas). Mismo valor en ambos modos. */
export const MealTypeColors: Record<string, string> = {
  desayuno: '#F2A93B',
  almuerzo: '#3E9B5F',
  cena: '#8E6CC4',
  merienda: '#3B9BD9',
  snack: '#D9822B',
};
export const MealTypeDefault = '#8A958E';

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, full: 9999 } as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
