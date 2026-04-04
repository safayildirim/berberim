import { format, parseISO } from 'date-fns';
import { Calendar, Timer } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { Appointment } from '@/src/types';

interface Props {
  appointment: Appointment;
}

export const AppointmentBentoDetails: React.FC<Props> = ({ appointment }) => {
  const { t } = useTranslation();

  const startDate = parseISO(appointment.starts_at);
  const formattedDate = format(startDate, 'MMM dd');
  const formattedDay = format(startDate, 'EEEE');
  const formattedTime = format(startDate, 'hh:mm a');

  const totalDuration = appointment.services.reduce(
    (acc, s) => acc + s.duration_minutes,
    0,
  );

  return (
    <View style={styles.bentoGrid}>
      {/* Main Info Card */}
      <View style={styles.mainInfoCard}>
        <View>
          <Text style={styles.label}>{t('appointmentDetail.service')}</Text>
          <Text style={styles.serviceHeadline}>
            {appointment.services.map((s) => s.name).join(' & ')}
          </Text>
          <View style={styles.durationRow}>
            <Timer size={18} color={COLORS.primary} />
            <Text style={styles.durationText}>
              {totalDuration} {t('appointmentDetail.minutes')}
            </Text>
          </View>
        </View>

        <View style={styles.staffFooter}>
          <View style={styles.staffAvatar}>
            <Text style={styles.staffInitial}>
              {appointment.staff?.first_name?.[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>
              {t('appointmentDetail.assignedBarber')}
            </Text>
            <Text style={styles.staffName}>
              {appointment.staff?.first_name} {appointment.staff?.last_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.dateCard}>
        <Calendar size={32} color={COLORS.white} strokeWidth={2.5} />
        <Text style={styles.dateDay}>{formattedDate}</Text>
        <Text style={styles.dateTime}>
          {formattedDay} • {formattedTime}
        </Text>
        <TouchableOpacity
          style={styles.addCalendarBtn}
          onPress={() => Alert.alert('Calendar', 'Added to system calendar')}
        >
          <Text style={styles.addCalendarText}>
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
    gap: 8,
  },
  mainInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  serviceHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 30,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#57657a',
  },
  staffFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  dateDay: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 8,
  },
  dateTime: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
  },
  addCalendarBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  addCalendarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    textDecorationLine: 'underline',
    opacity: 0.7,
  },
});
