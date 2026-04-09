import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { getColors, TYPOGRAPHY } from '@/src/constants/theme';

/**
 * Typography Component
 * Standardized text component using the design system's typography tokens.
 */
export interface TypographyProps {
  variant?: keyof typeof TYPOGRAPHY;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  align = 'left',
  children,
  numberOfLines,
  style,
}) => {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const textColor = color || themeColors.text;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        TYPOGRAPHY[variant],
        { color: textColor, textAlign: align },
        style as any,
      ]}
    >
      {children}
    </Text>
  );
};
