import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import {
  NoShowAnalysis,
  NoShowByStaff,
  NoShowByTimeSlot,
  NoShowByDayOfWeek,
} from '@/src/types';
import { NoShowRange } from '@/src/hooks/analytics/useAdvancedAnalytics';

interface NoShowAnalysisProps {
  data: NoShowAnalysis | undefined;
  isLoading: boolean;
  range: NoShowRange;
  onRangeChange: (range: NoShowRange) => void;
}

export const NoShowAnalysisSection = ({
  data,
  isLoading,
}: NoShowAnalysisProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('analytics.noShows.title')}</Text>
      <View style={styles.grid}>
        {/* By Staff */}
        <View style={styles.columnCard}>
          <Text style={styles.columnLabel}>
            {t('analytics.noShows.byStaff')}
          </Text>
          <View style={styles.list}>
            {data?.by_staff.slice(0, 2).map((staff: NoShowByStaff) => (
              <View key={staff.staff_user_id} style={styles.listItem}>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {staff.staff_name.split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: staff.no_show_rate > 5 ? COLORS.error : '#059669',
                    },
                  ]}
                >
                  {staff.no_show_rate.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* By Time Slot */}
        <View style={styles.columnCard}>
          <Text style={styles.columnLabel}>
            {t('analytics.noShows.byTimeSlot')}
          </Text>
          <View style={styles.list}>
            {data?.by_time_slot.slice(0, 2).map((slot: NoShowByTimeSlot) => (
              <View key={slot.time_slot} style={styles.listItem}>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {t(`analytics.noShows.${slot.time_slot}`).split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: slot.no_show_rate > 5 ? COLORS.error : '#059669',
                    },
                  ]}
                >
                  {slot.no_show_rate.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* By Day */}
        <View style={styles.columnCard}>
          <Text style={styles.columnLabel}>{t('analytics.noShows.byDay')}</Text>
          <View style={styles.list}>
            {data?.by_day_of_week.slice(0, 2).map((day: NoShowByDayOfWeek) => (
              <View key={day.day_of_week} style={styles.listItem}>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {day.day_name.substring(0, 3)}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: day.no_show_rate > 5 ? COLORS.error : '#059669',
                    },
                  ]}
                >
                  {day.no_show_rate.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
    gap: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  columnCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '15',
    gap: 12,
  },
  columnLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.secondary,
    flex: 1,
    marginRight: 4,
  },
  itemValue: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
  },
});
