import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Calendar, Timer } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Appointment } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  appointment: Appointment;
}

export const AppointmentBentoDetails: React.FC<Props> = ({ appointment }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const locale = i18n.language.startsWith('tr') ? tr : enUS;
  const startDate = parseISO(appointment.starts_at);
  const formattedDate = format(startDate, 'MMM dd', { locale });
  const formattedDay = format(startDate, 'EEEE', { locale });
  const formattedTime = format(
    startDate,
    i18n.language.startsWith('tr') ? 'HH:mm' : 'hh:mm a',
    { locale },
  );

  const totalDuration = appointment.services.reduce(
    (acc, s) => acc + s.duration_minutes,
    0,
  );

  return (
    <View style={styles.bentoGrid}>
      {/* Main Info Card */}
      <View
        style={[
          styles.mainInfoCard,
          { backgroundColor: colors.card, borderColor: colors.border + '15' },
        ]}
      >
        <View>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('appointmentDetail.service').toUpperCase()}
          </Text>
          <Text style={[styles.serviceHeadline, { color: colors.primary }]}>
            {appointment.services.map((s) => s.name).join(' & ')}
          </Text>
          <View style={styles.durationRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Timer size={14} color={colors.primary} />
            </View>
            <Text style={[styles.durationText, { color: colors.primary }]}>
              {totalDuration} {t('appointmentDetail.minutes')}
            </Text>
          </View>
        </View>

        <View
          style={[styles.staffFooter, { borderTopColor: colors.border + '10' }]}
        >
          <View
            style={[
              styles.staffAvatar,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Text style={[styles.staffInitial, { color: colors.primary }]}>
              {appointment.staff?.first_name?.[0]}
            </Text>
          </View>
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('appointmentDetail.assignedBarber').toUpperCase()}
            </Text>
            <Text style={[styles.staffName, { color: colors.primary }]}>
              {appointment.staff?.first_name} {appointment.staff?.last_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Date Card */}
      <View style={[styles.dateCard, { backgroundColor: colors.primary }]}>
        <View style={styles.dateIconWrapper}>
          <Calendar size={28} color={colors.onPrimary} strokeWidth={2.5} />
        </View>
        <Text style={[styles.dateDay, { color: colors.onPrimary }]}>
          {formattedDate}
        </Text>
        <Text
          style={[styles.dateTime, { color: colors.onPrimary, opacity: 0.8 }]}
        >
          {formattedDay} • {formattedTime}
        </Text>
        <TouchableOpacity
          style={styles.addCalendarBtn}
          onPress={() => Alert.alert('Calendar', 'Added to system calendar')}
        >
          <Text style={[styles.addCalendarText, { color: colors.onPrimary }]}>
            {t('appointmentDetail.addToCalendar')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bentoGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  mainInfoCard: {
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  serviceHeadline: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    lineHeight: 32,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  iconBox: {
    padding: 6,
    borderRadius: 8,
  },
  durationText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 15,
  },
  staffFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInitial: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
  },
  staffName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  dateCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  dateIconWrapper: {
    marginBottom: 8,
  },
  dateDay: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    marginTop: 4,
  },
  dateTime: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
  },
  addCalendarBtn: {
    marginTop: 20,
    paddingVertical: 8,
  },
  addCalendarText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
});
