import React from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';

/**
 * Card Component
 */
export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { ...SHADOWS.sm, backgroundColor: COLORS.card };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
        };
      case 'flat':
        return { backgroundColor: COLORS.muted };
      default:
        return { ...SHADOWS.sm, backgroundColor: COLORS.card };
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        { padding: SIZES.md, marginVertical: SIZES.sm },
        getVariantStyles(),
        style as any,
      ]}
    >
      {children}
    </Container>
  );
};
