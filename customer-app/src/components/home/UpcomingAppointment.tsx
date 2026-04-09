import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, Navigation, CalendarClock } from 'lucide-react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { UpcomingAppointment as AppointmentType } from '@/src/hooks/useHomeData';

interface UpcomingAppointmentProps {
  appointment: AppointmentType;
}

export const UpcomingAppointment = ({
  appointment,
}: UpcomingAppointmentProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Typography
        variant="h3"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        {t('home.upcomingAppointments')}
      </Typography>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.shopInfo}>
            <Image
              source={{ uri: appointment.shopImage }}
              style={styles.shopImage}
            />
            <View>
              <Typography style={[styles.shopName, { color: colors.text }]}>
                {appointment.shopName}
              </Typography>
              <Typography
                variant="caption"
                style={{ color: colors.onSurfaceVariant }}
              >
                • {appointment.barberName}
              </Typography>
            </View>
          </View>
          <View
            style={[
              styles.timeChip,
              {
                backgroundColor: isDark
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(245, 158, 11, 0.1)',
              },
            ]}
          >
            <Clock size={12} color="#f59e0b" />
            <Typography style={styles.timeChipText}>
              {t('common.details')}
            </Typography>
          </View>
        </View>

        <View
          style={[
            styles.detailsRow,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.detailItem}>
            <CalendarClock size={16} color="#f59e0b" />
            <Typography style={[styles.detailText, { color: colors.text }]}>
              {appointment.date}
            </Typography>
          </View>
          <View
            style={[
              styles.detailDivider,
              { backgroundColor: colors.outlineVariant },
            ]}
          />
          <Typography style={[styles.serviceText, { color: colors.text }]}>
            {appointment.service}
          </Typography>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.rescheduleButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Typography style={[styles.buttonText, { color: colors.text }]}>
              {t('appointments.reschedule')}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.directionsButton}>
            <Navigation size={16} color="#000" />
            <Typography style={styles.directionsText}>
              {t('appointments.directions')}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  card: {
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  shopName: {
    fontWeight: '800',
    fontSize: 16,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  timeChipText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#4b5563',
    marginHorizontal: 12,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rescheduleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  directionsButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  directionsText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
