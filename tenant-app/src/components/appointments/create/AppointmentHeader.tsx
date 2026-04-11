import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background + 'CC',
          borderBottomColor: colors.border + '20',
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftRow}>
          {currentStep > 1 ? (
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.primary }]}>
            {t('appointmentCreate.title')}
          </Text>
        </View>
        <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.stepText, { color: colors.onPrimary }]}>
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
    borderBottomWidth: 1,
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
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
  },
  stepBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 100,
  },
  stepText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
  },
});
