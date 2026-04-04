import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface Props {
  onClose: () => void;
  onBack?: () => void;
  currentStep: number;
  totalSteps: number;
}

export const AppointmentHeader = ({
  onClose,
  onBack,
  currentStep,
  totalSteps,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftRow}>
          {currentStep > 1 ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={COLORS.onSurface} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.onSurface} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{t('appointmentCreate.title')}</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>
            {t('appointmentCreate.stepIndicator', {
              displayStep: currentStep,
              totalSteps,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  closeBtn: {
    padding: SIZES.sm,
    borderRadius: 100,
    backgroundColor: 'rgba(224, 227, 229, 0.5)',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: '#0f172a', // Matching slate-900 look from HTML
  },
  stepBadge: {
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 100,
  },
  stepText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.onPrimaryFixedVariant,
  },
});
