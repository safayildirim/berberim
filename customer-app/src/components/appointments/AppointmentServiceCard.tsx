import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

interface AppointmentServiceCardProps {
  serviceName: string;
  price: string;
  date: string;
  duration: string;
}

export const AppointmentServiceCard = ({
  serviceName,
  price,
  date,
  duration,
}: AppointmentServiceCardProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Typography variant="h3" style={[styles.title, { color: colors.text }]}>
        {t('appointments.summary')}
      </Typography>

      <View
        style={[
          styles.timeRow,
          { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5' },
        ]}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fde68a',
            },
          ]}
        >
          <CalendarClock size={24} color="#d97706" />
        </View>
        <View>
          <Typography
            variant="h2"
            style={[styles.dateText, { color: colors.text }]}
          >
            {date}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: colors.onSurfaceVariant }}
          >
            {t('appointments.durationValue', { duration })}
          </Typography>
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.row}>
          <Typography
            variant="body"
            style={[styles.serviceName, { color: colors.onSurfaceVariant }]}
          >
            {serviceName}
          </Typography>
          <Typography
            variant="body"
            style={[styles.priceText, { color: colors.text }]}
          >
            {price}
          </Typography>
        </View>

        <View
          style={[
            styles.totalRow,
            { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5' },
          ]}
        >
          <Typography
            variant="h3"
            style={[styles.totalLabel, { color: colors.text }]}
          >
            {t('booking.total')}
          </Typography>
          <Typography variant="h2" style={styles.totalValue}>
            {price}
          </Typography>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  iconBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
  },
  breakdown: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#d97706',
  },
});
