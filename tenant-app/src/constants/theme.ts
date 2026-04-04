import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Brand family colors (restored from customer app)
  primary: '#051125',
  primaryContainer: '#1b263b',
  primaryDim: '#545e76',
  secondary: '#515f74',
  secondaryContainer: '#d5e3fc',
  tertiary: '#2d0001',
  background: '#f7f9fb',
  card: '#ffffff',
  text: '#191c1e',
  muted: '#75777d',
  border: '#c5c6cd',
  error: '#ba1a1a',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // New Design Surfaces & Tokens from HTML
  surface: '#f7f9fb',
  surfaceDim: '#d8dadc',
  surfaceBright: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#45474d',
  outline: '#75777d',
  outlineVariant: '#c5c6cd',

  // Additional Layout Tokens
  onPrimary: '#ffffff',
  onPrimaryContainer: '#828da7',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#57657a',
  onSecondaryFixed: '#0d1c2e',
  onSecondaryFixedVariant: '#3a485b',
  tertiaryContainer: '#2d0001',
  onTertiary: '#ffffff',
  tertiaryFixed: '#ffdad6',
  tertiaryFixedDim: '#ffb4ab',
  onTertiaryFixed: '#410002',
  onTertiaryContainer: '#fc4f45',

  // Secondary family from HTML
  secondaryFixed: '#d5e3fc',
  secondaryFixedDim: '#b9c7df',

  // Primary family from HTML
  primaryFixed: '#d7e2ff',
  onPrimaryFixed: '#101b30',
  onPrimaryFixedVariant: '#3c475d',

  // Status colors
  confirmed: '#10B981',
  completed: '#6366F1',
  cancelled: '#EF4444',
  no_show: '#9CA3AF',
  rescheduled: '#F59E0B',
  pending: '#FCD34D',
  info: '#6366F1',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  radius: 8, // Slightly tighter radius for operational feel (was 12)
  padding: 16, // Slightly tighter padding for staff app (was 20)
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
    fontSize: 28, // Slightly smaller headers for operational app
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 14, // Slightly smaller body for more information density (was 16)
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
};
