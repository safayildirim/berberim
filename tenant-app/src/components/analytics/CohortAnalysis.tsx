import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Users } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { CohortMonth } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface CohortAnalysisProps {
  cohorts: CohortMonth[];
  isLoading: boolean;
}

export const CohortAnalysisSection = ({
  cohorts,
  isLoading,
}: CohortAnalysisProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  if (isLoading || cohorts.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border + '15' },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {t('analytics.cohorts.title')}
          </Text>
          <Users size={20} color={colors.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.secondary }]}>
          {isLoading ? t('common.loading') : t('analytics.cohorts.noData')}
        </Text>
      </View>
    );
  }

  const maxPeriods = Math.max(...cohorts.map((c) => c.periods?.length ?? 0), 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border + '15' },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {t('analytics.cohorts.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('analytics.cohorts.subtitle')}
          </Text>
        </View>
        <Users size={24} color={colors.primary + '60'} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableScroll}
      >
        <View style={styles.tableContainer}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <Text
              style={[
                styles.headerCell,
                styles.cohortColumn,
                { color: colors.secondary },
              ]}
            >
              {t('analytics.cohorts.cohort')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.sizeColumn,
                { color: colors.secondary },
              ]}
            >
              {t('analytics.cohorts.size')}
            </Text>
            {Array.from({ length: maxPeriods }, (_, i) => (
              <Text
                key={i}
                style={[
                  styles.headerCell,
                  styles.periodColumn,
                  { color: colors.secondary },
                ]}
              >
                {t('analytics.cohorts.monthN', { n: i })}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {cohorts.map((cohort, index) => (
            <View key={cohort.cohort || index} style={styles.tableRow}>
              <Text
                style={[
                  styles.cohortText,
                  styles.cohortColumn,
                  { color: colors.primary },
                ]}
              >
                {cohort.cohort}
              </Text>
              <Text
                style={[
                  styles.sizeText,
                  styles.sizeColumn,
                  { color: colors.secondary },
                ]}
              >
                {cohort.cohort_size}
              </Text>
              {Array.from({ length: maxPeriods }, (_, i) => {
                const period = cohort.periods?.find(
                  (p) => p.months_after === i,
                );
                if (!period) {
                  return (
                    <View
                      key={i}
                      style={[
                        styles.periodCell,
                        { backgroundColor: colors.surfaceContainerLow },
                      ]}
                    >
                      <Text
                        style={[
                          styles.emptyCellText,
                          { color: colors.outline + '40' },
                        ]}
                      >
                        -
                      </Text>
                    </View>
                  );
                }
                const rate = Math.round(period.retention_rate);
                return (
                  <View
                    key={i}
                    style={[
                      styles.periodCell,
                      {
                        backgroundColor: getRetentionColor(
                          rate,
                          colors.success,
                          isDark,
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rateText,
                        { color: isDark ? colors.onPrimary : colors.primary },
                      ]}
                    >
                      {rate}%
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

function getRetentionColor(
  rate: number,
  baseColor: string,
  isDark: boolean,
): string {
  if (rate >= 100) return baseColor;
  if (rate >= 80) return baseColor + (isDark ? 'CC' : 'B3');
  if (rate >= 60) return baseColor + (isDark ? '99' : '80');
  if (rate >= 40) return baseColor + (isDark ? '66' : '4D');
  if (rate >= 20) return baseColor + (isDark ? '33' : '26');
  return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flex: 1,
    paddingRight: SIZES.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
    lineHeight: 16,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    paddingVertical: SIZES.lg,
  },
  tableScroll: {
    marginTop: 16,
  },
  tableContainer: {
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerCell: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cohortColumn: {
    width: 90,
  },
  sizeColumn: {
    width: 60,
    textAlign: 'center',
  },
  periodColumn: {
    width: 72,
    textAlign: 'center',
  },
  cohortText: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: '800',
  },
  sizeText: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodCell: {
    width: 64,
    height: 44,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyCellText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  rateText: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '900',
  },
});
