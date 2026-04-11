import {
  CalendarClock,
  CheckCircle,
  CreditCard,
  UserMinus,
  XCircle,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Appointment } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  appointment: Appointment;
  onComplete: () => void;
  onPay: () => void;
  onNoShow: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  isCompleting?: boolean;
  isPaying?: boolean;
  isMarkingNoShow?: boolean;
  isCancelling?: boolean;
}

export const AppointmentActionHub: React.FC<Props> = ({
  appointment,
  onComplete,
  onPay,
  onNoShow,
  onCancel,
  onReschedule,
  isCompleting,
  isPaying,
  isMarkingNoShow,
  isCancelling,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.actionHub,
        {
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: colors.background + 'F2',
          borderTopColor: colors.border + '15',
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.secondary }]}>
        {t('appointmentDetail.actionHub').toUpperCase()}
      </Text>
      <View style={styles.primaryActionRow}>
        <TouchableOpacity
          style={[styles.mainActionBtn, { backgroundColor: colors.primary }]}
          onPress={onComplete}
          disabled={isCompleting || appointment.status === 'completed'}
        >
          <CheckCircle size={20} color={colors.onPrimary} />
          <Text style={[styles.mainActionText, { color: colors.onPrimary }]}>
            {isCompleting
              ? t('common.loading')
              : t('appointmentDetail.markCompleted')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryActionBtn,
            { backgroundColor: colors.card, borderColor: colors.border + '15' },
          ]}
          onPress={onPay}
          disabled={
            isPaying ||
            appointment.status === 'payment_received' ||
            appointment.status === 'completed'
          }
        >
          <CreditCard size={20} color={colors.primary} />
          <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
            {isPaying
              ? t('common.loading')
              : t('appointmentDetail.markPaymentReceived')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional Actions */}
      <View style={styles.gridActions}>
        <View style={styles.topActionRow}>
          <TouchableOpacity
            style={[
              styles.gridActionBtn,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
            onPress={onReschedule}
          >
            <CalendarClock size={20} color={colors.primary} />
            <Text style={[styles.gridActionText, { color: colors.primary }]}>
              {t('appointmentDetail.reschedule')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.gridActionBtn,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
            onPress={onNoShow}
            disabled={isMarkingNoShow}
          >
            <UserMinus size={20} color={colors.primary} />
            <Text style={[styles.gridActionText, { color: colors.primary }]}>
              {isMarkingNoShow
                ? t('common.loading')
                : t('appointmentDetail.markNoShow')}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.gridActionBtn,
            styles.dangerActionBtn,
            { backgroundColor: colors.error + '10' },
          ]}
          onPress={onCancel}
          disabled={isCancelling}
        >
          <XCircle size={20} color={colors.error} />
          <Text style={[styles.gridActionText, { color: colors.error }]}>
            {isCancelling
              ? t('common.loading')
              : t('appointmentDetail.cancelBooking')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionHub: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    ...SHADOWS.lg,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  primaryActionRow: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 16,
  },
  mainActionBtn: {
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...SHADOWS.md,
  },
  mainActionText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  secondaryActionBtn: {
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
  },
  secondaryActionText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    textAlign: 'center',
  },
  gridActions: {
    gap: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridActionBtn: {
    flex: 1,
    minHeight: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerActionBtn: {
    flex: 0,
    width: '100%',
    minHeight: 56,
  },
  gridActionText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
});
