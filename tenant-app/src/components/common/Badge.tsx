import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { AppointmentStatus } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface BadgeProps {
  label: string;
  status?:
    | AppointmentStatus
    | 'pending'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';
  variant?: 'solid' | 'subtle';
}

export const Badge = ({
  label,
  status = 'info',
  variant = 'subtle',
}: BadgeProps) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (status) {
      case 'confirmed':
        return { bg: colors.confirmed, onBg: colors.white };
      case 'payment_received':
        return { bg: colors.success, onBg: colors.white };
      case 'completed':
        return { bg: colors.completed, onBg: colors.white };
      case 'cancelled':
        return { bg: colors.cancelled, onBg: colors.white };
      case 'no_show':
        return { bg: colors.no_show, onBg: colors.white };
      case 'rescheduled':
        return { bg: colors.rescheduled, onBg: colors.white };
      case 'pending':
        return { bg: colors.pending, onBg: colors.text };
      case 'success':
        return { bg: colors.success, onBg: colors.white };
      case 'error':
        return { bg: colors.error, onBg: colors.white };
      case 'warning':
        return { bg: colors.warning, onBg: colors.white };
      default:
        return { bg: colors.primary, onBg: colors.white };
    }
  };

  const badgeColors = getColors();

  return (
    <View
      style={[
        styles.badge,
        variant === 'solid'
          ? { backgroundColor: badgeColors.bg }
          : {
              backgroundColor: badgeColors.bg + '15',
              borderColor: badgeColors.bg,
              borderWidth: 0.5,
            },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variant === 'solid' ? badgeColors.onBg : badgeColors.bg },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: 99,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
