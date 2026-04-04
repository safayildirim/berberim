import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const AppointmentFooter = ({ onNext, disabled }: Props) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container]}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.disabledButton,
          !disabled && SHADOWS.md,
        ]}
        onPress={onNext}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.text}>{t('appointmentCreate.next')}</Text>
        <ArrowRight size={22} color={COLORS.white} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 50,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    height: 64, // Matches py-5 tall feel
    borderRadius: SIZES.radius + 12,
  },
  disabledButton: {
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
  },
  text: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
});
