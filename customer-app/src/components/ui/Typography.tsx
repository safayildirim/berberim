import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';

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
  color = COLORS.text,
  align = 'left',
  children,
  numberOfLines,
  style,
}) => {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[TYPOGRAPHY[variant], { color, textAlign: align }, style as any]}
    >
      {children}
    </Text>
  );
};
