import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppointmentStickyActionsProps {
  status: string;
  onReschedule: () => void;
  onCancel: () => void;
  isCancelling?: boolean;
}

export const AppointmentStickyActions = ({
  status,
  onReschedule,
  onCancel,
  isCancelling,
}: AppointmentStickyActionsProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const isActive =
    status !== 'completed' && status !== 'cancelled' && status !== 'no_show';

  if (!isActive) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.outlineVariant,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <TouchableOpacity
        onPress={onReschedule}
        style={[
          styles.button,
          { backgroundColor: isDark ? colors.surfaceContainerHigh : '#f3f4f6' },
        ]}
      >
        <Typography
          variant="label"
          style={[styles.buttonText, { color: colors.text }]}
        >
          {t('appointments.reschedule')}
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCancel}
        disabled={isCancelling}
        style={[
          styles.button,
          styles.cancelButton,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
          },
        ]}
      >
        <Typography
          variant="label"
          style={[styles.buttonText, { color: isDark ? '#f87171' : '#dc2626' }]}
        >
          {isCancelling
            ? t('common.loading')
            : t('appointments.cancelAppointment')}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
