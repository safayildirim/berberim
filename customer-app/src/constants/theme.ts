import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const LIGHT_COLORS = {
  // Default fallback colors
  primary: '#000000',
  primaryDim: '#4a5268',
  secondary: '#5f5e5e',
  tertiary: '#1c1b1a',
  background: '#fdf8f8',
  card: '#ffffff',
  text: '#1c1b1b',
  muted: '#f1edec',
  border: '#e5e2e1',
  error: '#ba1a1a',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Specific surfaces from design
  surfaceDim: '#ddd9d8',
  surfaceContainer: '#f1edec',
  surfaceContainerLow: '#f7f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#ebe7e6',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',
  onSurfaceVariant: '#444748',
  onPrimary: '#ffffff',
  secondaryContainer: '#e5e2e1',
  onSecondaryContainer: '#656464',
  tertiaryContainer: '#1c1b1a',
  onTertiaryContainer: '#868382',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryContainer: '#1c1b1b',
  onPrimaryContainer: '#858383',
  outlineVariant: 'rgba(196, 199, 199, 0.1)',
  onSurface: '#1c1b1b',
  outline: '#747878',
};

export const DARK_COLORS = {
  primary: '#ffffff',
  primaryDim: '#94a3b8',
  secondary: '#94a3b8',
  tertiary: '#f8fafc',
  background: '#09090b',
  card: '#18181b',
  text: '#f8fafc',
  muted: '#27272a',
  border: '#27272a',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Specific surfaces from design
  surfaceDim: '#18181b',
  surfaceContainer: '#18181b',
  surfaceContainerLow: '#09090b',
  surfaceContainerLowest: '#000000',
  surfaceContainerHigh: '#27272a',
  surfaceContainerHighest: '#3f3f46',
  surfaceVariant: '#27272a',
  onSurfaceVariant: '#94a3b8',
  onPrimary: '#000000',
  secondaryContainer: '#27272a',
  onSecondaryContainer: '#a1a1aa',
  tertiaryContainer: '#f8fafc',
  onTertiaryContainer: '#94a3b8',
  errorContainer: '#450a0a',
  onErrorContainer: '#f87171',
  primaryContainer: '#f8fafc',
  onPrimaryContainer: '#94a3b8',
  outlineVariant: 'rgba(255, 255, 255, 0.1)',
  onSurface: '#f8fafc',
  outline: '#52525b',
};

export const COLORS = LIGHT_COLORS; // Default for backward compatibility

export const getColors = (isDark: boolean) =>
  isDark ? DARK_COLORS : LIGHT_COLORS;

export const IMAGES = {
  defaultLogo:
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=150&h=150',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  radius: 12,
  padding: 12,
  width,
  height,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};
