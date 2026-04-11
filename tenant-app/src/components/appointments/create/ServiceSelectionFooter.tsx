import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background + 'F2',
          borderTopColor: colors.border + '20',
        },
      ]}
    >
      {selectedCount > 0 && (
        <View
          style={[
            styles.quickBar,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <View style={styles.leftInfo}>
            <Scissors size={14} color={colors.secondary} />
            <Text style={[styles.selectedLabel, { color: colors.secondary }]}>
              {t('appointmentCreate.serviceSelected', { count: selectedCount })}
            </Text>
          </View>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            ${totalPrice.toFixed(2)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              selectedCount === 0 ? colors.outlineVariant : colors.primary,
            opacity: selectedCount === 0 ? 0.6 : 1,
          },
          selectedCount > 0 && SHADOWS.md,
        ]}
        onPress={onContinue}
        disabled={selectedCount === 0}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
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
    borderTopWidth: 1,
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 10,
  },
  totalValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    fontSize: 10,
  },
  button: {
    height: 64,
    borderRadius: SIZES.radius + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
});
