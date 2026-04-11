import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const AppointmentFooter = ({ onNext, disabled }: Props) => {
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
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: disabled ? colors.outlineVariant : colors.primary,
            opacity: disabled ? 0.6 : 1,
          },
          !disabled && SHADOWS.md,
        ]}
        onPress={onNext}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, { color: colors.onPrimary }]}>
          {t('appointmentCreate.next')}
        </Text>
        <ArrowRight size={22} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    zIndex: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    height: 64, // Matches py-5 tall feel
    borderRadius: SIZES.radius + 12,
  },
  text: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 18,
    fontWeight: '800',
  },
});
