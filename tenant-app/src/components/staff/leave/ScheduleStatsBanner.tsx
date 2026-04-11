import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

interface LeaveStatsBannerProps {
  stats: {
    total: number;
    totalDays: number;
    upcoming: number;
    past: number;
  };
}

export const LeaveStatsBanner = ({ stats }: LeaveStatsBannerProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={styles.label}>
            {t('settings.staff.schedule.totalEntries')}
          </Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{stats.total}</Text>
            <Text style={styles.unit}>
              {t('settings.staff.schedule.entries')}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.label}>
            {t('settings.staff.schedule.totalDays')}
          </Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{stats.totalDays}</Text>
            <Text style={styles.unit}>{t('settings.staff.schedule.days')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <View style={styles.statCard}>
          <Text style={styles.label}>
            {t('settings.staff.schedule.upcoming')}
          </Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, styles.upcomingText]}>
              {stats.upcoming}
            </Text>
            <Text style={styles.unit}>
              {t('settings.staff.schedule.entries')}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.label}>{t('settings.staff.schedule.past')}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, styles.pastText]}>{stats.past}</Text>
            <Text style={styles.unit}>
              {t('settings.staff.schedule.entries')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Manrope',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  upcomingText: {
    color: '#3b82f6',
  },
  pastText: {
    color: COLORS.onSurfaceVariant,
  },
});
