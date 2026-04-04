import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';

interface Props {
  totalPrice: number;
  loading: boolean;
  onConfirm: () => void;
}

export const FinalReviewFooter = ({
  totalPrice,
  loading,
  onConfirm,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container]}>
      <View style={styles.quickBar}>
        <View style={styles.leftInfo}>
          <CheckCircle2 size={14} color={COLORS.secondary} />
          <Text style={styles.selectedLabel}>
            {t('appointmentCreate.finalBookingTotal')}
          </Text>
        </View>
        <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, SHADOWS.md]}
        onPress={onConfirm}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {loading
            ? t('common.processing')
            : t('appointmentCreate.confirmBooking')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 30,
    marginBottom: SIZES.md,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  selectedLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  totalValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.primary,
    fontSize: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: SIZES.radius + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.white,
  },
});
