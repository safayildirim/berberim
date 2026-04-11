import { Check, Phone } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Appointment } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY, SHADOWS } from '@/src/constants/theme';

interface Props {
  appointment: Appointment;
}

export const AppointmentHeader: React.FC<Props> = ({ appointment }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const isPaymentReceived =
    appointment.status === 'payment_received' ||
    appointment.status === 'completed' ||
    !!appointment.payment_received_at;

  const getStatusConfig = () => {
    switch (appointment.status) {
      case 'confirmed':
        return {
          bg: colors.success + '15',
          dot: colors.success,
          text: colors.success,
        };
      case 'cancelled':
      case 'no_show':
        return {
          bg: colors.error + '15',
          dot: colors.error,
          text: colors.error,
        };
      case 'completed':
        return {
          bg: colors.info + '15',
          dot: colors.info,
          text: colors.info,
        };
      default:
        return {
          bg: colors.secondary + '15',
          dot: colors.secondary,
          text: colors.secondary,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const paymentConfig = isPaymentReceived
    ? { bg: colors.success + '15', dot: colors.success, text: colors.success }
    : { bg: colors.error + '15', dot: colors.error, text: colors.error };

  return (
    <View style={styles.header}>
      <View style={styles.customerProfile}>
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: colors.onPrimary }]}>
              {appointment.customer?.first_name?.[0] || 'C'}
            </Text>
          </View>
          <View
            style={[
              styles.verifiedBadge,
              {
                backgroundColor: colors.success,
                borderColor: colors.background,
              },
            ]}
          >
            <Check size={10} color={colors.white} strokeWidth={4} />
          </View>
        </View>
        <View style={styles.customerInfo}>
          <Text
            style={[styles.customerName, { color: colors.primary }]}
            numberOfLines={1}
          >
            {appointment.customer?.first_name} {appointment.customer?.last_name}
          </Text>
          <View style={styles.phoneRow}>
            <Phone size={14} color={colors.secondary} />
            <Text style={[styles.phoneText, { color: colors.secondary }]}>
              {appointment.customer?.phone_number || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.dot }]}
          />
          <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
            {t(`appointments.status.${appointment.status}`).toUpperCase()}
          </Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: paymentConfig.bg }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: paymentConfig.dot }]}
          />
          <Text style={[styles.statusBadgeText, { color: paymentConfig.text }]}>
            {isPaymentReceived
              ? t('appointmentDetail.status.paid').toUpperCase()
              : t('appointmentDetail.status.unpaid').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 20,
    marginBottom: 32,
  },
  customerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    letterSpacing: -1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  phoneText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
});
