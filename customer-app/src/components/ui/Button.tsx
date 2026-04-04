import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { useTenantStore } from '@/src/store/useTenantStore';

/**
 * Button Component
 */
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  titleStyle,
}) => {
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: primaryColor };
      case 'secondary':
        return { backgroundColor: COLORS.secondary };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: primaryColor,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: primaryColor };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return { color: COLORS.white };
      case 'outline':
      case 'ghost':
        return { color: primaryColor };
      default:
        return { color: COLORS.white };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        },
        getVariantStyles(),
        getSizeStyles(),
        disabled && { opacity: 0.5 },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? primaryColor
              : COLORS.white
          }
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              {
                fontWeight: '600',
                textAlign: 'center',
              },
              getTextStyle(),
              size === 'sm' && { fontSize: 14 },
              titleStyle as any,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
