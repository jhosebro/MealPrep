import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#e0e5ec',
    tint: tintColorLight,
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#e0e5ec',
    surface: '#e0e5ec',
    surfacePressed: '#d1d6dd',
    textSecondary: '#6B7280',
    danger: '#e74c3c',
    dangerLight: '#f39c9b',
    success: '#27ae60',
    warning: '#f39c12',
    warningLight: '#f5c77e',
    shadowLight: '#ffffff',
    shadowDark: '#a3b1c6',
    borderSubtle: 'rgba(255,255,255,0.8)',
    borderInset: 'rgba(0,0,0,0.08)',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1a1d1e',
    tint: tintColorDark,
    primary: '#4CAF50',
    primaryDark: '#66BB6A',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1a1d1e',
    surface: '#1a1d1e',
    surfacePressed: '#141617',
    textSecondary: '#9CA3AF',
    danger: '#e74c3c',
    dangerLight: '#c0392b',
    success: '#2ecc71',
    warning: '#f1c40f',
    warningLight: '#d4ac0d',
    shadowLight: '#242728',
    shadowDark: '#101213',
    borderSubtle: 'rgba(255,255,255,0.06)',
    borderInset: 'rgba(0,0,0,0.3)',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

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
