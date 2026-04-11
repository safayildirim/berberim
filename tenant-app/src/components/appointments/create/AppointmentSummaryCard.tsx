import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Calendar, Clock, UserCircle } from 'lucide-react-native';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Customer, Service, Staff } from '@/src/types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  customer: Customer | null;
  staff: Staff | null;
  services: Service[];
  date: string;
  time: string;
}

export const AppointmentSummaryCard = ({
  customer,
  staff,
  services,
  date,
  time,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const totalPrice = services.reduce(
    (sum, s) => sum + parseFloat(s.base_price),
    0,
  );

  // Simple formatting helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(i18n.language, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to calculate end time
  const getFullTimeSlot = (startTime: string, servicesList: Service[]) => {
    if (!startTime) return '—';
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);

      const totalDuration = servicesList.reduce(
        (sum, s) => sum + s.duration_minutes,
        0,
      );
      const end = new Date(start.getTime() + totalDuration * 60000);

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString(i18n.language, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: i18n.language !== 'tr', // TR uses 24h, EN uses AM/PM
        });
      };

      return `${formatTime(start)} — ${formatTime(end)}`;
    } catch {
      return startTime;
    }
  };

  return (
    <View style={styles.container}>
      {/* Customer Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '20' },
        ]}
      >
        <Text style={[styles.label, { color: colors.secondary }]}>
          {t('appointmentCreate.customerSummary').toUpperCase()}
        </Text>
        <View style={styles.contentRow}>
          <View
            style={[
              styles.avatarBox,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {customer?.first_name?.[0]}
              {customer?.last_name?.[0]}
            </Text>
          </View>
          <View>
            <Text style={[styles.title, { color: colors.primary }]}>
              {customer?.first_name} {customer?.last_name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.outline }]}>
              {customer?.phone_number || t('common.noPhone')}
            </Text>
          </View>
        </View>
      </View>

      {/* Staff Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '20' },
        ]}
      >
        <Text style={[styles.label, { color: colors.secondary }]}>
          {t('appointmentCreate.professionalSummary').toUpperCase()}
        </Text>
        <View style={styles.contentRow}>
          {staff?.avatar_url ? (
            <Image
              source={{ uri: staff.avatar_url }}
              style={[
                styles.avatarImg,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarBox,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <UserCircle size={28} color={colors.secondary} />
            </View>
          )}
          <View>
            <Text style={[styles.title, { color: colors.primary }]}>
              {staff?.first_name} {staff?.last_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Schedule Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '20' },
        ]}
      >
        <View style={styles.scheduleRow}>
          <View
            style={[styles.iconBox, { backgroundColor: colors.error + '15' }]}
          >
            <Calendar size={20} color={colors.error} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('appointmentCreate.dateLabel')}
            </Text>
            <Text style={[styles.title, { color: colors.primary }]}>
              {formatDate(date)}
            </Text>
          </View>
        </View>

        <View style={[styles.scheduleRow, { marginTop: SIZES.lg }]}>
          <View
            style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}
          >
            <Clock size={20} color={colors.primary} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('appointmentCreate.timeLabel')}
            </Text>
            <Text style={[styles.title, { color: colors.primary }]}>
              {getFullTimeSlot(time, services)}
            </Text>
          </View>
        </View>
      </View>

      {/* Services Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '20' },
        ]}
      >
        <Text style={[styles.label, { color: colors.secondary }]}>
          {t('appointmentCreate.servicesSummary').toUpperCase()}
        </Text>
        <View style={styles.servicesList}>
          {services.map((s) => (
            <View key={s.id} style={styles.serviceItem}>
              <Text style={[styles.serviceName, { color: colors.secondary }]}>
                {s.name}
              </Text>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>
                ${parseFloat(s.base_price).toFixed(2)}
              </Text>
            </View>
          ))}
          <View
            style={[styles.divider, { backgroundColor: colors.border + '20' }]}
          />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.secondary }]}>
              {t('common.grandTotal')}
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SIZES.md,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: SIZES.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesList: {
    marginTop: SIZES.xs,
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  servicePrice: {
    ...TYPOGRAPHY.bodyBold,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
  },
});
