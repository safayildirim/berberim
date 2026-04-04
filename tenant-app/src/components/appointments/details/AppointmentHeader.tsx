import { Check, Phone } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { Appointment } from '@/src/types';

interface Props {
  appointment: Appointment;
}

export const AppointmentHeader: React.FC<Props> = ({ appointment }) => {
  const { t } = useTranslation();
  const isPaymentReceived =
    appointment.status === 'payment_received' ||
    appointment.status === 'completed' ||
    !!appointment.payment_received_at;

  return (
    <View style={styles.header}>
      <View style={styles.customerProfile}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {appointment.customer?.first_name?.[0] || 'C'}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Check size={12} color={COLORS.white} strokeWidth={4} />
          </View>
        </View>
        <View>
          <Text style={styles.customerName}>
            {appointment.customer?.first_name} {appointment.customer?.last_name}
          </Text>
          <View style={styles.phoneRow}>
            <Phone size={14} color={COLORS.secondary} />
            <Text style={styles.phoneText}>
              {appointment.customer?.phone_number || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            appointment.status === 'confirmed'
              ? styles.badgeConfirmed
              : styles.badgeDefault,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              appointment.status === 'confirmed'
                ? styles.dotConfirmed
                : styles.dotDefault,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              appointment.status === 'confirmed'
                ? styles.textConfirmed
                : styles.textDefault,
            ]}
          >
            {t(`appointments.status.${appointment.status}`).toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            !isPaymentReceived ? styles.badgeUnpaid : styles.badgePaid,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              !isPaymentReceived ? styles.dotUnpaid : styles.dotPaid,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              !isPaymentReceived ? styles.textUnpaid : styles.textPaid,
            ]}
          >
            {isPaymentReceived
              ? t('appointmentDetail.status.paid')
              : t('appointmentDetail.status.unpaid')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 16,
    marginBottom: 24,
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
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#f7f9fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeConfirmed: { backgroundColor: '#ecfdf5' },
  dotConfirmed: { backgroundColor: '#10b981' },
  textConfirmed: { color: '#065f46' },

  badgeUnpaid: { backgroundColor: '#fef2f2' },
  dotUnpaid: { backgroundColor: '#ef4444' },
  textUnpaid: { color: '#991b1b' },

  badgePaid: { backgroundColor: '#f0f9ff' },
  dotPaid: { backgroundColor: '#0ea5e9' },
  textPaid: { color: '#075985' },

  badgeDefault: { backgroundColor: '#f1f5f9' },
  dotDefault: { backgroundColor: '#64748b' },
  textDefault: { color: '#334155' },
});
