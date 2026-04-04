import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';

interface Props {
  selectedCount: number;
  totalPrice: number;
  onContinue: () => void;
  hasDateTime?: boolean;
}

export const ServiceSelectionFooter = ({
  selectedCount,
  totalPrice,
  onContinue,
  hasDateTime,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container]}>
      {selectedCount > 0 && (
        <View style={styles.quickBar}>
          <View style={styles.leftInfo}>
            <Scissors size={14} color={COLORS.secondary} />
            <Text style={styles.selectedLabel}>
              {t('appointmentCreate.serviceSelected', { count: selectedCount })}
            </Text>
          </View>
          <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          selectedCount === 0 && styles.disabledButton,
          selectedCount > 0 && SHADOWS.md,
        ]}
        onPress={onContinue}
        disabled={selectedCount === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {hasDateTime
            ? t('appointmentCreate.reviewAppointment')
            : t('appointmentCreate.continueToDateTime')}
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
  disabledButton: {
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
  },
  buttonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.white,
  },
});
