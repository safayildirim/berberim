import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Users } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { CohortMonth } from '@/src/types';

interface CohortAnalysisProps {
  cohorts: CohortMonth[];
  isLoading: boolean;
}

export const CohortAnalysisSection = ({
  cohorts,
  isLoading,
}: CohortAnalysisProps) => {
  const { t } = useTranslation();

  if (isLoading || cohorts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('analytics.cohorts.title')}</Text>
          <Users size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyText}>
          {isLoading ? t('common.loading') : t('analytics.cohorts.noData')}
        </Text>
      </View>
    );
  }

  // Find max periods for columns
  const maxPeriods = Math.max(...cohorts.map((c) => c.periods?.length ?? 0), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>{t('analytics.cohorts.title')}</Text>
          <Text style={styles.subtitle}>{t('analytics.cohorts.subtitle')}</Text>
        </View>
        <Users size={24} color={COLORS.primary + '60'} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableScroll}
      >
        <View style={styles.tableContainer}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.headerCell, styles.cohortColumn]}>
              {t('analytics.cohorts.cohort')}
            </Text>
            <Text style={[styles.headerCell, styles.sizeColumn]}>
              {t('analytics.cohorts.size')}
            </Text>
            {Array.from({ length: maxPeriods }, (_, i) => (
              <Text key={i} style={[styles.headerCell, styles.periodColumn]}>
                {t('analytics.cohorts.monthN', { n: i })}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {cohorts.map((cohort, index) => (
            <View key={cohort.cohort || index} style={styles.tableRow}>
              <Text style={[styles.cohortText, styles.cohortColumn]}>
                {cohort.cohort}
              </Text>
              <Text style={[styles.sizeText, styles.sizeColumn]}>
                {cohort.cohort_size}
              </Text>
              {Array.from({ length: maxPeriods }, (_, i) => {
                const period = cohort.periods?.find(
                  (p) => p.months_after === i,
                );
                if (!period) {
                  return (
                    <View key={i} style={[styles.periodCell, styles.emptyCell]}>
                      <Text style={styles.emptyCellText}>-</Text>
                    </View>
                  );
                }
                const rate = Math.round(period.retention_rate);
                return (
                  <View
                    key={i}
                    style={[
                      styles.periodCell,
                      { backgroundColor: getRetentionColor(rate) },
                    ]}
                  >
                    <Text style={styles.rateText}>{rate}%</Text>
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

function getRetentionColor(rate: number): string {
  // Using the emerald-based scale from HTML: #e0f7ef
  if (rate >= 100) return '#e0f7ef';
  if (rate >= 80) return 'rgba(224, 247, 239, 0.8)';
  if (rate >= 60) return 'rgba(224, 247, 239, 0.6)';
  if (rate >= 40) return 'rgba(224, 247, 239, 0.4)';
  if (rate >= 20) return 'rgba(224, 247, 239, 0.2)';
  return '#eceef0';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '10',
    // shadow is handled via style if needed but normally we use shadows.sm or similar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
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
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant + 'CC',
    lineHeight: 16,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
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
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
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
    color: COLORS.primary,
  },
  sizeText: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  periodCell: {
    width: 64,
    height: 44, // Matches the high-density feel
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyCell: {
    backgroundColor: 'rgba(236, 238, 240, 0.4)',
  },
  emptyCellText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant + '40',
  },
  rateText: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
