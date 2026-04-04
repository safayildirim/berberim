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
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { Appointment } from '@/src/types';

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

  return (
    <View style={styles.actionHub}>
      <Text style={styles.label}>{t('appointmentDetail.actionHub')}</Text>
      <View style={styles.primaryActionRow}>
        <TouchableOpacity
          style={styles.mainActionBtn}
          onPress={onComplete}
          disabled={isCompleting || appointment.status === 'completed'}
        >
          <CheckCircle size={20} color={COLORS.white} />
          <Text style={styles.mainActionText}>
            {isCompleting
              ? t('common.loading')
              : t('appointmentDetail.markCompleted')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={onPay}
          disabled={
            isPaying ||
            appointment.status === 'payment_received' ||
            appointment.status === 'completed'
          }
        >
          <CreditCard size={20} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>
            {isPaying
              ? t('common.loading')
              : t('appointmentDetail.markPaymentReceived')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional Actions */}
      <View style={styles.gridActions}>
        <View style={styles.topActionRow}>
          <TouchableOpacity style={styles.gridActionBtn} onPress={onReschedule}>
            <CalendarClock size={20} color={COLORS.secondary} />
            <Text style={styles.gridActionText}>
              {t('appointmentDetail.reschedule')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridActionBtn}
            onPress={onNoShow}
            disabled={isMarkingNoShow}
          >
            <UserMinus size={20} color={COLORS.secondary} />
            <Text style={styles.gridActionText}>
              {isMarkingNoShow
                ? t('common.loading')
                : t('appointmentDetail.markNoShow')}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.gridActionBtn, styles.dangerActionBtn]}
          onPress={onCancel}
          disabled={isCancelling}
        >
          <XCircle size={20} color="#93000b" />
          <Text style={[styles.gridActionText, { color: '#93000b' }]}>
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
    marginTop: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  primaryActionRow: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 16,
  },
  mainActionBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...SHADOWS.md,
  },
  mainActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  secondaryActionBtn: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...SHADOWS.sm,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    paddingHorizontal: 8,
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
    minHeight: 80,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerActionBtn: {
    backgroundColor: '#eceef0',
    flex: 0,
    width: '100%',
  },
  gridActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#45474d',
  },
});
