import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const LIGHT_COLORS = {
  // Brand family colors
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

  // New Design Surfaces & Tokens
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

  // Secondary family
  secondaryFixed: '#d5e3fc',
  secondaryFixedDim: '#b9c7df',

  // Primary family
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

export const DARK_COLORS = {
  // Brand family colors (premium navy/charcoal)
  primary: '#d7e2ff',
  primaryContainer: '#1b263b',
  primaryDim: '#545e76',
  secondary: '#bfc7d9',
  secondaryContainer: '#3c475d',
  tertiary: '#ffb4ab',
  background: '#051125',
  card: '#1b263b',
  text: '#e0e3e5',
  muted: '#8e9199',
  border: '#45474d',
  error: '#ffb4ab',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Surface Tokens
  surface: '#051125',
  surfaceDim: '#101b30',
  surfaceBright: '#1b263b',
  surfaceContainerLowest: '#0d1c2e',
  surfaceContainerLow: '#101b30',
  surfaceContainer: '#1b263b',
  surfaceContainerHigh: '#263148',
  surfaceContainerHighest: '#333e56',
  onSurface: '#e0e3e5',
  onSurfaceVariant: '#c5c6cd',
  outline: '#8e9199',
  outlineVariant: '#45474d',

  // Additional Layout Tokens
  onPrimary: '#002e69',
  onPrimaryContainer: '#d7e2ff',
  onSecondary: '#293142',
  onSecondaryContainer: '#d5e3fc',
  onSecondaryFixed: '#d5e3fc',
  onSecondaryFixedVariant: '#3c475d',
  tertiaryContainer: '#930006',
  onTertiary: '#690005',
  tertiaryFixed: '#ffdad6',
  tertiaryFixedDim: '#ffb4ab',
  onTertiaryFixed: '#410002',
  onTertiaryContainer: '#ffdad6',

  // Secondary family
  secondaryFixed: '#d5e3fc',
  secondaryFixedDim: '#b9c7df',

  // Primary family
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

// Default for backward compatibility
export const COLORS = LIGHT_COLORS;

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
