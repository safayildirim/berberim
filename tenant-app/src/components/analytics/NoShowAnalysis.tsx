import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import {
  NoShowAnalysis,
  NoShowByStaff,
  NoShowByTimeSlot,
  NoShowByDayOfWeek,
} from '@/src/types';
import { NoShowRange } from '@/src/hooks/analytics/useAdvancedAnalytics';
import { useTheme } from '@/src/hooks/useTheme';

interface NoShowAnalysisProps {
  data: NoShowAnalysis | undefined;
  isLoading: boolean;
  range: NoShowRange;
  onRangeChange: (range: NoShowRange) => void;
}

export const NoShowAnalysisSection = ({
  data,
}: NoShowAnalysisProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('analytics.noShows.title').toUpperCase()}
      </Text>
      <View style={styles.grid}>
        {/* By Staff */}
        <View style={[styles.columnCard, { backgroundColor: colors.card, borderColor: colors.border + '15' }]}>
          <Text style={[styles.columnLabel, { color: colors.secondary }]}>
            {t('analytics.noShows.byStaff')}
          </Text>
          <View style={styles.list}>
            {data?.by_staff.slice(0, 2).map((staff: NoShowByStaff) => (
              <View key={staff.staff_user_id} style={styles.listItem}>
                <Text style={[styles.itemLabel, { color: colors.secondary }]} numberOfLines={1}>
                  {staff.staff_name.split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: staff.no_show_rate > 5 ? colors.error : colors.success,
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
        <View style={[styles.columnCard, { backgroundColor: colors.card, borderColor: colors.border + '15' }]}>
          <Text style={[styles.columnLabel, { color: colors.secondary }]}>
            {t('analytics.noShows.byTimeSlot')}
          </Text>
          <View style={styles.list}>
            {data?.by_time_slot.slice(0, 2).map((slot: NoShowByTimeSlot) => (
              <View key={slot.time_slot} style={styles.listItem}>
                <Text style={[styles.itemLabel, { color: colors.secondary }]} numberOfLines={1}>
                  {t(`analytics.noShows.${slot.time_slot}`).split(' ')[0]}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: slot.no_show_rate > 5 ? colors.error : colors.success,
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
        <View style={[styles.columnCard, { backgroundColor: colors.card, borderColor: colors.border + '15' }]}>
          <Text style={[styles.columnLabel, { color: colors.secondary }]}>{t('analytics.noShows.byDay')}</Text>
          <View style={styles.list}>
            {data?.by_day_of_week.slice(0, 2).map((day: NoShowByDayOfWeek) => (
              <View key={day.day_of_week} style={styles.listItem}>
                <Text style={[styles.itemLabel, { color: colors.secondary }]} numberOfLines={1}>
                  {day.day_name.substring(0, 3)}
                </Text>
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: day.no_show_rate > 5 ? colors.error : colors.success,
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  columnCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 16,
    ...SHADOWS.sm,
  },
  columnLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 8,
    fontWeight: '800',
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
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  itemValue: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '900',
  },
});

