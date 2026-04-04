import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { AppointmentStatus } from '@/src/types';

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
  const getColors = () => {
    switch (status) {
      case 'confirmed':
        return { bg: COLORS.confirmed, onBg: COLORS.white };
      case 'payment_received':
        return { bg: COLORS.success, onBg: COLORS.white };
      case 'completed':
        return { bg: COLORS.completed, onBg: COLORS.white };
      case 'cancelled':
        return { bg: COLORS.cancelled, onBg: COLORS.white };
      case 'no_show':
        return { bg: COLORS.no_show, onBg: COLORS.white };
      case 'rescheduled':
        return { bg: COLORS.rescheduled, onBg: COLORS.white };
      case 'pending':
        return { bg: COLORS.pending, onBg: COLORS.text };
      case 'success':
        return { bg: COLORS.success, onBg: COLORS.white };
      case 'error':
        return { bg: COLORS.error, onBg: COLORS.white };
      case 'warning':
        return { bg: COLORS.warning, onBg: COLORS.white };
      default:
        return { bg: COLORS.primary, onBg: COLORS.white };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        variant === 'solid'
          ? { backgroundColor: colors.bg }
          : {
              backgroundColor: colors.bg + '15',
              borderColor: colors.bg,
              borderWidth: 0.5,
            },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variant === 'solid' ? colors.onBg : colors.bg },
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
