import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';

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
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isError = variant === 'error';
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const buttonStyle = [
    styles.base,
    isPrimary && styles.primary,
    isSecondary && styles.secondary,
    isOutline && styles.outline,
    isGhost && styles.ghost,
    isError && styles.error,
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    isPrimary && styles.primaryText,
    isSecondary && styles.secondaryText,
    isOutline && styles.outlineText,
    isGhost && styles.ghostText,
    isError && styles.errorText,
    size === 'sm' && styles.smText,
    size === 'lg' && styles.lgText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline || isGhost ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
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
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  error: {
    backgroundColor: COLORS.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...TYPOGRAPHY.bodyBold,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.text,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.white,
  },
  smText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  lgText: {
    ...TYPOGRAPHY.subtitle,
  },
});
