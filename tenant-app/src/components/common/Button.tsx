import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const { colors } = useTheme();
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isError = variant === 'error';
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const buttonStyle = [
    styles.base,
    isPrimary && { backgroundColor: colors.primary },
    isSecondary && { backgroundColor: colors.surfaceContainerHighest },
    isOutline && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    isGhost && styles.ghost,
    isError && { backgroundColor: colors.error },
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    isPrimary && {
      color:
        variant === 'primary' ? colors.onPrimary || colors.white : colors.white,
    },
    isSecondary && { color: colors.text },
    isOutline && { color: colors.primary },
    isGhost && { color: colors.primary },
    isError && { color: colors.white },
    size === 'sm' && styles.smText,
    size === 'lg' && styles.lgText,
  ];

  // Resolve onPrimary if missing in DARK_COLORS update
  const textColor = isPrimary
    ? colors.onPrimary || colors.white
    : isSecondary
      ? colors.text
      : isOutline
        ? colors.primary
        : isGhost
          ? colors.primary
          : colors.white;

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline || isGhost ? colors.primary : textColor}
          size="small"
        />
      ) : (
        <Text style={[textStyle, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
  },
  sm: {
    height: 40,
    paddingHorizontal: SIZES.sm,
  },
  lg: {
    height: 56,
    paddingHorizontal: SIZES.lg,
  },
  fullWidth: {
    width: '100%',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...TYPOGRAPHY.bodyBold,
  },
  smText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  lgText: {
    ...TYPOGRAPHY.subtitle,
  },
});
